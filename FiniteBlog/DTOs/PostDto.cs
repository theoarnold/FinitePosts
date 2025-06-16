namespace FiniteBlog.DTOs
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public int ViewLimit { get; set; }
        public int CurrentViews { get; set; }
<<<<<<< HEAD
        public int ActiveViewers { get; set; }
=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
        public DateTimeOffset CreatedAt { get; set; }
        
        // File attachment properties
        public string? AttachedFileName { get; set; }
        public string? AttachedFileUrl { get; set; }
        public string? AttachedFileContentType { get; set; }
        public long? AttachedFileSizeBytes { get; set; }
    }
} 