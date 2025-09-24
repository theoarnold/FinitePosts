using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace FiniteBlog.Services
{
    public static class GoogleRecaptchaVerifier
    {
        private class RecaptchaResponse
        {
            public bool success { get; set; }
            public double score { get; set; }
            public string action { get; set; } = string.Empty;
            public string challenge_ts { get; set; } = string.Empty;
            public string hostname { get; set; } = string.Empty;
            public string[]? error_codes { get; set; }
        }

        public static async Task<bool> VerifyAsync(string token, string? remoteIp, IConfiguration configuration, ILogger logger)
        {
            var secret = configuration["GoogleRecaptcha:SecretKey"];
            if (string.IsNullOrWhiteSpace(secret))
            {
                // Hardcoded fallback (temporary)
                secret = "6Le5-NErAAAAAJtZInNzO2jsU2oa5k3Yw27ttXRu";
            }
            if (string.IsNullOrWhiteSpace(secret))
            {
                logger.LogWarning("reCAPTCHA secret key is not configured.");
                return false;
            }

            try
            {
                using var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, "https://www.google.com/recaptcha/api/siteverify");
                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("secret", secret),
                    new KeyValuePair<string, string>("response", token),
                    new KeyValuePair<string, string>("remoteip", remoteIp ?? string.Empty)
                });
                request.Content = content;

                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                var parsed = JsonSerializer.Deserialize<RecaptchaResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (parsed == null)
                {
                    return false;
                }

                // Accept success; optionally check score for v3
                return parsed.success;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error verifying reCAPTCHA");
                return false;
            }
        }
    }
}


