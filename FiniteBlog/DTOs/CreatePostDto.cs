namespace FiniteBlog.DTOs
{
    public class CreatePostDto
    {
        public string Content { get; set; } = string.Empty;
        public int ViewLimit { get; set; }
        public IFormFile? File { get; set; }
    }
} 