using FiniteBlog.Models;
using FiniteBlog.DTOs;

namespace FiniteBlog.Services
{
    public interface IPostService
    {
        Task<PostDto?> GetPostAsync(string slug, string? visitorId, string? ipAddress);

        Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto);
        
        Task<ViewCountDto?> GetPostViewCountAsync(string slug);

        Task BroadcastViewCountUpdateAsync(AnonymousPost post);

        Task<List<FeedPostDto>> GetRandomPostsForFeedAsync(int count);
    }
} 