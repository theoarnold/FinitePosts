namespace FiniteBlog.Models
{
    public class PostDrawing
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public string Text { get; set; } = string.Empty; // Text content of the annotation
        public double PositionX { get; set; } // X coordinate as percentage (0-100)
        public double PositionY { get; set; } // Y coordinate as percentage (0-100)
        public string CreatedByFingerprint { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public AnonymousPost Post { get; set; } = null!;
    }
} 