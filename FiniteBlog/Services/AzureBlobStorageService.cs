using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using FiniteBlog.DTOs;
using FiniteBlog.Models;
using Microsoft.Extensions.Options;

namespace FiniteBlog.Services
{
    public class AzureBlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureStorageConfig _config;
        private readonly ILogger<AzureBlobStorageService> _logger;
        private readonly BlobContainerClient _containerClient;

        public AzureBlobStorageService(
            IOptions<AzureStorageConfig> config,
            ILogger<AzureBlobStorageService> logger)
        {
            _config = config.Value;
            _logger = logger;

            if (string.IsNullOrEmpty(_config.ConnectionString))
            {
                throw new InvalidOperationException("Azure Storage connection string is not configured.");
            }

            _blobServiceClient = new BlobServiceClient(_config.ConnectionString);
            _containerClient = _blobServiceClient.GetBlobContainerClient(_config.ContainerName);
        }

        public async Task<BlobUploadResult> UploadFileAsync(IFormFile file, string? customFileName = null)
        {
            try
            {
                // Validate file
                if (!IsValidFileSize(file))
                {
                    return new BlobUploadResult 
                    { 
                        Success = false, 
                        ErrorMessage = $"File size exceeds maximum allowed size of {_config.MaxFileSizeBytes / 1024 / 1024}MB" 
                    };
                }

                if (!IsValidFileType(file))
                {
                    return new BlobUploadResult 
                    { 
                        Success = false, 
                        ErrorMessage = "File type not supported" 
                    };
                }

                // Ensure container exists (private access)
                await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

                // Generate secure filename
                var fileName = customFileName ?? GenerateSecureFileName(file.FileName);
                var blobClient = _containerClient.GetBlobClient(fileName);

                // Upload with metadata
                var blobHttpHeaders = new BlobHttpHeaders
                {
                    ContentType = file.ContentType,
                    CacheControl = "public, max-age=31536000" // 1 year cache
                };

                var metadata = new Dictionary<string, string>
                {
                    { "OriginalFileName", file.FileName },
                    { "UploadTimestamp", DateTimeOffset.UtcNow.ToString("O") },
                    { "FileSizeBytes", file.Length.ToString() }
                };

                using var stream = file.OpenReadStream();
                var response = await blobClient.UploadAsync(
                    stream, 
                    new BlobUploadOptions
                    {
                        HttpHeaders = blobHttpHeaders,
                        Metadata = metadata
                    });

                _logger.LogInformation("Successfully uploaded file {FileName} to blob storage", fileName);

                return new BlobUploadResult
                {
                    Success = true,
                    FileName = fileName,
                    Url = blobClient.Uri.ToString(),
                    FileSizeBytes = file.Length,
                    ContentType = file.ContentType
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to blob storage", file.FileName);
                return new BlobUploadResult
                {
                    Success = false,
                    ErrorMessage = "An error occurred while uploading the file"
                };
            }
        }

        public async Task<bool> DeleteFileAsync(string fileName)
        {
            try
            {
                var blobClient = _containerClient.GetBlobClient(fileName);
                var response = await blobClient.DeleteIfExistsAsync();
                
                _logger.LogInformation("File {FileName} deletion result: {Deleted}", fileName, response.Value);
                return response.Value;
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
                    return blobClient.Uri.ToString();
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting URL for file {FileName}", fileName);
                return null;
            }
        }

        public async Task<bool> FileExistsAsync(string fileName)
        {
            try
            {
                var blobClient = _containerClient.GetBlobClient(fileName);
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

            return _config.AllowedContentTypes.Contains(file.ContentType.ToLowerInvariant());
        }

        public bool IsValidFileSize(IFormFile file)
        {
            return file.Length > 0 && file.Length <= _config.MaxFileSizeBytes;
        }

        private static string GenerateSecureFileName(string originalFileName)
        {
            // Extract file extension
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
            
            // Generate unique identifier
            var uniqueId = Guid.NewGuid().ToString("N");
            var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss");
            
            // Combine for unique filename
            return $"{timestamp}_{uniqueId}{extension}";
        }
    }
} 