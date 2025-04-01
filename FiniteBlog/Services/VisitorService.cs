namespace FiniteBlog.Services
{
    public class VisitorCookie
    {
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
            }

            return visitorId;
        }
    }
} 