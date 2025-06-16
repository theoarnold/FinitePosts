using Microsoft.AspNetCore.SignalR;

namespace FiniteBlog.Hubs
{
    public class PostHub : Hub
    {
        private readonly ConnectionManager _connectionManager;
        private readonly ILogger<PostHub> _logger;

        public PostHub(ConnectionManager connectionManager, ILogger<PostHub> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        public async Task JoinPostGroup(string slug)
        {
            string connectionId = Context.ConnectionId;
            
            // Get the current cookie or connection header to identify this user
            string userId = Context.GetHttpContext().Request.Cookies["visitor_id"] ?? "";
            
            await Groups.AddToGroupAsync(connectionId, slug);
            
            // Only track for real-time active viewers, don't affect persistent view count
            _connectionManager.AddConnection(connectionId, slug, userId);
            
            _logger.LogInformation($"Client {connectionId} successfully joined group for post {slug}");
        }

<<<<<<< HEAD
        public async Task JoinPostGroupForFeed(string slug)
        {
            string connectionId = Context.ConnectionId;
            
            await Groups.AddToGroupAsync(connectionId, slug);
            
            // For feed connections, only join the group but don't add as viewer
            _connectionManager.AddFeedConnection(connectionId, slug);
            
            _logger.LogInformation($"Client {connectionId} successfully joined group for post {slug} (feed only)");
        }

=======
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
        public async Task RequestViewerCount(string slug)
        {
            // Get current viewer count
            int activeViewers = _connectionManager.GetActiveViewerCount(slug);
            
            // Only send to the requesting client, not the whole group
<<<<<<< HEAD
            await Clients.Caller.SendAsync("ReceiveViewerCount", new { activeViewers });
=======
            await Clients.Caller.SendAsync("ReceiveViewUpdate", new { activeViewers });
>>>>>>> 5bcf2bdd885fff5f229a1603fbc60bc31a1a4a62
            
            _logger.LogInformation($"Sent viewer count to client {Context.ConnectionId} for {slug}: {activeViewers}");
        }

        public async Task LeavePostGroup(string slug)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, slug);
            await _connectionManager.RemoveConnection(Context.ConnectionId);
            _logger.LogInformation($"Client {Context.ConnectionId} successfully left group for post {slug}");
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected from SignalR");
            await _connectionManager.RemoveConnection(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
} 