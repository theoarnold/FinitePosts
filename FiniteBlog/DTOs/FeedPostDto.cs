namespace FiniteBlog.DTOs
{
    public class FeedPostDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Preview { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ViewLimit { get; set; }
        public int CurrentViews { get; set; }
        public int ActiveViewers { get; set; }
        public bool HasAttachment { get; set; }
    }
} 