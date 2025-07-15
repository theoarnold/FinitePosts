using FiniteBlog.Models;
using Microsoft.EntityFrameworkCore;

namespace FiniteBlog.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<AnonymousPost> AnonymousPosts { get; set; } = null!;
        public DbSet<PostViewer> PostViewers { get; set; } = null!;
        public DbSet<PostDrawing> PostDrawings { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PostViewer>()
                .HasOne(pv => pv.Post)
                .WithMany(p => p.Viewers)
                .HasForeignKey(pv => pv.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PostDrawing>()
                .HasOne(pd => pd.Post)
                .WithMany(p => p.Drawings)
                .HasForeignKey(pd => pd.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
} 