namespace FiniteBlog.DTOs
{
    public class ViewCountDto
    {
        public string Slug { get; set; } = string.Empty;
        public int CurrentViews { get; set; }
        public int ViewLimit { get; set; }
    }
} 