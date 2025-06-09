namespace FiniteBlog.Models
{
    public class AzureStorageConfig
    {
        public const string SectionName = "AzureStorage";
        
        public string ConnectionString { get; set; } = string.Empty;
        public string ContainerName { get; set; } = string.Empty;
        public long MaxFileSizeBytes { get; set; } = 10485760; // 10MB default
        public IList<string> AllowedContentTypes { get; set; } = new List<string>();
    }
} 