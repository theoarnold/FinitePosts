using FiniteBlog.Models;
using FiniteBlog.DTOs;

namespace FiniteBlog.Services
{
    public interface IPostService
    {
        // Get a post by slug
        Task<PostDto?> GetPostAsync(string slug, string? visitorId, string? ipAddress);

        // Create a new post
        Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto);
        
        // Get only the view count for a post (more efficient)
        Task<ViewCountDto?> GetPostViewCountAsync(string slug);
        
        // Broadcast viewer count changes to all connected clients
        Task BroadcastViewerCountAsync(string slug, int activeViewers);

        Task BroadcastViewCountUpdateAsync(AnonymousPost post);
    }
} 