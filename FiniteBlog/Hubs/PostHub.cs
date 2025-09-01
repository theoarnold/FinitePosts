using Microsoft.AspNetCore.SignalR;
using FiniteBlog.Services;

namespace FiniteBlog.Hubs
{
    public class PostHub : Hub
    {
        private readonly ConnectionManager _connectionManager;
        private readonly ILogger<PostHub> _logger;
        private readonly IPostService _postService;

        public PostHub(ConnectionManager connectionManager, ILogger<PostHub> logger, IPostService postService)
        {
            _connectionManager = connectionManager;
            _logger = logger;
            _postService = postService;
        }

        public async Task JoinPostGroup(string slug)
        {
            string connectionId = Context.ConnectionId;
            
            // Get the current cookie, query parameter, or connection header to identify this user
            string userId = Context.GetHttpContext()?.Request.Cookies["visitor_id"] ?? 
                           Context.GetHttpContext()?.Request.Query["visitorId"].FirstOrDefault() ??
                           Context.GetHttpContext()?.Request.Headers["X-Visitor-Id"].FirstOrDefault() ?? 
                           "";
            
            // If still empty, use connectionId as fallback (not ideal but ensures viewer counting works)
            if (string.IsNullOrEmpty(userId))
            {
                userId = connectionId;
                _logger.LogWarning($"No visitor ID found for connection {connectionId}, using connection ID as fallback");
            }
            
            await Groups.AddToGroupAsync(connectionId, slug);
            
            // Only track for real-time active viewers, don't affect persistent view count
            _connectionManager.AddConnection(connectionId, slug, userId);
            
            _logger.LogInformation($"Client {connectionId} successfully joined group for post {slug} with userId {userId}");
        }

        public async Task JoinPostGroupForFeed(string slug)
        {
            string connectionId = Context.ConnectionId;
            
            await Groups.AddToGroupAsync(connectionId, slug);
            
            // For feed connections, only join the group but don't add as viewer
            _connectionManager.AddFeedConnection(connectionId, slug);
            
            _logger.LogInformation($"Client {connectionId} successfully joined group for post {slug} (feed only)");
        }

        public async Task RequestViewerCount(string slug)
        {
            // Get current viewer count
            int activeViewers = _connectionManager.GetActiveViewerCount(slug);
            
            // Only send to the requesting client, not the whole group
            await Clients.Caller.SendAsync("ReceiveViewerCount", new { activeViewers });
            
            _logger.LogInformation($"Sent viewer count to client {Context.ConnectionId} for {slug}: {activeViewers}");
        }

        public async Task LeavePostGroup(string slug)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, slug);
            await _connectionManager.RemoveConnection(Context.ConnectionId);
            _logger.LogInformation($"Client {Context.ConnectionId} successfully left group for post {slug}");
        }

        public async Task SendTextAnnotation(string slug, string text, double positionX, double positionY)
        {
            try
            {
                // Get device fingerprint from query parameters or headers
                string deviceFingerprint = Context.GetHttpContext()?.Request.Query["deviceFingerprint"].FirstOrDefault() ?? 
                                          Context.GetHttpContext()?.Request.Headers["X-Device-Fingerprint"].FirstOrDefault() ?? 
                                          Context.ConnectionId; // Fallback to connection ID

                // Save the text annotation to database
                await _postService.AddDrawingToPostAsync(slug, text, positionX, positionY, deviceFingerprint);

                // Broadcast the text annotation to all viewers in the post group except the sender
                await Clients.GroupExcept(slug, Context.ConnectionId).SendAsync("ReceiveTextAnnotation", new { slug, text, positionX, positionY, deviceFingerprint });
                
                _logger.LogInformation($"Client {Context.ConnectionId} sent and saved text annotation to post {slug}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling text annotation submission for post {slug} from client {Context.ConnectionId}");
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected from SignalR");
            await _connectionManager.RemoveConnection(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
} 