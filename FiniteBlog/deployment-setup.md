# Deployment Setup Guide

## Secure Configuration for Production

### Option 1: Environment Variables (Recommended)

Set these environment variables in your production environment:

#### Windows (PowerShell)
```powershell
$env:AZURESTORAGE__CONNECTIONSTRING="DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey"
$env:AZURESTORAGE__CONTAINERNAME="finiteblog-uploads"
$env:CONNECTIONSTRINGS__DEFAULTCONNECTION="Server=yourserver;Database=FiniteBlog;User Id=youruser;Password=yourpassword"
```

#### Linux/macOS
```bash
export AZURESTORAGE__CONNECTIONSTRING="DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey"
export AZURESTORAGE__CONTAINERNAME="finiteblog-uploads"
export CONNECTIONSTRINGS__DEFAULTCONNECTION="Server=yourserver;Database=FiniteBlog;User Id=youruser;Password=yourpassword"
```

#### Azure App Service
1. Go to Configuration → Application settings
2. Add the following settings:
   - `AZURESTORAGE__CONNECTIONSTRING`: Your Azure Storage connection string
   - `AZURESTORAGE__CONTAINERNAME`: finiteblog-uploads
   - `CONNECTIONSTRINGS__DEFAULTCONNECTION`: Your SQL connection string

### Option 2: Azure Key Vault (Enterprise)

For enterprise deployments, store secrets in Azure Key Vault:

1. Create an Azure Key Vault
2. Add secrets:
   - `AzureStorageConnectionString`
   - `DatabaseConnectionString`
3. Configure managed identity for your App Service
4. Reference secrets in appsettings:

```json
{
  "AzureStorage": {
    "ConnectionString": "@Microsoft.KeyVault(VaultName=your-vault;SecretName=AzureStorageConnectionString)"
  }
}
```

## Security Checklist

- [ ] Never commit real connection strings to Git
- [ ] Use environment variables or Key Vault for secrets
- [ ] Enable Azure Storage firewall (if needed)
- [ ] Configure CORS on your storage account
- [ ] Set up Azure CDN for better performance
- [ ] Enable HTTPS only on storage account
- [ ] Use Azure Storage access tiers for cost optimization
- [ ] Monitor storage usage and costs
- [ ] Set up backup and recovery policies
- [ ] Enable Azure Storage logging

## Performance Optimization

1. **Azure CDN**: Enable CDN for faster file delivery
2. **Compression**: Enable compression for static files
3. **Caching**: Set appropriate cache headers
4. **Storage Tiers**: Use appropriate storage tiers for your use case

## Monitoring and Alerts

Set up monitoring for:
- Storage account usage
- File upload failures
- API response times
- Storage costs
- Security events

## Backup Strategy

1. Enable versioning on your blob container
2. Set up lifecycle management policies
3. Configure geo-redundant storage if needed
4. Regular backup of database including file references 