using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using FiniteBlog.DTOs;

namespace FiniteBlog.Services
{
    public class AzureBlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly IConfiguration _config;
        private readonly ILogger<AzureBlobStorageService> _logger;
        private readonly BlobContainerClient _containerClient;

        public AzureBlobStorageService(
            IConfiguration config,
            ILogger<AzureBlobStorageService> logger)
        {
            _config = config;
            _logger = logger;

            string? connectionString = _config["AzureStorage:ConnectionString"];
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Azure Storage connection string is not configured.");
            }

            _blobServiceClient = new BlobServiceClient(connectionString);
            _containerClient = _blobServiceClient.GetBlobContainerClient(_config["AzureStorage:ContainerName"]);
        }

        public async Task<BlobUploadResult> UploadFileAsync(IFormFile file, string? customFileName = null)
        {
            // Validate file
            if (!IsValidFileSize(file))
            {
                long maxFileSizeBytes = _config.GetValue<long>("AzureStorage:MaxFileSizeBytes");
                throw new InvalidOperationException($"File size exceeds maximum allowed size of {maxFileSizeBytes / 1024 / 1024}MB");
            }

            if (!IsValidFileType(file))
            {
                throw new InvalidOperationException("File type not supported");
            }

            try
            {
                // Ensure container exists with public blob access
                await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

                // Generate secure filename
                string fileName = customFileName ?? GenerateSecureFileName(file.FileName);
                BlobClient blobClient = _containerClient.GetBlobClient(fileName);

                // Upload with metadata
                BlobHttpHeaders blobHttpHeaders = new BlobHttpHeaders
                {
                    ContentType = file.ContentType,
                    CacheControl = "public, max-age=31536000" // 1 year cache
                };

                Dictionary<string, string> metadata = new Dictionary<string, string>
                {
                    { "OriginalFileName", file.FileName },
                    { "UploadTimestamp", DateTimeOffset.UtcNow.ToString("O") },
                    { "FileSizeBytes", file.Length.ToString() }
                };

                using var stream = file.OpenReadStream();
                BlobContentInfo response = await blobClient.UploadAsync(
                    stream, 
                    new BlobUploadOptions
                    {
                        HttpHeaders = blobHttpHeaders,
                        Metadata = metadata
                    });

                _logger.LogInformation("Successfully uploaded file {FileName} to blob storage", fileName);

                return new BlobUploadResult
                {
                    FileName = fileName,
                    Url = GetPublicUrl(fileName),
                    FileSizeBytes = file.Length,
                    ContentType = file.ContentType ?? string.Empty
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to blob storage", file.FileName);
                throw new InvalidOperationException("An error occurred while uploading the file", ex);
            }
        }

        public async Task<bool> DeleteFileAsync(string fileName)
        {
            try
            {
                BlobClient blobClient = _containerClient.GetBlobClient(fileName);
                bool response = await blobClient.DeleteIfExistsAsync();
                
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileName} from blob storage", fileName);
                return false;
            }
        }

        public async Task<string?> GetFileUrlAsync(string fileName)
        {
            try
            {
                var blobClient = _containerClient.GetBlobClient(fileName);
                
                if (await blobClient.ExistsAsync())
                {
                    return GetPublicUrl(fileName);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting URL for file {FileName}", fileName);
                return null;
            }
        }

        private string GetPublicUrl(string fileName)
        {
            string? cdnEndpoint = _config["AzureStorage:CdnEndpoint"];
            string? containerName = _config["AzureStorage:ContainerName"];
            return $"{cdnEndpoint?.TrimEnd('/')}/{containerName}/{fileName}";
        }

        public async Task<bool> FileExistsAsync(string fileName)
        {
            try
            {
                BlobClient blobClient = _containerClient.GetBlobClient(fileName);
                var response = await blobClient.ExistsAsync();
                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if file {FileName} exists", fileName);
                return false;
            }
        }

        public bool IsValidFileType(IFormFile file)
        {
            if (string.IsNullOrEmpty(file.ContentType))
                return false;

            var allowedContentTypes = _config.GetSection("AzureStorage:AllowedContentTypes").Get<List<string>>() ?? [];
            return allowedContentTypes.Contains(file.ContentType.ToLowerInvariant());
        }

        public bool IsValidFileSize(IFormFile file)
        {
            long maxFileSizeBytes = _config.GetValue<long>("AzureStorage:MaxFileSizeBytes");
            return file.Length > 0 && file.Length <= maxFileSizeBytes;
        }

        private static string GenerateSecureFileName(string originalFileName)
        {
            // Extract file extension
            string extension = Path.GetExtension(originalFileName).ToLowerInvariant();
            
            // Generate unique identifier
            string uniqueId = Guid.NewGuid().ToString("N");
            var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss");
            
            // Combine for unique filename
            return $"{timestamp}_{uniqueId}{extension}";
        }
    }
} 