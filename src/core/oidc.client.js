const oidc = require('openid-client');
const { loadRuntimeConfig } = require('../server/keycloak.config');

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
    throw new Error('Falta configuración mínima OIDC (discoveryUrl/clientId).');
  }

  if (oidcCache.oidcConfiguration && oidcCache.loadedFrom === cacheKey) {
    return {
      oidcConfiguration: oidcCache.oidcConfiguration,
      serverMetadata: oidcCache.oidcConfiguration.serverMetadata(),
      config
    };
  }

  const serverUrl = new URL(config.discoveryUrl);
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

function createAuthRequest(session, config) {
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = config.usePkce ? oidc.randomPKCECodeVerifier() : null;
  const codeChallenge =
    config.usePkce && codeVerifier
      ? config.pkceMethod === 'plain'
        ? codeVerifier
        : oidc.calculatePKCECodeChallenge(codeVerifier)
      : null;

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
