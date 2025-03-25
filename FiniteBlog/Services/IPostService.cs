using FiniteBlog.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FiniteBlog.Services
{
    public interface IPostService
    {
        // DTO for creating posts (moved from controller)
        public class CreatePostDto
        {
            public string Content { get; set; } = string.Empty;
            public int ViewLimit { get; set; }
        }

        // Return type for post data
        public class PostDto
        {
            public Guid Id { get; set; }
            public string Content { get; set; } = string.Empty;
            public string Slug { get; set; } = string.Empty;
            public int ViewLimit { get; set; }
            public int CurrentViews { get; set; }
            public DateTime CreatedAt { get; set; }
            public int ActiveViewers { get; set; }
        }

        // Simple DTO for view count only
        public class ViewCountDto
        {
            public int CurrentViews { get; set; }
            public int ViewLimit { get; set; }
            public int ActiveViewers { get; set; }
        }

        // Get a post by slug
        Task<PostDto?> GetPostAsync(string slug, string? visitorId, string? ipAddress);

        // Create a new post
        Task<(PostDto Post, string? ErrorMessage)> CreatePostAsync(CreatePostDto createDto);
        
        // Get only the view count for a post (more efficient)
        Task<ViewCountDto?> GetPostViewCountAsync(string slug);
        
        // Broadcast viewer count changes to all connected clients
        Task BroadcastViewerCountAsync(string slug, int activeViewers);

        Task BroadcastViewCountUpdateAsync(AnonymousPost post);
    }
} 