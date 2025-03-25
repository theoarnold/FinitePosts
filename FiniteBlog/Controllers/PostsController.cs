using Microsoft.AspNetCore.Mvc;
using FiniteBlog.Services;
using FiniteBlog.DTOs;

namespace FiniteBlog.Controllers
{
    [ApiController]
    [Route("api/posts")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly IVisitorService _visitorService;
        private readonly ILogger<PostsController> _logger;

        public PostsController(
            IPostService postService,
            IVisitorService visitorService,
            ILogger<PostsController> logger)
        {
            _postService = postService;
            _visitorService = visitorService;
            _logger = logger;
        }

        [HttpGet("{slug}")]
        public async Task<ActionResult<object>> GetPost(string slug)
        {
            string visitorId = _visitorService.GetOrCreateVisitorId(HttpContext);
            string? ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            
            if (ipAddress == "::1" || ipAddress == "127.0.0.1")
            {
                ipAddress = "localhost";
            }
            
            _logger.LogInformation($"Client IP address: {ipAddress ?? "unknown"}");

            PostDto? post = await _postService.GetPostAsync(slug, visitorId, ipAddress);
            
            if (post == null)
            {
                return NotFound();
            }
            
            return post;
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreatePost(CreatePostDto postDto)
        {
            var (post, errorMessage) = await _postService.CreatePostAsync(postDto);
            
            if (errorMessage != null)
            {
                return BadRequest(errorMessage);
            }
            
            return CreatedAtAction(nameof(GetPost), new { slug = post.Slug }, post);
        }
        
        [HttpGet("{slug}/views")]
        public async Task<ActionResult<ViewCountDto>> GetPostViewCount(string slug)
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