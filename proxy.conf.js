const PROXY_CONFIG = {
  "/rest": {
    target: "https://jira.tools.sap",
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    cookieDomainRewrite: "localhost",
    onProxyReq: function (proxyReq, req, res) {
      console.log('[Proxy] Request:', req.method, req.url);
      console.log('[Proxy] Headers:', req.headers);

      // Check for Authorization header
      if (req.headers.authorization) {
        console.log('[Proxy] Authorization header found:', req.headers.authorization.substring(0, 20) + '...');
        // Make sure it's forwarded
        proxyReq.setHeader('Authorization', req.headers.authorization);
      } else {
        console.log('[Proxy] No Authorization header in request');
      }

      // Forward all cookies from the request
      if (req.headers.cookie) {
        console.log('[Proxy] Forwarding cookies:', req.headers.cookie);
      } else {
        console.log('[Proxy] No cookies in request');
      }
    },
    onProxyRes: function (proxyRes, req, res) {
      console.log('[Proxy] Response status:', proxyRes.statusCode);
      console.log('[Proxy] Response headers:', proxyRes.headers);
    },
    onError: function (err, req, res) {
      console.error('[Proxy] Error:', err);
    }
  }
};

module.exports = PROXY_CONFIG;
