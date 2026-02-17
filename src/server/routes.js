const express = require('express');
const oidc = require('openid-client');
const { authGuard } = require('../core/auth.guard');
const { tokenRefreshInterceptor } = require('../core/http.interceptor');
const { clearSession, getSafeTokenView, setSessionTokens } = require('../core/auth.service');
const { buildCallbackUrl, createAuthRequest, getOidcClient } = require('../core/oidc.client');
const { loadRuntimeConfig } = require('./keycloak.config');

// Simple token obfuscation for teaching purposes
// Shows first 6 and last 4 characters, hides the middle
function hideToken(token) {
  if (!token || typeof token !== 'string') {
    return '[hidden]';
  }
  if (token.length <= 12) {
    return '[hidden]';
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

// Sanitize sensitive fields before sending to frontend
// This teaches students which fields contain secrets
function sanitizeValue(value, fieldName) {
  const lowerField = String(fieldName).toLowerCase();
  
  // List of sensitive field names that should be obfuscated
  const sensitiveFields = ['access_token', 'refresh_token', 'id_token', 'token', 'client_secret', 'authorization', 'cookie', 'set-cookie'];
  
  if (sensitiveFields.includes(lowerField)) {
    if (lowerField === 'authorization' && typeof value === 'string') {
      // Show auth type but hide credentials
      if (value.startsWith('Bearer ')) {
        return `Bearer ${hideToken(value.slice(7))}`;
      }
      if (value.startsWith('Basic ')) {
        return 'Basic [hidden]';
      }
    }
    return hideToken(value);
  }
  
  return value;
}

// Recursively sanitize objects and arrays
function sanitizeData(data, parentKey = '') {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, parentKey));
  }
  
  if (typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeData(value, key);
    }
    return result;
  }
  
  return sanitizeValue(data, parentKey);
}

// Helper to convert Headers object to plain object for sanitization
function headersToObject(headers) {
  if (!headers) return {};
  const entries = typeof headers.entries === 'function' ? [...headers.entries()] : Object.entries(headers);
  return Object.fromEntries(entries);
}

// Standard format for HTTP request/response exchanges shown in UI
function makeStandardExchange({ request, reply }) {
  return {
    request: {
      url: request.url,
      method: request.method,
      headers: sanitizeData(headersToObject(request.headers)),
      body: request.body || null
    },
    reply: {
      http_code: reply.httpCode,
      headers: sanitizeData(headersToObject(reply.headers)),
      body: reply.body || null
    }
  };
}

// Parse HTTP response body, handling both JSON and plain text
async function readHttpBody(httpResponse) {
  const rawBody = await httpResponse.text();
  if (!rawBody) return null;
  
  const contentType = httpResponse.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return rawBody;
  }
  
  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

// Convert URLSearchParams or other body types to plain object
function bodyToObject(body) {
  if (body === null || body === undefined) return null;
  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }
  return body;
}

// Convert object to URL-encoded form data (used for token endpoint calls)
function toFormUrlEncoded(payload) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && value !== undefined) {
      body.append(key, String(value));
    }
  }
  return body;
}

// Derive Keycloak realm base URL from discovery URL
// Example: https://keycloak.example.com/realms/myrealm/.well-known/openid-configuration
//       -> https://keycloak.example.com/realms/myrealm
function buildRealmBaseUrl(discoveryUrl) {
  const marker = '/.well-known/';
  const markerIndex = discoveryUrl.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('Cannot derive realm URL: discoveryUrl must contain "/.well-known/"');
  }
  return discoveryUrl.slice(0, markerIndex);
}

// Execute HTTP call to OIDC endpoint and return sanitized request/response
// This is the core function that students will see in the UI inspector
async function executeOidcHttpCall({ url, method, headers = {}, body = null, requestBodyView = undefined }) {
  const httpResponse = await fetch(url, { method, headers, body });
  const responseBody = await readHttpBody(httpResponse);
  const requestBody = requestBodyView !== undefined ? requestBodyView : bodyToObject(body);
  
  return makeStandardExchange({
    request: {
      url,
      method,
      headers,
      body: sanitizeData(requestBody)
    },
    reply: {
      httpCode: httpResponse.status,
      headers: httpResponse.headers,
      body: sanitizeData(responseBody)
    }
  });
}

function createApiRoutes() {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', now: new Date().toISOString() });
  });

  router.get('/auth/status', (req, res) => {
    res.json({
      isAuthenticated: Boolean(req.session.auth),
      tokens: getSafeTokenView(req)
    });
  });

  router.get('/config', (req, res) => {
    res.json(loadRuntimeConfig());
  });

  router.get('/discovery/data', async (req, res) => {
    const { config } = await getOidcClient();
    // Fetch OIDC discovery document (contains all endpoint URLs)
    const exchange = await executeOidcHttpCall({
      url: config.discoveryUrl,
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    res.json(exchange);
  });

  router.get('/discovery/realm', async (req, res) => {
    const { config } = await getOidcClient();
    const realmBaseUrl = buildRealmBaseUrl(config.discoveryUrl);
    // Fetch Keycloak realm metadata (public info about the realm)
    const exchange = await executeOidcHttpCall({
      url: realmBaseUrl,
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    res.json(exchange);
  });

  router.get('/discovery/uma2', async (req, res) => {
    const { config } = await getOidcClient();
    const realmBaseUrl = buildRealmBaseUrl(config.discoveryUrl);
    // Fetch UMA2 configuration (User-Managed Access, advanced Keycloak feature)
    const exchange = await executeOidcHttpCall({
      url: `${realmBaseUrl}/.well-known/uma2-configuration`,
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    res.json(exchange);
  });

  // Protected routes: require authentication
  // authGuard checks session, tokenRefreshInterceptor refreshes token if needed
  router.use(authGuard, tokenRefreshInterceptor());

  router.get('/tokens', (req, res) => {
    res.json(getSafeTokenView(req));
  });

  router.get('/session', (req, res) => {
    res.json({
      auth: {
        expiresAt: req.session.auth?.expiresAt || null,
        tokenType: req.session.auth?.tokenType || null,
        scope: req.session.auth?.scope || null,
        updatedAt: req.session.auth?.updatedAt || null,
        hasRefreshToken: Boolean(req.session.auth?.refreshToken)
      },
      oidc: req.session.oidc || null
    });
  });

  router.get('/oidc/userinfo', async (req, res) => {
    const { serverMetadata } = await getOidcClient();
    const url = serverMetadata.userinfo_endpoint;
    if (!url) {
      throw new Error('userinfo_endpoint not found in discovery document');
    }
    
    // Call OIDC UserInfo endpoint with access token
    const exchange = await executeOidcHttpCall({
      url,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${req.session.auth.accessToken}`
      }
    });
    res.json(exchange);
  });

  router.get('/oidc/introspect', async (req, res) => {
    const { serverMetadata, config } = await getOidcClient();
    const url = serverMetadata.introspection_endpoint;
    if (!url) {
      throw new Error('introspection_endpoint not found in discovery document');
    }
    
    // Token introspection: ask Keycloak if token is valid and get metadata
    const requestBody = {
      token: req.session.auth.accessToken,
      token_type_hint: 'access_token'
    };
    
    // Public clients must send client_id, confidential clients use Basic auth
    if (!config.clientSecret) {
      requestBody.client_id = config.clientId;
    }
    
    const body = toFormUrlEncoded(requestBody);
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    };
    
    if (config.clientSecret) {
      const basicCredentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${basicCredentials}`;
    }
    
    const exchange = await executeOidcHttpCall({
      url,
      method: 'POST',
      headers,
      body,
      requestBodyView: requestBody
    });
    res.json(exchange);
  });

  router.get('/oidc/uma', async (req, res) => {
    const { serverMetadata, config } = await getOidcClient();
    const url = serverMetadata.token_endpoint;
    if (!url) {
      throw new Error('token_endpoint not found in discovery document');
    }
    
    // UMA (User-Managed Access): request token with specific audience/permissions
    const requestBody = {
      grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket'
    };
    
    if (config.umaAudience) {
      requestBody.audience = config.umaAudience;
    }
    
    const body = toFormUrlEncoded(requestBody);
    const exchange = await executeOidcHttpCall({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Bearer ${req.session.auth.accessToken}`
      },
      body,
      requestBodyView: requestBody
    });
    res.json(exchange);
  });

  router.get('/oidc/token-exchange', async (req, res) => {
    const { config } = await getOidcClient();
    const providerAlias = typeof req.session.oidc?.kcIdpHint === 'string' ? req.session.oidc.kcIdpHint.trim() : '';
    const realmBaseUrl = buildRealmBaseUrl(config.discoveryUrl);

    if (!providerAlias) {
      return res.status(400).json({
        request: {
          url: `${realmBaseUrl}/broker/{provider_alias}/token`,
          method: 'GET',
          headers: {
            Accept: 'application/json'
          },
          body: null
        },
        reply: {
          http_code: 400,
          headers: {},
          body: {
            error: 'missing_kc_idp_hint',
            error_description: 'No IdP alias found in session. Login with Service Name first.'
          }
        }
      });
    }

    // Keycloak identity brokering: fetch original token from external IdP
    const exchange = await executeOidcHttpCall({
      url: `${realmBaseUrl}/broker/${encodeURIComponent(providerAlias)}/token`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${req.session.auth.accessToken}`
      }
    });
    res.json(exchange);
  });

  return router;
}

function createAppRoutes() {
  const router = express.Router();

  router.get('/login', async (req, res) => {
    try {
      const { oidcConfiguration, config } = await getOidcClient();
      
      // Create OIDC authorization request with state/nonce for security
      const authRequest = createAuthRequest(req.session, config);
      const idpHint = typeof req.query.kc_idp_hint === 'string' ? req.query.kc_idp_hint.trim() : '';
      req.session.oidc.kcIdpHint = idpHint || null;
      const authorizationParams = {
        scope: config.scope,
        redirect_uri: buildCallbackUrl(config),
        state: authRequest.state,  // Prevents CSRF attacks
        nonce: authRequest.nonce   // Prevents replay attacks
      };
      
      // Add PKCE parameters if enabled (adds security for public clients)
      if (config.usePkce) {
        authorizationParams.code_challenge_method = config.pkceMethod;
        authorizationParams.code_challenge = authRequest.codeChallenge;
      }

      if (idpHint) {
        // Keycloak hint to preselect an external identity provider on login screen
        authorizationParams.kc_idp_hint = idpHint;
      }
      
      const authorizationUrl = oidc.buildAuthorizationUrl(oidcConfiguration, authorizationParams).toString();
      return res.redirect(authorizationUrl);
    } catch (error) {
      console.error('[auth] Error in /login:', error.message);
      return res.redirect('/?message=Error%20starting%20login');
    }
  });

  router.get('/auth/callback', async (req, res) => {
    try {
      // Check if Keycloak returned an error
      const callbackError = typeof req.query.error === 'string' ? req.query.error : '';
      const callbackErrorDescription = typeof req.query.error_description === 'string' ? req.query.error_description : '';
      if (callbackError) {
        const detail = callbackErrorDescription ? `${callbackError}: ${callbackErrorDescription}` : callbackError;
        return res.redirect(`/?message=${encodeURIComponent(`OIDC callback error: ${detail}`)}`);
      }
      
      const { oidcConfiguration, config } = await getOidcClient();
      
      // Validate state/nonce to prevent CSRF and replay attacks
      const checks = {
        expectedState: req.session.oidc?.state,
        expectedNonce: req.session.oidc?.nonce
      };
      
      if (config.usePkce) {
        checks.pkceCodeVerifier = req.session.oidc?.codeVerifier;
      }
      
      // Exchange authorization code for tokens
      const currentUrl = new URL(req.originalUrl, config.domain);
      const tokenSet = await oidc.authorizationCodeGrant(oidcConfiguration, currentUrl, checks);
      
      // Store tokens in server-side session (never exposed to browser)
      setSessionTokens(req, tokenSet);
      return res.redirect('/tokens');
    } catch (error) {
      console.error('[auth] Error in OIDC callback:', error.message);
      return res.redirect('/?message=Error%20in%20OIDC%20callback');
    }
  });

  router.post('/logout', async (req, res) => {
    clearSession(req);
    return res.redirect('/');
  });

  router.use('/api', createApiRoutes());

  return router;
}

module.exports = {
  createAppRoutes
};
