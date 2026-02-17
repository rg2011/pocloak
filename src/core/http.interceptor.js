// HTTP Interceptor: automatically refreshes access token when needed
// Similar to Angular's HttpInterceptor

const oidc = require('openid-client');
const { needsRefresh, setSessionTokens } = require('./auth.service');
const { getOidcClient } = require('./oidc.client');

async function tryRefreshToken(req) {
  const auth = req.session.auth;
  if (!auth || !auth.refreshToken) {
    return;
  }

  if (!needsRefresh(req)) {
    return;
  }

  // Use refresh_token to get new access_token without user interaction
  const { oidcConfiguration, config } = await getOidcClient();
  const refreshed = await oidc.refreshTokenGrant(oidcConfiguration, auth.refreshToken);
  setSessionTokens(req, refreshed, { trustedIdpClaim: config.trustedIdpClaim });
  console.info('[interceptor] Access token refreshed automatically');
}

function tokenRefreshInterceptor() {
  return async (req, res, next) => {
    try {
      await tryRefreshToken(req);
      return next();
    } catch (error) {
      console.error('[interceptor] Error refreshing token:', error.message);
      // Continue anyway - let the endpoint fail if token is invalid
      return next();
    }
  };
}

module.exports = {
  tokenRefreshInterceptor,
  tryRefreshToken
};
