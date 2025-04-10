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
        private readonly VisitorCookie _visitorCookie;
        private readonly ILogger<PostsController> _logger;

        public PostsController(
            IPostService postService,
            VisitorCookie visitorCookie,
            ILogger<PostsController> logger)
        {
            _postService = postService;
            _visitorCookie = visitorCookie;
            _logger = logger;
        }

        [HttpGet("{slug}")]
        public async Task<ActionResult<object>> GetPost(string slug)
        {
            string visitorId = _visitorCookie.GetOrCreateVisitorId(HttpContext);
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
    }
} 