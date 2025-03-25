namespace FiniteBlog.Services
{
    public class VisitorService : IVisitorService
    {
        private readonly ILogger<VisitorService> _logger;

        public VisitorService(ILogger<VisitorService> logger)
        {
            _logger = logger;
        }

        public string GetOrCreateVisitorId(HttpContext context)
        {
            string visitorId = context.Request.Cookies["visitor_id"];
            
            if (string.IsNullOrEmpty(visitorId))
            {
                visitorId = Guid.NewGuid().ToString();
                context.Response.Cookies.Append("visitor_id", visitorId, new CookieOptions
                {
                    Expires = DateTimeOffset.UtcNow.AddYears(1),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax
                });
                _logger.LogInformation($"Generated new visitor ID: {visitorId}");
            }
            else
            {
                _logger.LogInformation($"Using existing visitor ID: {visitorId}");
            }

            return visitorId;
        }
    }
} 