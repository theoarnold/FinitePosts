const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5206',
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging
      console.log('Proxying:', req.method, req.url, 'to', proxyReq.path);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
    }
  });

  // Apply the proxy to both /api paths and direct routes
  app.use('/api', apiProxy);
  app.use('/posts', apiProxy);
}; 