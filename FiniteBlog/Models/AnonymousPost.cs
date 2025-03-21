using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

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
        
        // Store IPs as JSON string in DB
        private string _viewerIpsJson = "[]";
        
        [NotMapped]
        public List<string> ViewerIps
        {
            get => JsonSerializer.Deserialize<List<string>>(_viewerIpsJson) ?? new List<string>();
            set => _viewerIpsJson = JsonSerializer.Serialize(value);
        }
        
        // DB column for storing the JSON string
        public string ViewerIpsJson
        {
            get => _viewerIpsJson;
            set => _viewerIpsJson = value;
        }
    }
} 