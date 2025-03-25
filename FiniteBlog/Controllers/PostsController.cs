using Microsoft.AspNetCore.Mvc;
using FiniteBlog.Services;
namespace FiniteBlog.Controllers
{
    [ApiController]
    [Route("api/posts")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly ILogger<PostsController> _logger;

        public PostsController(
            IPostService postService,
            ILogger<PostsController> logger)
        {
            _postService = postService;
            _logger = logger;
        }

        // DTO for creating posts
        public class CreatePostDto
        {
            public string Content { get; set; } = string.Empty;
            public int ViewLimit { get; set; }
        }

        // GET: api/posts/{slug}
        [HttpGet("{slug}")]
        public async Task<ActionResult<object>> GetPost(string slug)
        {
            // Get or create visitor ID
            string visitorId = Request.Cookies["visitor_id"];
            if (string.IsNullOrEmpty(visitorId))
            {
                visitorId = Guid.NewGuid().ToString();
                Response.Cookies.Append("visitor_id", visitorId, new CookieOptions
                {
                    Expires = DateTimeOffset.UtcNow.AddYears(1),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax
                });
                _logger.LogInformation($"Generated new visitor ID: {visitorId}");
            }
            else
            {
                _logger.LogInformation($"Using existing visitor ID: {visitorId}");
            }

            // Get client IP address
            string? ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            
            // Normalize localhost IP addresses (::1 and 127.0.0.1 should be treated the same)
            if (ipAddress == "::1" || ipAddress == "127.0.0.1")
            {
                ipAddress = "localhost";
            }
            
            _logger.LogInformation($"Client IP address: {ipAddress ?? "unknown"}");

            var post = await _postService.GetPostAsync(slug, visitorId, ipAddress);
            
            if (post == null)
            {
                return NotFound();
            }
            
            return post;
        }

        // POST: api/posts
        [HttpPost]
        public async Task<ActionResult<object>> CreatePost(IPostService.CreatePostDto postDto)
        {
            var (post, errorMessage) = await _postService.CreatePostAsync(postDto);
            
            if (errorMessage != null)
            {
                return BadRequest(errorMessage);
            }
            
            return CreatedAtAction(nameof(GetPost), new { slug = post.Slug }, post);
        }
        
        // GET: api/posts/{slug}/views
        [HttpGet("{slug}/views")]
        public async Task<ActionResult<IPostService.ViewCountDto>> GetPostViewCount(string slug)
        {
            var viewCount = await _postService.GetPostViewCountAsync(slug);
            
            if (viewCount == null)
            {
                return NotFound();
            }
            
            return viewCount;
        }
    }
} 