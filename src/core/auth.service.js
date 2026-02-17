// Auth Service: manages OIDC tokens in server-side session
// Tokens are NEVER sent to the browser, only metadata about them

function setSessionTokens(req, tokenSet) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = tokenSet.expires_at || (tokenSet.expires_in ? nowInSeconds + tokenSet.expires_in : null);

  req.session.auth = {
    accessToken: tokenSet.access_token,
    idToken: tokenSet.id_token,
    refreshToken: tokenSet.refresh_token,  // NEVER exposed to frontend
    expiresAt,
    tokenType: tokenSet.token_type,
    scope: tokenSet.scope,
    updatedAt: Date.now()
  };
}

function clearSession(req) {
  req.session.auth = null;
  req.session.oidc = null;
}

function isAuthenticated(req) {
  return Boolean(req.session.auth && req.session.auth.accessToken);
}

// Decode JWT without verification (for display purposes only)
// In production, always verify JWT signatures!
function decodeJwt(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const decodedPayload = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    return { decodeError: error.message };
  }
}

// Return safe token view for frontend (no actual token values)
function getSafeTokenView(req) {
  const auth = req.session.auth;

  if (!auth) {
    return null;
  }

  return {
    expiresAt: auth.expiresAt,
    scope: auth.scope,
    tokenType: auth.tokenType,
    idTokenClaims: decodeJwt(auth.idToken),
    accessTokenClaims: decodeJwt(auth.accessToken),
    hasRefreshToken: Boolean(auth.refreshToken)  // Only boolean, not the actual token
  };
}

// Check if access token needs refresh (with safety margin)
function needsRefresh(req, marginInSeconds = 30) {
  const auth = req.session.auth;

  if (!auth || !auth.expiresAt) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  // Refresh 30 seconds before expiry to avoid race conditions
  return nowInSeconds + marginInSeconds >= auth.expiresAt;
}

module.exports = {
  clearSession,
  decodeJwt,
  getSafeTokenView,
  isAuthenticated,
  needsRefresh,
  setSessionTokens
};
