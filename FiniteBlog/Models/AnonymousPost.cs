namespace FiniteBlog.Models
{
    public class AnonymousPost
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public int ViewLimit { get; set; }
        public int CurrentViews { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // File attachment properties
        public string? AttachedFileName { get; set; }
        public string? AttachedFileUrl { get; set; }
        public string? AttachedFileContentType { get; set; }
        public long? AttachedFileSizeBytes { get; set; }
        
        // Navigation property for viewers
        public ICollection<PostViewer> Viewers { get; set; } = [];
        
        // Navigation property for drawings
        public ICollection<PostDrawing> Drawings { get; set; } = [];
    }
} 