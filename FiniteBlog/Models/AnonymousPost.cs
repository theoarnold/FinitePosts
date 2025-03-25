using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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
        
        // Navigation property for viewers
        public ICollection<PostViewer> Viewers { get; set; } = new List<PostViewer>();
    }
} 