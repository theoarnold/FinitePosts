namespace FiniteBlog.DTOs
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public int ViewLimit { get; set; }
        public int CurrentViews { get; set; }
        public int ActiveViewers { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        
        // File attachment properties
        public string? AttachedFileName { get; set; }
        public string? AttachedFileUrl { get; set; }
        public string? AttachedFileContentType { get; set; }
        public long? AttachedFileSizeBytes { get; set; }
        
        // Drawings
        public List<PostDrawingDto> Drawings { get; set; } = new List<PostDrawingDto>();
    }
} 