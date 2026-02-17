// Auth Service: manages OIDC tokens in server-side session
// Tokens are NEVER sent to the browser, only metadata about them

function setSessionTokens(req, tokenSet, options = {}) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = tokenSet.expires_at || (tokenSet.expires_in ? nowInSeconds + tokenSet.expires_in : null);
  const validatedIdp = extractValidatedIdp(tokenSet, options.trustedIdpClaim);

  req.session.auth = {
    accessToken: tokenSet.access_token,
    idToken: tokenSet.id_token,
    refreshToken: tokenSet.refresh_token,  // NEVER exposed to frontend
    expiresAt,
    tokenType: tokenSet.token_type,
    scope: tokenSet.scope,
    validatedIdp,
    updatedAt: Date.now()
  };
}

// Read identity provider alias from Keycloak-issued token claims.
// This value is validated by Keycloak during login and safer than user-provided hints.
// Fallback chain: configured claim → id_token standard claims → access_token standard claims
function extractValidatedIdp(tokenSet, trustedIdpClaim = '') {
  const configuredClaim = typeof trustedIdpClaim === 'string' ? trustedIdpClaim.trim() : '';
  
  // Step 1: If admin configured a specific claim path, use it (e.g., 'custom.idp.alias')
  if (configuredClaim) {
    const accessTokenClaims = decodeJwt(tokenSet.access_token);
    const value = getNestedClaimValue(accessTokenClaims, configuredClaim);
    if (value) return value;
  }
  
  // Step 2: Try standard Keycloak claims in id_token (identity_provider, idp_alias)
  const idTokenClaims = decodeJwt(tokenSet.id_token);
  const idpFromIdToken = getStandardIdpClaim(idTokenClaims);
  if (idpFromIdToken) return idpFromIdToken;
  
  // Step 3: Fallback to access_token standard claims
  const accessTokenClaims = decodeJwt(tokenSet.access_token);
  const idpFromAccessToken = getStandardIdpClaim(accessTokenClaims);
  return idpFromAccessToken || null;
}

// Extract standard Keycloak IdP claims: identity_provider or idp_alias
function getStandardIdpClaim(claims) {
  if (!claims || typeof claims !== 'object') return null;
  
  const identityProvider = typeof claims.identity_provider === 'string' ? claims.identity_provider.trim() : '';
  const idpAlias = typeof claims.idp_alias === 'string' ? claims.idp_alias.trim() : '';
  
  return identityProvider || idpAlias || null;
}

// Navigate nested claim paths like 'custom.idp.alias' → claims.custom.idp.alias
function getNestedClaimValue(claims, claimPath) {
  if (!claims || typeof claims !== 'object' || !claimPath) return null;
  
  const value = claimPath
    .split('.')
    .reduce((current, part) => (current && typeof current === 'object' ? current[part] : undefined), claims);
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  return null;
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
