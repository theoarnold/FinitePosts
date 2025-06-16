const { createProxyMiddleware } = require('http-proxy-middleware');

const context = [
  "/weatherforecast",
];

const onError = (err, req, resp, target) => {
    resp.writeHead(500, {
        'Content-Type': 'text/plain',
    });
    resp.end('Something went wrong. And we are reporting a custom error message.');
};

module.exports = function (app) {
  const appProxy = createProxyMiddleware(context, {
    target: 'https://localhost:7288',
    secure: false,
    onError: onError,
    logLevel: 'silent'
  });

  app.use(appProxy);
}; 