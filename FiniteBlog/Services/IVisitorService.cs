namespace FiniteBlog.Services
{
    public interface IVisitorService
    {
        string GetOrCreateVisitorId(HttpContext context);
    }
} 