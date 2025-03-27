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
        private static readonly object _lock = new object();
        private static readonly Dictionary<string, SemaphoreSlim> _postLocks = new Dictionary<string, SemaphoreSlim>();

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
            _logger.LogInformation($"Getting post with slug: {slug}");
            _logger.LogInformation($"Visitor ID: {visitorId ?? "none"}, IP: {ipAddress ?? "unknown"}");

            AnonymousPost? post = await _repository.GetPostBySlugAsync(slug);

            if (post == null)
            {
                _logger.LogWarning($"Post with slug {slug} not found");
                return null;
            }

            _logger.LogInformation($"Found post. Current views: {post.CurrentViews}/{post.ViewLimit}");
            
            // Check if we've reached or exceeded the view limit
            if (post.CurrentViews >= post.ViewLimit)
            {
                _logger.LogInformation($"Post {slug} has reached view limit ({post.ViewLimit}). Deleting post.");
                await _repository.DeletePostAsync(post);
                await _repository.SaveChangesAsync();
                return null;
            }
            
            bool viewCountChanged = false;
            
            // Get or create a lock for this specific post
            SemaphoreSlim postLock;
            lock (_postLocks)
            {
                if (!_postLocks.TryGetValue(slug, out postLock))
                {
                    postLock = new SemaphoreSlim(1, 1);
                    _postLocks[slug] = postLock;
                }
            }

            try
            {
                await postLock.WaitAsync();

                // Check if this visitor has already viewed the post by either cookie or IP
                bool hasViewedByCookie = !string.IsNullOrEmpty(visitorId) && 
                    await _repository.HasVisitorViewedPostAsync(post.Id, visitorId);
                bool hasViewedByIp = !string.IsNullOrEmpty(ipAddress) && 
                    await _repository.HasIpViewedPostAsync(post.Id, ipAddress);

                _logger.LogInformation($"Visitor has viewed by cookie: {hasViewedByCookie}, by IP: {hasViewedByIp}");

                // Only increment view count for completely new visitors (neither cookie nor IP match)
                if (!(hasViewedByCookie || hasViewedByIp))
                {
                    _logger.LogInformation($"New visitor detected. Incrementing view count from {post.CurrentViews} to {post.CurrentViews + 1}");
                    
                    // Create a new viewer record
                    var viewer = new PostViewer
                    {
                        Id = Guid.NewGuid(),
                        PostId = post.Id,
                        VisitorId = visitorId ?? string.Empty,
                        IpAddress = ipAddress ?? string.Empty,
                        ViewedAt = DateTime.UtcNow
                    };
                    
                    await _repository.AddPostViewerAsync(viewer);
                    post.CurrentViews += 1;
                    viewCountChanged = true;

                    // Update the post
                    await _repository.UpdatePostAsync(post);
                    await _repository.SaveChangesAsync();

                    // Check if we've reached the view limit after incrementing
                    if (post.CurrentViews >= post.ViewLimit)
                    {
                        _logger.LogInformation($"Post {slug} has reached view limit ({post.ViewLimit}) after increment. Deleting post.");
                        await _repository.DeletePostAsync(post);
                        await _repository.SaveChangesAsync();
                        // Still return the post one last time to this viewer
                    }
                }
            }
            finally
            {
                postLock.Release();
            }

            // Map to DTO
            var postDto = new PostDto
            {
                Id = post.Id,
                Content = post.Content,
                Slug = post.Slug,
                ViewLimit = post.ViewLimit,
                CurrentViews = post.CurrentViews,
                CreatedAt = post.CreatedAt
            };
            
            // Broadcast the view count update to all clients if it changed
            if (viewCountChanged)
            {
                await BroadcastViewCountUpdateAsync(post);
            }
            
            return postDto;
        }

        public async Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto)
        {
            _logger.LogInformation($"Creating post with view limit: {createDto.ViewLimit}");
            
            if (string.IsNullOrWhiteSpace(createDto.Content))
            {
                _logger.LogWarning("Attempted to create post with empty content");
                return (new PostDto(), "Content cannot be empty.");
            }

            if (createDto.ViewLimit <= 0)
            {
                _logger.LogWarning($"Attempted to create post with invalid view limit: {createDto.ViewLimit}");
                return (new PostDto(), "View limit must be greater than 0.");
            }

            if (createDto.ViewLimit > 10000)
            {
                _logger.LogWarning($"Attempted to create post with view limit exceeding maximum: {createDto.ViewLimit}");
                return (new PostDto(), "View limit cannot exceed 10000.");
            }

            // Generate a unique slug
            string slug;
            bool slugExists;
            do
            {
                slug = SlugGenerator.GenerateRandomSlug();
                slugExists = await _repository.SlugExistsAsync(slug);
            } while (slugExists);

            _logger.LogInformation($"Generated slug: {slug}");

            AnonymousPost post = new AnonymousPost
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

            // Map to DTO
            var resultDto = new PostDto
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

            var viewCountDto = new ViewCountDto
            {
                CurrentViews = post.CurrentViews,
                ViewLimit = post.ViewLimit
            };

            return viewCountDto;
        }
        
        public async Task BroadcastViewerCountAsync(string slug, int activeViewers)
        {
            var post = await _repository.GetPostBySlugAsync(slug);
            
            if (post == null)
            {
                _logger.LogWarning($"Post with slug {slug} not found when broadcasting view count");
                return;
            }
            
            // Broadcast the view count update to all clients connected to this post
            await _hubContext.Clients.Group(slug).SendAsync("ReceiveViewUpdate", new 
            {
                currentViews = post.CurrentViews,
                viewLimit = post.ViewLimit,
            });
            
            _logger.LogInformation($"Broadcasted view update to clients for post {slug}: {post.CurrentViews}/{post.ViewLimit} with {activeViewers} active viewers");
        }

        // Method that doesn't depend on active viewers count
        public async Task BroadcastViewCountUpdateAsync(AnonymousPost post)
        {
            // Broadcast just the view count update
            await _hubContext.Clients.Group(post.Slug).SendAsync("ReceiveViewUpdate", new 
            {
                currentViews = post.CurrentViews,
                viewLimit = post.ViewLimit
            });
            
            _logger.LogInformation($"Broadcasted view count update to clients for post {post.Slug}: {post.CurrentViews}/{post.ViewLimit}");
        }
    }
} 