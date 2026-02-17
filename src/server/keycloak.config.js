// OIDC configuration: loads from environment variables
// Students can modify .env file and restart the app to test different configs

function loadRuntimeConfig() {
  return {
    // Keycloak discovery endpoint (contains all OIDC URLs)
    discoveryUrl: process.env.OIDC_DISCOVERY_URL || '',
    
    // OAuth2 client credentials
    clientId: process.env.OIDC_CLIENT_ID || '',
    clientSecret: process.env.OIDC_CLIENT_SECRET || '',
    
    // PKCE (Proof Key for Code Exchange) adds security for public clients
    usePkce: (process.env.OIDC_USE_PKCE || 'true').toLowerCase() === 'true',
    pkceMethod: process.env.OIDC_PKCE_METHOD || 'S256',
    
    // Application domain (used to build callback URL)
    domain: process.env.APP_DOMAIN || 'http://localhost:3000',
    
    // OIDC scopes: openid is required, offline_access gives refresh_token
    scope: process.env.OIDC_SCOPE || 'openid profile email offline_access',
    
    // UMA audience (optional, for User-Managed Access)
    umaAudience: process.env.OIDC_UMA_AUDIENCE || ''
  };
}

module.exports = {
  loadRuntimeConfig
};
