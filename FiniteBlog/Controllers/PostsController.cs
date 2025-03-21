using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FiniteBlog.Data;
using FiniteBlog.Models;
using FiniteBlog.Services;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;

namespace FiniteBlog.Controllers
{
    [ApiController]
    [Route("api/posts")]
    public class PostsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly SlugGeneratorService _slugGenerator;
        private readonly ILogger<PostsController> _logger;

        public PostsController(
            ApplicationDbContext context, 
            SlugGeneratorService slugGenerator,
            ILogger<PostsController> logger)
        {
            _context = context;
            _slugGenerator = slugGenerator;
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
            _logger.LogInformation($"Getting post with slug: {slug}");
            
            var post = await _context.AnonymousPosts.FirstOrDefaultAsync(p => p.Slug == slug);

            if (post == null)
            {
                _logger.LogWarning($"Post with slug {slug} not found");
                return NotFound();
            }

            // Get client IP
            string? clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            _logger.LogInformation($"Request from IP: {clientIp}");
            
            if (clientIp != null && !post.ViewerIps.Contains(clientIp))
            {
                // Only increment the view count for unique IPs
                post.ViewerIps.Add(clientIp);
                post.CurrentViews = post.ViewerIps.Count; // Set current views to unique IP count
                _logger.LogInformation($"Incrementing view count to {post.CurrentViews}");

                // Check if we've reached the view limit
                if (post.CurrentViews >= post.ViewLimit)
                {
                    _logger.LogInformation($"Removing post with slug {slug} after reaching view limit");
                    _context.AnonymousPosts.Remove(post);
                }
                else
                {
                    _context.Update(post);
                }

                await _context.SaveChangesAsync();
            }
            else
            {
                _logger.LogInformation($"IP {clientIp} has already viewed this post. Not incrementing view count.");
            }

            // Don't return the IP list in the response
            var result = new
            {
                post.Id,
                post.Content,
                post.Slug,
                post.ViewLimit,
                post.CurrentViews,
                post.CreatedAt
            };
            
            _logger.LogInformation($"Returning post data: {JsonSerializer.Serialize(result)}");
            return result;
        }

        // POST: api/posts
        [HttpPost]
        public async Task<ActionResult<object>> CreatePost(CreatePostDto postDto)
        {
            _logger.LogInformation($"Creating post with view limit: {postDto.ViewLimit}");
            
            if (string.IsNullOrWhiteSpace(postDto.Content))
            {
                _logger.LogWarning("Attempted to create post with empty content");
                return BadRequest("Content cannot be empty.");
            }

            if (postDto.ViewLimit <= 0)
            {
                _logger.LogWarning($"Attempted to create post with invalid view limit: {postDto.ViewLimit}");
                return BadRequest("View limit must be greater than 0.");
            }

            if (postDto.ViewLimit > 10000)
            {
                _logger.LogWarning($"Attempted to create post with view limit exceeding maximum: {postDto.ViewLimit}");
                return BadRequest("View limit cannot exceed 10000.");
            }

            // Generate a unique slug
            string slug;
            bool slugExists;
            do
            {
                slug = _slugGenerator.GenerateRandomSlug();
                slugExists = await _context.AnonymousPosts.AnyAsync(p => p.Slug == slug);
            } while (slugExists);

            _logger.LogInformation($"Generated slug: {slug}");

            var post = new AnonymousPost
            {
                Id = Guid.NewGuid(),
                Content = postDto.Content,
                Slug = slug,
                ViewLimit = postDto.ViewLimit,
                CurrentViews = 0,
                CreatedAt = DateTime.UtcNow,
                ViewerIps = new List<string>()
            };

            _context.AnonymousPosts.Add(post);
            await _context.SaveChangesAsync();

            // Return the created post without the IP list
            var result = new
            {
                post.Id,
                post.Content,
                post.Slug,
                post.ViewLimit,
                post.CurrentViews,
                post.CreatedAt
            };
            
            _logger.LogInformation($"Created post with ID: {post.Id}, slug: {post.Slug}");
            return CreatedAtAction(nameof(GetPost), new { slug = post.Slug }, result);
        }
    }
} 