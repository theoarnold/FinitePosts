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

        public async Task<PostDto?> GetPostAsync(string slug)
        {
            AnonymousPost? post = await _repository.GetPostBySlugAsync(slug);
            if (post == null)
            {
                return null;
            }

            // Get current active viewers count
            int activeViewers = _connectionManager.GetActiveViewerCount(slug);

            // Get drawings for this post
            List<PostDrawing> drawings = await _repository.GetDrawingsForPostAsync(post.Id);
            List<PostDrawingDto> drawingDtos = drawings.Select(d => new PostDrawingDto
            {
                Id = d.Id,
                Text = d.Text,
                PositionX = d.PositionX,
                PositionY = d.PositionY,
                CreatedByFingerprint = d.CreatedByFingerprint,
                CreatedAt = d.CreatedAt
            }).ToList();

            PostDto postDto = new PostDto
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
                AttachedFileSizeBytes = post.AttachedFileSizeBytes,
                ActiveViewers = activeViewers,
                Drawings = drawingDtos
            };

            return postDto;
        }

        public async Task<ViewCountDto?> ProcessPostViewAsync(string slug, string? visitorId, string? deviceFingerprint, string? ipAddress)
        {
            AnonymousPost? post = await _repository.GetPostBySlugAsync(slug);
            if (post == null)
            {
                return null;
            }

            await ProcessViewCountAsync(post, slug, visitorId, deviceFingerprint, ipAddress);

            AnonymousPost? updatedPost = await _repository.GetPostBySlugAsync(slug);
            if (updatedPost == null)
            {
                // Post was deleted after reaching view limit
                return new ViewCountDto
                {
                    Slug = slug,
                    CurrentViews = post.ViewLimit,
                    ViewLimit = post.ViewLimit,
                };
            }

            return new ViewCountDto
            {
                Slug = updatedPost.Slug,
                CurrentViews = updatedPost.CurrentViews,
                ViewLimit = updatedPost.ViewLimit,
            };
        }

        private async Task ProcessViewCountAsync(AnonymousPost post, string slug, string? visitorId, string? deviceFingerprint, string? ipAddress)
        {
            try
            {
                _logger.LogInformation($"Processing view count for post {slug}. VisitorId: {visitorId}, DeviceFingerprint: {deviceFingerprint}, IpAddress: {ipAddress}");
                
                string compositeFingerprint = CreateCompositeFingerprint(deviceFingerprint, ipAddress);
                
                bool hasViewedByCookie = !string.IsNullOrEmpty(visitorId) && await _repository.HasVisitorViewedPostAsync(post.Id, visitorId);
                bool hasViewedByComposite = !string.IsNullOrEmpty(compositeFingerprint) && await _repository.HasFingerprintViewedPostAsync(post.Id, compositeFingerprint);

                _logger.LogInformation($"Post {slug} - HasViewedByCookie: {hasViewedByCookie}, HasViewedByComposite: {hasViewedByComposite} (Composite: {compositeFingerprint})");

                if (!(hasViewedByCookie || hasViewedByComposite))
                {
                    _logger.LogInformation($"Recording new view for post {slug} - no previous views detected by any identification method");
                    
                    PostViewer viewer = new PostViewer
                    {
                        Id = Guid.NewGuid(),
                        PostId = post.Id,
                        VisitorId = visitorId ?? string.Empty,
                        BrowserFingerprint = compositeFingerprint,
                        ViewedAt = DateTime.Now
                    };
                    await _repository.AddPostViewerAsync(viewer);

                    await _repository.IncrementViewCountAsync(post.Id);
                    await _repository.SaveChangesAsync();

                    AnonymousPost? updatedPost = await _repository.GetPostBySlugAsync(slug);
                    if (updatedPost != null)
                    {
                        _logger.LogInformation($"Post {slug} view count updated to {updatedPost.CurrentViews}/{updatedPost.ViewLimit}");
                        
                        if (updatedPost.CurrentViews >= updatedPost.ViewLimit)
                        {
                            _logger.LogInformation($"Post {slug} has reached view limit ({updatedPost.ViewLimit}). Deleting post.");
                            
                            if (!string.IsNullOrEmpty(updatedPost.AttachedFileName))
                            {
                                try
                                {
                                    bool fileDeleted = await _blobStorageService.DeleteFileAsync(updatedPost.AttachedFileName);
                                    _logger.LogInformation($"File cleanup for post {slug}: {(fileDeleted ? "success" : "file not found")} - {updatedPost.AttachedFileName}");
                                }
                                catch (Exception fileEx)
                                {
                                    _logger.LogWarning(fileEx, $"Failed to delete attached file for post {slug}: {updatedPost.AttachedFileName}");
                                }
                            }
                            
                            await _repository.DeletePostViewersAsync(updatedPost.Id);
                            await _repository.DeletePostDrawingsAsync(updatedPost.Id);
                            await _repository.DeletePostAsync(updatedPost);
                            await _repository.SaveChangesAsync();
                        }
                        
                        await BroadcastViewCountUpdateAsync(updatedPost);
                    }
                }
                else
                {
                    _logger.LogInformation($"Skipping view count for post {slug} - already viewed by this visitor (Cookie: {hasViewedByCookie}, Composite: {hasViewedByComposite})");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing view count for post {Slug}", slug);
            }
        }

        private string CreateCompositeFingerprint(string? deviceFingerprint, string? ipAddress)
        {
            List<string> components = [];
            
            if (!string.IsNullOrEmpty(deviceFingerprint))
                components.Add(deviceFingerprint);
                
            if (!string.IsNullOrEmpty(ipAddress))
                components.Add(ipAddress);
            
            if (components.Count == 0)
                return string.Empty;
                
            return string.Join("|", components);
        }

        public async Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto)
        {
            _logger.LogInformation($"Creating post with view limit: {createDto.ViewLimit}, Content length: {createDto.Content?.Length ?? 0}, Has file: {createDto.File != null}");
            
            // Validate that content is provided
            if (string.IsNullOrWhiteSpace(createDto.Content))
            {
                _logger.LogWarning("Post creation failed: No content provided. Content: '{Content}'", createDto.Content);
                return (new PostDto(), "Text content is required for all posts.");
            }

            if (createDto.ViewLimit <= 0)
            {
                return (new PostDto(), "View limit must be greater than 0.");
            }

            if (createDto.ViewLimit > 9999)
            {
                return (new PostDto(), "View limit cannot exceed 9999.");
            }

            // Handle file upload if present
            BlobUploadResult? fileUploadResult = null;
            if (createDto.File != null)
            {
                try
                {
                    fileUploadResult = await _blobStorageService.UploadFileAsync(createDto.File);
                }
                catch (InvalidOperationException ex)
                {
                    return (new PostDto(), ex.Message);
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
                if (fileUploadResult != null && !string.IsNullOrEmpty(fileUploadResult.FileName))
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
            });
        }

        public async Task<List<FeedPostDto>> GetRandomPostsAsync(int count)
        {
            _logger.LogInformation($"GetRandomPostsAsync called with count: {count}");
            
            List<AnonymousPost> posts = await _repository.GetRandomPostsAsync(count);
            
            _logger.LogInformation($"Retrieved {posts.Count} posts from repository");

            List<FeedPostDto> result = posts.Select(post => new FeedPostDto
            {
                Slug = post.Slug,
                Preview = GetPreview(post.Content, 250),
                CreatedAt = post.CreatedAt,
                ViewLimit = post.ViewLimit,
                CurrentViews = post.CurrentViews,
                ActiveViewers = _connectionManager.GetActiveViewerCount(post.Slug),
                HasAttachment = !string.IsNullOrEmpty(post.AttachedFileName),
                AttachedFileUrl = post.AttachedFileUrl,
                AttachedFileContentType = post.AttachedFileContentType
            }).ToList();
            
            _logger.LogInformation($"Returning {result.Count} feed posts");
            
            return result;
        }

        private static string GetPreview(string content, int characterCount)
        {
            // Find first newline
            int newlineIndex = content.IndexOfAny(new[] { '\r', '\n' });
            
            // Use newline position if it comes before character limit, otherwise use character limit
            int cutoff = newlineIndex >= 0 && newlineIndex < characterCount ? newlineIndex : characterCount;
            
            if (content.Length <= cutoff)
                return content.Trim();
                
            return content.Substring(0, cutoff).Trim() + "...";
        }

        public async Task AddDrawingToPostAsync(string slug, string text, double positionX, double positionY, string deviceFingerprint)
        {
            var post = await _repository.GetPostBySlugAsync(slug);
            if (post == null)
            {
                return;
            }

            await _repository.RemoveDrawingsByFingerprintAsync(post.Id, deviceFingerprint);

            PostDrawing drawing = new()
            {
                Id = Guid.NewGuid(),
                PostId = post.Id,
                Text = text,
                PositionX = positionX,
                PositionY = positionY,
                CreatedByFingerprint = deviceFingerprint,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddDrawingToPostAsync(drawing);
            await _repository.SaveChangesAsync();
        }
    }
} 