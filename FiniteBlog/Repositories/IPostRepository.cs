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

        Task<bool> HasFingerprintViewedPostAsync(Guid postId, string browserFingerprint);

        Task AddPostViewerAsync(PostViewer viewer);

        Task IncrementViewCountAsync(Guid postId);

        Task<List<AnonymousPost>> GetRandomPostsAsync(int count);

        Task AddDrawingToPostAsync(PostDrawing drawing);

        Task RemoveDrawingsByFingerprintAsync(Guid postId, string deviceFingerprint);

        Task<List<PostDrawing>> GetDrawingsForPostAsync(Guid postId);
    }
} 