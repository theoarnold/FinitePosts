using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace FiniteBlog.Services
{
    public static class GoogleRecaptchaVerifier
    {
        public sealed class RecaptchaVerifyResult
        {
            public bool Success { get; init; }
            public double? Score { get; init; }
            public string Action { get; init; } = string.Empty;
            public string Hostname { get; init; } = string.Empty;
            public string[]? ErrorCodes { get; init; }
            public string? FailureReason { get; init; }
        }
        private class RecaptchaResponse
        {
            public bool success { get; set; }
            public double score { get; set; }
            public string action { get; set; } = string.Empty;
            public string challenge_ts { get; set; } = string.Empty;
            public string hostname { get; set; } = string.Empty;
            public string[]? error_codes { get; set; }
        }

        public static async Task<RecaptchaVerifyResult> VerifyDetailedAsync(string token, string? remoteIp, IConfiguration configuration, ILogger logger)
        {
            var secret = configuration["GoogleRecaptcha:SecretKey"];
            if (string.IsNullOrWhiteSpace(secret))
            {
                logger.LogWarning("reCAPTCHA secret key is not configured.");
                return new RecaptchaVerifyResult { Success = false, FailureReason = "missing-secret" };
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
                    return new RecaptchaVerifyResult { Success = false, FailureReason = "invalid-response" };
                }

                if (!parsed.success)
                {
                    return new RecaptchaVerifyResult { Success = false, ErrorCodes = parsed.error_codes, FailureReason = "recaptcha-failed" };
                }

                // Optional v3 score/action checks
                var minScoreStr = configuration["GoogleRecaptcha:MinScore"]; // e.g. 0.5
                if (double.TryParse(minScoreStr, out var minScore) && parsed.score < minScore)
                {
                    logger.LogWarning("reCAPTCHA score below threshold: {Score} < {MinScore}", parsed.score, minScore);
                    return new RecaptchaVerifyResult { Success = false, Score = parsed.score, FailureReason = "low-score" };
                }

                var expectedAction = configuration["GoogleRecaptcha:ExpectedAction"]; // e.g. "create_post"
                if (!string.IsNullOrWhiteSpace(expectedAction) && !string.Equals(parsed.action, expectedAction, StringComparison.Ordinal))
                {
                    logger.LogWarning("reCAPTCHA action mismatch: {Action} != {Expected}", parsed.action, expectedAction);
                    return new RecaptchaVerifyResult { Success = false, Action = parsed.action, FailureReason = "wrong-action" };
                }

                return new RecaptchaVerifyResult
                {
                    Success = true,
                    Score = parsed.score,
                    Action = parsed.action,
                    Hostname = parsed.hostname
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error verifying reCAPTCHA");
                return new RecaptchaVerifyResult { Success = false, FailureReason = "exception" };
            }
        }

        // Backward-compatible boolean API
        public static async Task<bool> VerifyAsync(string token, string? remoteIp, IConfiguration configuration, ILogger logger)
        {
            var result = await VerifyDetailedAsync(token, remoteIp, configuration, logger);
            return result.Success;
        }
    }
}


