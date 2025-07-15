namespace FiniteBlog.DTOs
{
    public class PostDrawingDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public double PositionX { get; set; }
        public double PositionY { get; set; }
        public string CreatedByFingerprint { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
} 