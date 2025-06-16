using FiniteBlog.Models;
using FiniteBlog.Repositories;
using FiniteBlog.Hubs;
using FiniteBlog.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace FiniteBlog.Services
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _repository;
        private readonly ILogger<PostService> _logger;
        private readonly IHubContext<PostHub> _hubContext;
        private readonly IBlobStorageService _blobStorageService;
        private readonly ConnectionManager _connectionManager;

        public PostService(
            IPostRepository repository,
            ILogger<PostService> logger,
            IHubContext<PostHub> hubContext,
            IBlobStorageService blobStorageService,
            ConnectionManager connectionManager)
        {
            _repository = repository;
            _logger = logger;
            _hubContext = hubContext;
            _blobStorageService = blobStorageService;
            _connectionManager = connectionManager;
        }

        public async Task<PostDto?> GetPostAsync(string slug, string? visitorId, string? ipAddress)
        {
            AnonymousPost? post = await _repository.GetPostBySlugAsync(slug);
            if (post == null)
            {
                return null;
            }

            await ProcessViewCountAsync(post, slug, visitorId, ipAddress);

            // Refresh the post to get updated view count after processing
            var updatedPost = await _repository.GetPostBySlugAsync(slug);
            if (updatedPost == null)
            {
                return null; // Post was deleted after reaching view limit
            }

            // Get current active viewers count
            int activeViewers = _connectionManager.GetActiveViewerCount(slug);

            PostDto postDto = new PostDto
            {
                Id = updatedPost.Id,
                Content = updatedPost.Content,
                Slug = updatedPost.Slug,
                ViewLimit = updatedPost.ViewLimit,
                CurrentViews = updatedPost.CurrentViews,
                CreatedAt = updatedPost.CreatedAt,
                AttachedFileName = updatedPost.AttachedFileName,
                AttachedFileUrl = updatedPost.AttachedFileUrl,
                AttachedFileContentType = updatedPost.AttachedFileContentType,
                AttachedFileSizeBytes = updatedPost.AttachedFileSizeBytes,
                ActiveViewers = activeViewers
            };

            return postDto;
        }

        private async Task ProcessViewCountAsync(AnonymousPost post, string slug, string? visitorId, string? ipAddress)
        {
            try
            {
                bool hasViewedByCookie = !string.IsNullOrEmpty(visitorId) && await _repository.HasVisitorViewedPostAsync(post.Id, visitorId);
                bool hasViewedByIp = !string.IsNullOrEmpty(ipAddress) && await _repository.HasIpViewedPostAsync(post.Id, ipAddress);

                if (!(hasViewedByCookie || hasViewedByIp))
                {
                    PostViewer viewer = new PostViewer
                    {
                        Id = Guid.NewGuid(),
                        PostId = post.Id,
                        VisitorId = visitorId ?? string.Empty,
                        IpAddress = ipAddress ?? string.Empty,
                        ViewedAt = DateTime.Now
                    };

                    await _repository.AddPostViewerAsync(viewer);
                    await _repository.IncrementViewCountAsync(post.Id);
                    await _repository.SaveChangesAsync();

                    // Refresh the post to get updated CurrentViews from database
                    var updatedPost = await _repository.GetPostBySlugAsync(slug);
                    if (updatedPost != null)
                    {
                        if (updatedPost.CurrentViews >= updatedPost.ViewLimit)
                        {
                            _logger.LogInformation($"Post {slug} has reached view limit ({updatedPost.ViewLimit}). Deleting post.");
                            await _repository.DeletePostAsync(updatedPost);
                            await _repository.SaveChangesAsync();
                        }
                        
                        await BroadcastViewCountUpdateAsync(updatedPost);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing view count for post {Slug}", slug);
            }
        }

        public async Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto)
        {
            _logger.LogInformation($"Creating post with view limit: {createDto.ViewLimit}, Content length: {createDto.Content?.Length ?? 0}, Has file: {createDto.File != null}");
            
            // Validate that either content or file is provided
            if (string.IsNullOrWhiteSpace(createDto.Content) && createDto.File == null)
            {
                _logger.LogWarning("Post creation failed: No content or file provided. Content: '{Content}', File: {HasFile}", createDto.Content, createDto.File != null);
                return (new PostDto(), "Either content or a file must be provided.");
            }

            if (createDto.ViewLimit <= 0)
            {
                return (new PostDto(), "View limit must be greater than 0.");
            }

            if (createDto.ViewLimit > 10000)
            {
                return (new PostDto(), "View limit cannot exceed 10000.");
            }

            // Handle file upload if present
            BlobUploadResult? fileUploadResult = null;
            if (createDto.File != null)
            {
                fileUploadResult = await _blobStorageService.UploadFileAsync(createDto.File);
                if (!fileUploadResult.Success)
                {
                    return (new PostDto(), fileUploadResult.ErrorMessage ?? "File upload failed.");
                }
            }

            string slug;
            bool slugExists;

            do
            {
                slug = SlugGenerator.GenerateRandomSlug();
                slugExists = await _repository.SlugExistsAsync(slug);
            } while (slugExists);

            AnonymousPost post = new()
            {
                Id = Guid.NewGuid(),
                Content = createDto.Content ?? string.Empty,
                Slug = slug,
                ViewLimit = createDto.ViewLimit,
                CurrentViews = 0,
                CreatedAt = DateTime.Now,
                AttachedFileName = fileUploadResult?.FileName,
                AttachedFileUrl = fileUploadResult?.Url,
                AttachedFileContentType = fileUploadResult?.ContentType,
                AttachedFileSizeBytes = fileUploadResult?.FileSizeBytes
            };

            try
            {
                await _repository.CreatePostAsync(post);
                await _repository.SaveChangesAsync();

                PostDto resultDto = new()
                {
                    Id = post.Id,
                    Content = post.Content,
                    Slug = post.Slug,
                    ViewLimit = post.ViewLimit,
                    CurrentViews = post.CurrentViews,
                    CreatedAt = post.CreatedAt,
                    AttachedFileName = post.AttachedFileName,
                    AttachedFileUrl = post.AttachedFileUrl,
                    AttachedFileContentType = post.AttachedFileContentType,
                    AttachedFileSizeBytes = post.AttachedFileSizeBytes
                };
                
                _logger.LogInformation($"Created post with ID: {post.Id}, slug: {post.Slug}");
                return (resultDto, null);
            }
            catch (Exception ex)
            {
                // If post creation fails and we uploaded a file, clean it up
                if (fileUploadResult?.Success == true && !string.IsNullOrEmpty(fileUploadResult.FileName))
                {
                    try
                    {
                        await _blobStorageService.DeleteFileAsync(fileUploadResult.FileName);
                        _logger.LogInformation("Cleaned up uploaded file after post creation failure: {FileName}", fileUploadResult.FileName);
                    }
                    catch (Exception cleanupEx)
                    {
                        _logger.LogWarning(cleanupEx, "Failed to clean up uploaded file after post creation failure: {FileName}", fileUploadResult.FileName);
                    }
                }
                
                _logger.LogError(ex, "Error creating post");
                return (new PostDto(), "An error occurred while creating the post.");
            }
        }
        
        public async Task<ViewCountDto?> GetPostViewCountAsync(string slug)
        {
            AnonymousPost? post = await _repository.GetPostBySlugAsync(slug);

            if (post == null)
            {
                _logger.LogWarning($"Post with slug {slug} not found when fetching view count");
                return null;
            }

            ViewCountDto viewCountDto = new ViewCountDto
            {
                CurrentViews = post.CurrentViews,
                ViewLimit = post.ViewLimit
            };

            return viewCountDto;
        }

        public async Task BroadcastViewCountUpdateAsync(AnonymousPost post)
        {
            int activeViewers = _connectionManager.GetActiveViewerCount(post.Slug);
            
            await _hubContext.Clients.Group(post.Slug).SendAsync("ReceiveViewUpdate", new 
            {
                slug = post.Slug,
                currentViews = post.CurrentViews,
                viewLimit = post.ViewLimit,
                activeViewers = activeViewers
            });
        }

        public async Task<List<FeedPostDto>> GetRandomPostsForFeedAsync(int count)
        {
            _logger.LogInformation($"GetRandomPostsForFeedAsync called with count: {count}");
            
            var posts = await _repository.GetRandomPostsAsync(count);
            
            _logger.LogInformation($"Retrieved {posts.Count} posts from repository");
            
            var result = posts.Select(post => new FeedPostDto
            {
                Slug = post.Slug,
                Preview = GetPreview(post.Content, 20),
                CreatedAt = post.CreatedAt,
                ViewLimit = post.ViewLimit,
                CurrentViews = post.CurrentViews,
                ActiveViewers = _connectionManager.GetActiveViewerCount(post.Slug),
                HasAttachment = !string.IsNullOrEmpty(post.AttachedFileName)
            }).ToList();
            
            _logger.LogInformation($"Returning {result.Count} feed posts");
            
            return result;
        }

        private static string GetPreview(string content, int characterCount)
        {
            if (string.IsNullOrWhiteSpace(content))
                return "";
                
            if (content.Length <= characterCount)
                return content;
                
            return content.Substring(0, characterCount) + "...";
        }
    }
} 