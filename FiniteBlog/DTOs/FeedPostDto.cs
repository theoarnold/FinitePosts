namespace FiniteBlog.DTOs
{
    public class FeedPostDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Preview { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
        public int ViewLimit { get; set; }
        public int CurrentViews { get; set; }
        public int ActiveViewers { get; set; }
        public bool HasAttachment { get; set; }
        public string? AttachedFileUrl { get; set; }
        public string? AttachedFileContentType { get; set; }
    }
} 