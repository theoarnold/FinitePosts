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

        public async Task<bool> HasFingerprintViewedPostAsync(Guid postId, string browserFingerprint)
        {
            return await _context.PostViewers
                .AnyAsync(pv => pv.PostId == postId && pv.BrowserFingerprint == browserFingerprint);
        }

        public Task IncrementViewCountAsync(Guid postId)
        {
            AnonymousPost? post = _context.AnonymousPosts.Find(postId);
            if (post != null) { post.CurrentViews += 1; }

            return Task.CompletedTask;
        }

        public async Task<List<AnonymousPost>> GetRandomPostsAsync(int count)
        {
            // Fast approach: Get total count and use random offset with wraparound
            var totalCount = await _context.AnonymousPosts.CountAsync();
            
            if (totalCount == 0)
                return new List<AnonymousPost>();
            
            if (count >= totalCount)
            {
                return await _context.AnonymousPosts.ToListAsync();
            }
            
            // Generate random starting point and collect posts with wraparound
            var random = new Random();
            var startIndex = random.Next(0, totalCount);
            var posts = new List<AnonymousPost>();
            
            // First batch: from random start to end
            var firstBatchSize = Math.Min(count, totalCount - startIndex);
            var firstBatch = await _context.AnonymousPosts
                .Skip(startIndex)
                .Take(firstBatchSize)
                .ToListAsync();
            posts.AddRange(firstBatch);
            
            // If we need more posts, wrap around to the beginning
            var remaining = count - firstBatch.Count;
            if (remaining > 0)
            {
                var secondBatch = await _context.AnonymousPosts
                    .Take(remaining)
                    .ToListAsync();
                posts.AddRange(secondBatch);
            }
            
            return posts;
        }

        public async Task AddDrawingToPostAsync(PostDrawing drawing)
        {
            await _context.PostDrawings.AddAsync(drawing);
        }

        public async Task RemoveDrawingsByFingerprintAsync(Guid postId, string deviceFingerprint)
        {
            var existingDrawings = await _context.PostDrawings
                .Where(d => d.PostId == postId && d.CreatedByFingerprint == deviceFingerprint)
                .ToListAsync();
            
            if (existingDrawings.Any())
            {
                _context.PostDrawings.RemoveRange(existingDrawings);
            }
        }

        public async Task<List<PostDrawing>> GetDrawingsForPostAsync(Guid postId)
        {
            return await _context.PostDrawings
                .Where(d => d.PostId == postId)
                .OrderBy(d => d.CreatedAt)
                .ToListAsync();
        }
    }
} 