using System;
using System.Security.Cryptography;

namespace FiniteBlog.Services
{
    public class SlugGeneratorService
    {
        private const string AllowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";
        private const int SlugLength = 8;

        public string GenerateRandomSlug()
        {
            var random = new byte[SlugLength];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(random);
            }

            var result = new char[SlugLength];
            for (int i = 0; i < SlugLength; i++)
            {
                result[i] = AllowedChars[random[i] % AllowedChars.Length];
            }

            return new string(result);
        }
    }
} 