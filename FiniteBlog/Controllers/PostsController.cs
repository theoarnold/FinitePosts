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
        public async Task<ActionResult<PostDto>> GetPost(string slug, [FromQuery] string? deviceFingerprint)
        {
            try
            {
                string? visitorId = _visitorCookie.GetOrCreateVisitorId(HttpContext);
                
                // Extract client IP address
                string? ipAddress = GetClientIpAddress();

                PostDto? post = await _postService.GetPostAsync(slug, visitorId, deviceFingerprint, ipAddress);

                if (post == null)
                {
                    return NotFound();
                }

                return Ok(post);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting post {Slug}", slug);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("debug/client-info")]
        public ActionResult<object> GetClientInfo()
        {
            return Ok(new
            {
                IpAddress = GetClientIpAddress(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Timestamp = DateTime.Now
            });
        }

        private string? GetClientIpAddress()
        {
            // Try to get the real client IP address, accounting for proxies and load balancers
            string ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            
            if (!string.IsNullOrEmpty(ipAddress))
            {
                // X-Forwarded-For can contain multiple IPs, take the first one (original client)
                ipAddress = ipAddress.Split(',')[0].Trim();
            }
            
            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            }
            
            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            }
            
            // Remove IPv6 localhost mapping
            if (ipAddress == "::1")
            {
                ipAddress = "127.0.0.1";
            }
            
            return ipAddress;
        }

        [HttpGet]
        public async Task<ActionResult<List<FeedPostDto>>> GetRandomPosts([FromQuery] int count = 20)
        {
            if (count <= 0 || count > 100)
            {
                return BadRequest("Count must be between 1 and 100.");
            }

            var posts = await _postService.GetRandomPostsAsync(count);
            return Ok(posts);
        }

        [HttpPost]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
        public async Task<ActionResult<object>> CreatePost()
        {
            CreatePostDto postDto;
            
            // Check if request is multipart (has file) or JSON (text only)
            if (Request.ContentType?.StartsWith("multipart/form-data") == true)
            {
                // Handle multipart form data (with potential file upload)
                var content = Request.Form["content"].ToString();
                var viewLimitStr = Request.Form["viewLimit"].ToString();
                var file = Request.Form.Files.GetFile("file");
                
                // Debug logging
                _logger.LogInformation("Multipart request received. Content: '{Content}', ViewLimit: '{ViewLimit}', File count: {FileCount}", 
                    content, viewLimitStr, Request.Form.Files.Count);
                
                if (Request.Form.Files.Count > 0)
                {
                    foreach (var formFile in Request.Form.Files)
                    {
                        _logger.LogInformation("Form file key: '{Key}', Name: '{Name}', Size: {Size}", 
                            formFile.Name, formFile.FileName, formFile.Length);
                    }
                }
                
                if (!int.TryParse(viewLimitStr, out int viewLimit))
                {
                    return BadRequest("Invalid view limit value.");
                }
                
                postDto = new CreatePostDto
                {
                    Content = content,
                    ViewLimit = viewLimit,
                    File = file
                };
            }
            else
            {
                // Handle JSON data (text only posts)
                try
                {
                    postDto = await Request.ReadFromJsonAsync<CreatePostDto>();
                    if (postDto == null)
                    {
                        return BadRequest("Invalid request data.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error parsing JSON request");
                    return BadRequest("Invalid JSON data.");
                }
            }
            
            var (post, errorMessage) = await _postService.CreatePostAsync(postDto);
            
            if (errorMessage != null)
            {
                return BadRequest(errorMessage);
            }
            
            return CreatedAtAction(nameof(GetPost), new { slug = post.Slug }, post);
        }
    }
} 