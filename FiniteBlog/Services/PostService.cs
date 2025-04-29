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

        public PostService(
            IPostRepository repository,
            ILogger<PostService> logger,
            IHubContext<PostHub> hubContext)
        {
            _repository = repository;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async Task<PostDto?> GetPostAsync(string slug, string? visitorId, string? ipAddress)
        {
            AnonymousPost? post = await _repository.GetPostBySlugAsync(slug);
            if (post == null)
            {
                return null;
            }

            PostDto postDto = new PostDto
            {
                Id = post.Id,
                Content = post.Content,
                Slug = post.Slug,
                ViewLimit = post.ViewLimit,
                CurrentViews = post.CurrentViews,
                CreatedAt = post.CreatedAt
            };

            await ProcessViewCountAsync(post, slug, visitorId, ipAddress);

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
                        ViewedAt = DateTime.UtcNow
                    };

                    await _repository.AddPostViewerAsync(viewer);
                    await _repository.IncrementViewCountAsync(post.Id);

                    if (post != null && post.CurrentViews +1 >= post.ViewLimit)
                    {
                        _logger.LogInformation($"Post {slug} has reached view limit ({post.ViewLimit}). Deleting post.");
                        await _repository.DeletePostAsync(post);
                    }

                    await _repository.SaveChangesAsync();
                    await BroadcastViewCountUpdateAsync(post);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing view count for post {Slug}", slug);
            }
        }

        public async Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto)
        {
            _logger.LogInformation($"Creating post with view limit: {createDto.ViewLimit}");
            
            if (string.IsNullOrWhiteSpace(createDto.Content))
            {
                return (new PostDto(), "Content cannot be empty.");
            }

            if (createDto.ViewLimit <= 0)
            {
                return (new PostDto(), "View limit must be greater than 0.");
            }

            if (createDto.ViewLimit > 10000)
            {
                return (new PostDto(), "View limit cannot exceed 10000.");
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
                Content = createDto.Content,
                Slug = slug,
                ViewLimit = createDto.ViewLimit,
                CurrentViews = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.CreatePostAsync(post);
            await _repository.SaveChangesAsync();

            PostDto resultDto = new()
            {
                Id = post.Id,
                Content = post.Content,
                Slug = post.Slug,
                ViewLimit = post.ViewLimit,
                CurrentViews = post.CurrentViews,
                CreatedAt = post.CreatedAt
            };
            
            _logger.LogInformation($"Created post with ID: {post.Id}, slug: {post.Slug}");
            return (resultDto, null);
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
            await _hubContext.Clients.Group(post.Slug).SendAsync("ReceiveViewUpdate", new 
            {
                currentViews = post.CurrentViews,
                viewLimit = post.ViewLimit
            });
        }
    }
} 