using Microsoft.EntityFrameworkCore;
using FiniteBlog.Data;
using FiniteBlog.Models;

namespace FiniteBlog.Repositories
{
    /// <summary>
    /// Implementation of the post repository for data access
    /// </summary>
    public class PostRepository : IPostRepository
    {
        private readonly ApplicationDbContext _context;

        public PostRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AnonymousPost?> GetPostBySlugAsync(string slug)
        {
            return await _context.AnonymousPosts
                .Include(p => p.Viewers)
                .FirstOrDefaultAsync(p => p.Slug == slug);
        }

        public async Task<bool> SlugExistsAsync(string slug)
        {
            return await _context.AnonymousPosts
                .AnyAsync(p => p.Slug == slug);
        }

        public async Task<AnonymousPost> CreatePostAsync(AnonymousPost post)
        {
            await _context.AnonymousPosts.AddAsync(post);
            return post;
        }

        public Task UpdatePostAsync(AnonymousPost post)
        {
            _context.Update(post);
            return Task.CompletedTask;
        }

        public Task DeletePostAsync(AnonymousPost post)
        {
            _context.AnonymousPosts.Remove(post);
            return Task.CompletedTask;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task<bool> HasVisitorViewedPostAsync(Guid postId, string visitorId)
        {
            return await _context.PostViewers
                .AnyAsync(pv => pv.PostId == postId && pv.VisitorId == visitorId);
        }

        public async Task AddPostViewerAsync(PostViewer viewer)
        {
            await _context.PostViewers.AddAsync(viewer);
        }

        public async Task<bool> HasIpViewedPostAsync(Guid postId, string ipAddress)
        {
            return await _context.PostViewers
                .AnyAsync(pv => pv.PostId == postId && pv.IpAddress == ipAddress);
        }

        public Task IncrementViewCountAsync(Guid postId)
        {
            AnonymousPost? post = _context.AnonymousPosts.Find(postId);
            if (post != null) { post.CurrentViews += 1; }

            return Task.CompletedTask;
        }
<<<<<<< HEAD

        public async Task<List<AnonymousPost>> GetRandomPostsAsync(int count)
        {
            // Get all posts ordered by creation date (most recent first) and take the requested count
            // This is much more efficient than the previous Guid.NewGuid() approach
            // and more reliable than the complex random selection
            return await _context.AnonymousPosts
                .OrderByDescending(x => x.CreatedAt)
                .Take(count)
                .ToListAsync();
        }
=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
    }
} 