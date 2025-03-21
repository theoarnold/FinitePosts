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
    }
} 