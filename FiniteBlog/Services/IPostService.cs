using FiniteBlog.Models;
using FiniteBlog.DTOs;

namespace FiniteBlog.Services
{
    public interface IPostService
    {
        Task<PostDto?> GetPostAsync(string slug);
        Task<ViewCountDto?> ProcessPostViewAsync(string slug, string? visitorId, string? deviceFingerprint, string? ipAddress);
        Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto);
        Task<ViewCountDto?> GetPostViewCountAsync(string slug);
        Task BroadcastViewCountUpdateAsync(AnonymousPost post);
        Task<List<FeedPostDto>> GetRandomPostsAsync(int count);
        Task AddDrawingToPostAsync(string slug, string text, double positionX, double positionY, string deviceFingerprint);
    }
} 