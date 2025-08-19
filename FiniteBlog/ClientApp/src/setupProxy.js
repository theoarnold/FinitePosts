// Proxy disabled - connecting directly to Azure backend
// const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // No proxy needed when connecting to external Azure backend
  // All API calls will go directly to: https://wypriback-hdcta5aregafawbq.uksouth-01.azurewebsites.net
}; 