using FiniteBlog.Models;

namespace FiniteBlog.Repositories
{
    public interface IPostRepository
    {
        Task<AnonymousPost?> GetPostBySlugAsync(string slug);

        Task<bool> SlugExistsAsync(string slug);

        Task<AnonymousPost> CreatePostAsync(AnonymousPost post);

        Task UpdatePostAsync(AnonymousPost post);

        Task DeletePostAsync(AnonymousPost post);

        Task<int> SaveChangesAsync();

        Task<bool> HasVisitorViewedPostAsync(Guid postId, string visitorId);

        Task<bool> HasIpViewedPostAsync(Guid postId, string ipAddress);

        Task AddPostViewerAsync(PostViewer viewer);

        Task IncrementViewCountAsync(Guid postId);
<<<<<<< HEAD

        Task<List<AnonymousPost>> GetRandomPostsAsync(int count);
=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
    }
} 