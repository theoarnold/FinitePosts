namespace FiniteBlog.Services
{
    public class VisitorCookie
    {
        private readonly IWebHostEnvironment _environment;

        public VisitorCookie(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public string GetOrCreateVisitorId(HttpContext context)
        {
            string visitorId = context.Request.Cookies["visitor_id"];
            
            if (string.IsNullOrEmpty(visitorId))
            {
                visitorId = Guid.NewGuid().ToString();
                
                var cookieOptions = new CookieOptions
                {
                    Expires = DateTimeOffset.UtcNow.AddYears(1),
                    HttpOnly = false, // Allow JavaScript access for SignalR
                    Secure = true,
                    SameSite = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None
                };

                context.Response.Cookies.Append("visitor_id", visitorId, cookieOptions);
            }

            return visitorId;
        }
    }
} 