function setSessionTokens(req, tokenSet) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = tokenSet.expires_at || (tokenSet.expires_in ? nowInSeconds + tokenSet.expires_in : null);

  req.session.auth = {
    accessToken: tokenSet.access_token,
    idToken: tokenSet.id_token,
    refreshToken: tokenSet.refresh_token,
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
    hasRefreshToken: Boolean(auth.refreshToken)
  };
}

function needsRefresh(req, marginInSeconds = 30) {
  const auth = req.session.auth;

  if (!auth || !auth.expiresAt) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
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
