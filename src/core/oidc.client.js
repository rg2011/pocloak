// OIDC Client: manages connection to Keycloak using openid-client library
// Handles discovery, client configuration, and PKCE

const oidc = require('openid-client');
const { loadRuntimeConfig } = require('../server/keycloak.config');

// Cache OIDC configuration to avoid repeated discovery calls
let oidcCache = {
  oidcConfiguration: null,
  loadedFrom: null
};

function buildCacheKey(config) {
  return `${config.discoveryUrl}::${config.clientId}::${config.clientSecret || ''}`;
}

async function getOidcClient() {
  const config = loadRuntimeConfig();
  const cacheKey = buildCacheKey(config);

  if (!config.discoveryUrl || !config.clientId) {
    throw new Error('Missing required OIDC config: discoveryUrl and clientId are required');
  }

  // Return cached client if config hasn't changed
  if (oidcCache.oidcConfiguration && oidcCache.loadedFrom === cacheKey) {
    return {
      oidcConfiguration: oidcCache.oidcConfiguration,
      serverMetadata: oidcCache.oidcConfiguration.serverMetadata(),
      config
    };
  }

  // Perform OIDC discovery to get all endpoint URLs
  const serverUrl = new URL(config.discoveryUrl);
  
  // Choose auth method: public clients use 'none', confidential use 'client_secret_basic'
  const clientAuth = config.clientSecret ? oidc.ClientSecretBasic(config.clientSecret) : oidc.None();
  const oidcConfiguration = await oidc.discovery(
    serverUrl,
    config.clientId,
    {
      token_endpoint_auth_method: config.clientSecret ? 'client_secret_basic' : 'none'
    },
    clientAuth
  );

  oidcCache = {
    oidcConfiguration,
    loadedFrom: cacheKey
  };

  return {
    oidcConfiguration,
    serverMetadata: oidcConfiguration.serverMetadata(),
    config
  };
}

function buildCallbackUrl(config) {
  return new URL('/auth/callback', config.domain).toString();
}

// Create OIDC authorization request with security parameters
function createAuthRequest(session, config) {
  // Generate random values for security
  const state = oidc.randomState();      // Prevents CSRF attacks
  const nonce = oidc.randomNonce();      // Prevents replay attacks
  const codeVerifier = config.usePkce ? oidc.randomPKCECodeVerifier() : null;
  
  // PKCE: code_challenge is derived from code_verifier
  // S256 = SHA256 hash (more secure), plain = use verifier as-is
  const codeChallenge =
    config.usePkce && codeVerifier
      ? config.pkceMethod === 'plain'
        ? codeVerifier
        : oidc.calculatePKCECodeChallenge(codeVerifier)
      : null;

  // Store in session to validate callback later
  session.oidc = {
    state,
    nonce,
    createdAt: Date.now()
  };

  if (config.usePkce && codeVerifier) {
    session.oidc.codeVerifier = codeVerifier;
  }

  return {
    codeVerifier,
    state,
    nonce,
    codeChallenge: config.usePkce ? codeChallenge : null
  };
}

module.exports = {
  buildCallbackUrl,
  createAuthRequest,
  getOidcClient
};
