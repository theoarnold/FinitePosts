using Microsoft.AspNetCore.Mvc;

namespace FiniteBlog.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { message = "Test endpoint is working" });
        }

        [HttpPost]
        public IActionResult Post([FromBody] object data)
        {
            return Ok(new { message = "Test POST endpoint is working", data });
        }
    }
} 