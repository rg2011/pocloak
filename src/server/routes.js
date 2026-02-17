const express = require('express');
const oidc = require('openid-client');
const { authGuard } = require('../core/auth.guard');
const { tokenRefreshInterceptor } = require('../core/http.interceptor');
const { clearSession, getSafeTokenView, setSessionTokens } = require('../core/auth.service');
const { buildCallbackUrl, createAuthRequest, getOidcClient } = require('../core/oidc.client');
const { executeOidcHttpCall, toFormUrlEncoded } = require('../core/http.utils');
const { loadRuntimeConfig } = require('./keycloak.config');

// Get realm base URL from config or derive from discovery URL
// Example: https://keycloak.example.com/realms/myrealm
function getRealmBaseUrl(config) {
  if (config.realmBaseUrl) {
    return config.realmBaseUrl;
  }
  
  // Fallback: derive from discovery URL by removing /.well-known/... suffix
  const marker = '/.well-known/';
  const markerIndex = config.discoveryUrl.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('Cannot derive realm URL: set OIDC_REALM_BASE_URL or ensure discoveryUrl contains "/.well-known/"');
  }
  return config.discoveryUrl.slice(0, markerIndex);
}

function createApiRoutes() {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', now: new Date().toISOString() });
  });

  router.get('/auth/status', (req, res) => {
    const runtimeConfig = loadRuntimeConfig();
    res.json({
      isAuthenticated: Boolean(req.session.auth),
      tokens: getSafeTokenView(req),
      kcIdpHint: req.session.oidc?.kcIdpHint || null,
      validatedIdp: req.session.auth?.validatedIdp || null,
      hasClientSecret: Boolean(runtimeConfig.clientSecret)
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
    const realmBaseUrl = getRealmBaseUrl(config);
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
    const realmBaseUrl = getRealmBaseUrl(config);
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

  router.get('/tokens/access-token', (req, res) => {
    const runtimeConfig = loadRuntimeConfig();
    if (!runtimeConfig.enableRawTokenExport) {
      return res.status(403).json({
        error: 'raw_token_export_disabled',
        error_description: 'Enable OIDC_ENABLE_RAW_TOKEN_EXPORT=true to use this training endpoint.'
      });
    }

    const accessToken = req.session.auth?.accessToken;
    if (!accessToken) {
      return res.status(404).json({
        error: 'missing_access_token',
        error_description: 'No access token found in session.'
      });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    return res.send(accessToken);
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

  router.get('/oidc/idp-token', async (req, res) => {
    const { config } = await getOidcClient();
    const providerAlias = typeof req.session.oidc?.kcIdpHint === 'string' ? req.session.oidc.kcIdpHint.trim() : '';
    const realmBaseUrl = getRealmBaseUrl(config);

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
      setSessionTokens(req, tokenSet, { trustedIdpClaim: config.trustedIdpClaim });
      return res.redirect('/tokens');
    } catch (error) {
      console.error('[auth] Error in OIDC callback:', error.message);
      return res.redirect('/?message=Error%20in%20OIDC%20callback');
    }
  });

  router.get('/client-login', async (req, res) => {
    try {
      const { serverMetadata, config } = await getOidcClient();

      if (!config.clientSecret) {
        return res.redirect('/?message=Client%20credentials%20flow%20requires%20client%20secret');
      }

      const tokenEndpoint = serverMetadata.token_endpoint;
      if (!tokenEndpoint) {
        throw new Error('token_endpoint not found in discovery document');
      }

      // OAuth2 client credentials flow: authenticate as confidential client/service account.
      const requestBody = toFormUrlEncoded({
        grant_type: 'client_credentials',
        scope: config.scope
      });

      const basicCredentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${basicCredentials}`
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`client_credentials failed (${response.status}): ${errorText}`);
      }

      const tokenSet = await response.json();
      setSessionTokens(req, tokenSet, { trustedIdpClaim: config.trustedIdpClaim });
      req.session.oidc = {
        ...(req.session.oidc || {}),
        kcIdpHint: null,
        state: null,
        nonce: null,
        codeVerifier: null,
        createdAt: Date.now()
      };

      return res.redirect('/tokens');
    } catch (error) {
      console.error('[auth] Error in /client-login:', error.message);
      return res.redirect('/?message=Error%20in%20client%20credentials%20login');
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
