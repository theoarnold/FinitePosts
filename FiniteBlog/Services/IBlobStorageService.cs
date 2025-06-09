using FiniteBlog.DTOs;

namespace FiniteBlog.Services
{
    public interface IBlobStorageService
    {
        Task<BlobUploadResult> UploadFileAsync(IFormFile file, string? customFileName = null);
        Task<bool> DeleteFileAsync(string fileName);
        Task<string?> GetFileUrlAsync(string fileName);
        Task<bool> FileExistsAsync(string fileName);
        bool IsValidFileType(IFormFile file);
        bool IsValidFileSize(IFormFile file);
    }
} 