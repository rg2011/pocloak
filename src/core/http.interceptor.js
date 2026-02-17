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

  const { oidcConfiguration } = await getOidcClient();
  const refreshed = await oidc.refreshTokenGrant(oidcConfiguration, auth.refreshToken);
  setSessionTokens(req, refreshed);
  console.info('[interceptor] access token refrescado automáticamente');
}

function tokenRefreshInterceptor() {
  return async (req, res, next) => {
    try {
      await tryRefreshToken(req);
      return next();
    } catch (error) {
      console.error('[interceptor] error haciendo refresh token:', error.message);
      return next();
    }
  };
}

module.exports = {
  tokenRefreshInterceptor,
  tryRefreshToken
};
