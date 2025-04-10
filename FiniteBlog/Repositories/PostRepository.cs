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

        public async Task IncrementViewCountAsync(Guid postId)
        {
            await _context.AnonymousPosts
                .Where(p => p.Id == postId)
                .ExecuteUpdateAsync(p =>
                    p.SetProperty(x => x.CurrentViews, x => x.CurrentViews + 1));
        }
    }
} 