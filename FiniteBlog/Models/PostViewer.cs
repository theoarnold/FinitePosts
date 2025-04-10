namespace FiniteBlog.Models
{
    public class PostViewer
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public string VisitorId { get; set; } // Cookie-based ID
        public string IpAddress { get; set; } // IP Address
        public DateTime ViewedAt { get; set; }

        // Navigation property
        public AnonymousPost Post { get; set; } = null!;
    }
} 