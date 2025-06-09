# FiniteBlog - Azure Blob Storage Integration

This project now includes Azure Blob Storage integration for handling image and audio file uploads.

## Features

- **File Upload Support**: Upload images (JPEG, PNG, GIF, WebP) and audio files (MP3, WAV, OGG, MP4)
- **Secure Storage**: Files are stored in Azure Blob Storage with secure file naming
- **Size Validation**: Maximum file size of 10MB
- **Content Type Validation**: Only allowed file types can be uploaded
- **Clean URLs**: Direct access to files through Azure CDN-ready URLs

## Setup Instructions

### 1. Azure Storage Account Setup

1. Create an Azure Storage Account in the Azure Portal
2. Note down the connection string from the "Access keys" section
3. The application will automatically create the blob container if it doesn't exist

### 2. Configuration

#### Development (Local)
The project is configured to use Azure Storage Emulator for development:
```json
{
  "AzureStorage": {
    "ConnectionString": "UseDevelopmentStorage=true",
    "ContainerName": "finiteblog-uploads-dev"
  }
}
```

#### Production
Create an `appsettings.Production.json` file (this will be ignored by Git):
```json
{
  "AzureStorage": {
    "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net",
    "ContainerName": "finiteblog-uploads",
    "MaxFileSizeBytes": 10485760,
    "AllowedContentTypes": [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4"
    ]
  }
}
```

#### Using Environment Variables (Recommended for Production)
Set the following environment variable:
```bash
AZURESTORAGE__CONNECTIONSTRING="your-azure-storage-connection-string"
```

### 3. Database Migration

Run the database migration to add file attachment columns:
```bash
dotnet ef database update
```

## API Endpoints

### File Upload
```http
POST /api/files/upload
Content-Type: multipart/form-data
```

### Create Post with File
```http
POST /api/posts
Content-Type: multipart/form-data

{
  "content": "Post content (optional if file is provided)",
  "viewLimit": 100,
  "file": [uploaded file]
}
```

### File Validation
```http
GET /api/files/validate
```

### Delete File
```http
DELETE /api/files/{fileName}
```

## Security Features

1. **File Type Validation**: Only allowed MIME types are accepted
2. **File Size Limits**: Configurable maximum file size (default 10MB)
3. **Secure File Names**: Generated GUIDs prevent path traversal attacks
4. **Connection String Security**: Stored in configuration, not code
5. **Error Handling**: Proper cleanup of uploaded files if post creation fails

## Best Practices Implemented

- **Dependency Injection**: Services are properly registered with DI container
- **Configuration Binding**: Settings are bound to strongly-typed configuration objects
- **Logging**: Comprehensive logging for monitoring and debugging
- **Error Handling**: Graceful error handling with proper HTTP status codes
- **Resource Cleanup**: Automatic cleanup of orphaned files
- **Async/Await**: All I/O operations are asynchronous
- **Validation**: Multi-layer validation (client, API, service levels)

## File Storage Structure

Files are stored with the following naming convention:
```
{timestamp}_{guid}.{extension}
```

Example: `20241201143022_a1b2c3d4e5f6789012345678901234567890.jpg`

This ensures:
- No file name conflicts
- Easy chronological sorting
- Secure, non-guessable file names
- Preservation of original file extension

## Environment Variables

For production deployment, use these environment variables to avoid storing secrets in configuration files:

- `AZURESTORAGE__CONNECTIONSTRING`: Azure Storage connection string
- `AZURESTORAGE__CONTAINERNAME`: Blob container name (optional, defaults to "finiteblog-uploads")
- `AZURESTORAGE__MAXFILESIZEBYTES`: Maximum file size in bytes (optional, defaults to 10MB)

## Troubleshooting

1. **Connection Issues**: Verify your Azure Storage connection string
2. **File Upload Errors**: Check file size and type restrictions
3. **Permission Issues**: Ensure the Azure Storage account has proper permissions
4. **Development**: Make sure Azure Storage Emulator is running for local development 