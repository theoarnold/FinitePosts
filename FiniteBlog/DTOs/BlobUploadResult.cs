namespace FiniteBlog.DTOs
{
    public class BlobUploadResult
    {
        public bool Success { get; set; }
        public string? FileName { get; set; }
        public string? Url { get; set; }
        public string? ErrorMessage { get; set; }
        public long? FileSizeBytes { get; set; }
        public string? ContentType { get; set; }
    }
} 