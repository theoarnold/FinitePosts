using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using FiniteBlog.Services;
using Microsoft.Extensions.Logging;

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
            _logger.LogInformation($"Client {connectionId} joining group for post {slug}");
            
            // Get the current cookie or connection header to identify this user
            string userId = Context.GetHttpContext().Request.Cookies["visitor_id"] ?? "";
            _logger.LogInformation($"SignalR connection with visitor_id cookie: {(string.IsNullOrEmpty(userId) ? "none" : userId)}");
            
            await Groups.AddToGroupAsync(connectionId, slug);
            
            // Only track for real-time active viewers, don't affect persistent view count
            _connectionManager.AddConnection(connectionId, slug, userId);
            
            _logger.LogInformation($"Client {connectionId} successfully joined group for post {slug}");
        }

        public async Task RequestViewerCount(string slug)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} requested viewer count for post {slug}");
            
            // Get current viewer count
            int activeViewers = _connectionManager.GetActiveViewerCount(slug);
            
            // Only send to the requesting client, not the whole group
            await Clients.Caller.SendAsync("ReceiveViewUpdate", new { activeViewers });
            
            _logger.LogInformation($"Sent viewer count to client {Context.ConnectionId} for {slug}: {activeViewers}");
        }

        public async Task LeavePostGroup(string slug)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} leaving group for post {slug}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, slug);
            await _connectionManager.RemoveConnection(Context.ConnectionId);
            _logger.LogInformation($"Client {Context.ConnectionId} successfully left group for post {slug}");
        }

        public override async Task OnDisconnectedAsync(System.Exception exception)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected from SignalR");
            await _connectionManager.RemoveConnection(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
} 