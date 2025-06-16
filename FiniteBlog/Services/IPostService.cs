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
<<<<<<< HEAD

        Task<List<FeedPostDto>> GetRandomPostsForFeedAsync(int count);
=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
    }
} 