using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace FiniteBlog.Hubs
{
    public class ConnectionManager
    {
        private readonly ILogger<ConnectionManager> _logger;
        private readonly IHubContext<PostHub> _hubContext;
        private readonly ConcurrentDictionary<string, string> _connections = new ConcurrentDictionary<string, string>();
        private readonly ConcurrentDictionary<string, string> _connectionToVisitor = new ConcurrentDictionary<string, string>();
        private readonly ConcurrentDictionary<string, HashSet<string>> _postViewers = new ConcurrentDictionary<string, HashSet<string>>();

        public ConnectionManager(ILogger<ConnectionManager> logger, IHubContext<PostHub> hubContext)
        {
            _logger = logger;
            _hubContext = hubContext;
        }

        public void AddConnection(string connectionId, string slug, string visitorId)
        {
            // Store the connection to post mapping
            _connections.TryAdd(connectionId, slug);
            _logger.LogInformation($"Added connection {connectionId} for post {slug}");
            
            if (!string.IsNullOrEmpty(visitorId))
            {
                // Store the connection to visitor mapping
                _connectionToVisitor.TryAdd(connectionId, visitorId);
                
                // Get or create the set of viewers for this post
                var viewers = _postViewers.GetOrAdd(slug, _ => new HashSet<string>());
                
                // Add the visitor to the set of viewers for this post
                if (viewers.Add(visitorId))
                {
                    _logger.LogInformation($"Added unique viewer {visitorId} for post {slug}");
                }
            }
            
            // Get the updated count and broadcast immediately
            int activeViewers = GetActiveViewerCount(slug);
            _logger.LogInformation($"Active viewers for {slug}: {activeViewers}");
            
            // Fire and forget - we don't want to await this
            _ = _hubContext.Clients.Group(slug).SendAsync("ReceiveViewUpdate", new { activeViewers });
        }

        public async Task RemoveConnection(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out string slug))
            {
                _logger.LogInformation($"Removed connection {connectionId} for post {slug}");
                
                // Get the visitor ID for this connection
                if (_connectionToVisitor.TryRemove(connectionId, out string visitorId))
                {
                    // Check if this visitor has any other connections to this post
                    bool hasOtherConnections = _connections.Any(kvp => 
                        kvp.Value == slug && 
                        _connectionToVisitor.TryGetValue(kvp.Key, out string otherVisitorId) && 
                        otherVisitorId == visitorId);
                    
                    // If no other connections exist for this visitor to this post, remove them from viewers
                    if (!hasOtherConnections && _postViewers.TryGetValue(slug, out var viewers))
                    {
                        if (viewers.Remove(visitorId))
                        {
                            _logger.LogInformation($"Removed unique viewer {visitorId} from post {slug}");
                        }
                    }
                }
                
                // Get the updated count after removal
                int activeViewers = GetActiveViewerCount(slug);
                _logger.LogInformation($"Active viewers for {slug} after removal: {activeViewers}");
                
                // Broadcast the updated count
                await _hubContext.Clients.Group(slug).SendAsync("ReceiveViewUpdate", new { activeViewers });
            }
        }
        
        public int GetActiveViewerCount(string slug)
        {
            return _postViewers.TryGetValue(slug, out var viewers) ? viewers.Count : 0;
        }
    }
} 