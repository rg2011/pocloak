const express = require('express');
const oidc = require('openid-client');
const { authGuard } = require('../core/auth.guard');
const { tokenRefreshInterceptor } = require('../core/http.interceptor');
const { clearSession, getSafeTokenView, setSessionTokens } = require('../core/auth.service');
const { buildCallbackUrl, createAuthRequest, getOidcClient } = require('../core/oidc.client');
const { getConfigFilePath, getRawConfigFile, loadRuntimeConfig, saveConfigFile } = require('./keycloak.config');

const OBFUSCATED_SECRET = '[secret-obfuscated]';
const SENSITIVE_FIELD_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'access_token',
  'refresh_token',
  'id_token',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'client_secret'
]);

function obfuscateSecret(value, label = 'secret') {
  if (!value || typeof value !== 'string') {
    return OBFUSCATED_SECRET;
  }

  if (value.length <= 12) {
    return `[${label}-obfuscated]`;
  }

  return `${value.slice(0, 6)}...[${label}-obfuscated]...${value.slice(-4)}`;
}

function sanitizeAuthorizationHeader(value) {
  if (typeof value !== 'string') {
    return OBFUSCATED_SECRET;
  }

  if (value.startsWith('Bearer ')) {
    return `Bearer ${obfuscateSecret(value.slice(7).trim(), 'token')}`;
  }

  if (value.startsWith('Basic ')) {
    return 'Basic [credentials-obfuscated]';
  }

  return OBFUSCATED_SECRET;
}

function isSensitiveFieldName(fieldName) {
  if (!fieldName) {
    return false;
  }

  const normalized = String(fieldName).toLowerCase();
  return SENSITIVE_FIELD_NAMES.has(normalized);
}

function sanitizeData(value, fieldName = '') {
  if (value === null || typeof value === 'undefined') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeData(item, fieldName));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, sanitizeData(entryValue, key)])
    );
  }

  if (typeof value === 'string' && isSensitiveFieldName(fieldName)) {
    if (fieldName.toLowerCase() === 'authorization') {
      return sanitizeAuthorizationHeader(value);
    }

    if (fieldName.toLowerCase() === 'set-cookie' || fieldName.toLowerCase() === 'cookie') {
      return OBFUSCATED_SECRET;
    }

    return obfuscateSecret(value, 'token');
  }

  return value;
}

function headersToObject(headersLike) {
  if (!headersLike) {
    return {};
  }

  const entries = typeof headersLike.entries === 'function' ? [...headersLike.entries()] : Object.entries(headersLike);
  return Object.fromEntries(entries);
}

function sanitizeHeaders(headersLike) {
  const headers = headersToObject(headersLike);
  return sanitizeData(headers);
}

function makeStandardExchange({ request, reply }) {
  return {
    request: {
      url: request.url,
      method: request.method,
      headers: request.headers || {},
      body: request.body || null
    },
    reply: {
      http_code: reply.httpCode,
      headers: reply.headers || {},
      body: reply.body || null
    }
  };
}

async function readHttpBody(httpResponse) {
  const rawBody = await httpResponse.text();

  if (!rawBody) {
    return null;
  }

  const contentType = httpResponse.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return rawBody;
  }

  try {
    const parsed = JSON.parse(rawBody);
    return sanitizeData(parsed);
  } catch (error) {
    return rawBody;
  }
}

function bodyToObject(body) {
  if (body === null || typeof body === 'undefined') {
    return null;
  }

  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }

  return body;
}

function toFormUrlEncoded(payload) {
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && typeof value !== 'undefined') {
      body.append(key, String(value));
    }
  });
  return body;
}

function buildRealmBaseUrl(discoveryUrl) {
  const marker = '/.well-known/';
  const markerIndex = discoveryUrl.indexOf(marker);

  if (markerIndex < 0) {
    throw new Error('No se pudo derivar realm base URL desde discoveryUrl.');
  }

  return discoveryUrl.slice(0, markerIndex);
}

async function executeOidcHttpCall({ url, method, headers = {}, body = null, requestBodyView = undefined }) {
  const httpResponse = await fetch(url, {
    method,
    headers,
    body
  });
  const responseBody = await readHttpBody(httpResponse);
  const requestBody = typeof requestBodyView === 'undefined' ? bodyToObject(body) : requestBodyView;

  return makeStandardExchange({
    request: {
      url,
      method,
      headers: sanitizeHeaders(headers),
      body: sanitizeData(requestBody)
    },
    reply: {
      httpCode: httpResponse.status,
      headers: sanitizeHeaders(httpResponse.headers),
      body: responseBody
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
    res.json({
      filePath: getConfigFilePath(),
      runtimeConfig: loadRuntimeConfig(),
      rawConfig: getRawConfigFile()
    });
  });

  router.post('/config', (req, res) => {
    const nextConfig = req.body;
    const savedConfig = saveConfigFile(nextConfig || {});
    res.json({ ok: true, config: savedConfig });
  });

  router.post('/config/restart', (req, res) => {
    res.json({ ok: true, message: 'Configuración guardada. Reiniciando proceso...' });
    setTimeout(() => process.exit(0), 150);
  });

  router.get('/discovery/data', async (req, res) => {
    const { config } = await getOidcClient();
    const exchange = await executeOidcHttpCall({
      url: config.discoveryUrl,
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    res.json(exchange);
  });

  router.get('/discovery/realm', async (req, res) => {
    const { config } = await getOidcClient();
    const realmBaseUrl = buildRealmBaseUrl(config.discoveryUrl);
    const exchange = await executeOidcHttpCall({
      url: realmBaseUrl,
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    res.json(exchange);
  });

  router.get('/discovery/uma2', async (req, res) => {
    const { config } = await getOidcClient();
    const realmBaseUrl = buildRealmBaseUrl(config.discoveryUrl);
    const exchange = await executeOidcHttpCall({
      url: `${realmBaseUrl}/.well-known/uma2-configuration`,
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    res.json(exchange);
  });

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
      throw new Error('No existe userinfo_endpoint en el discovery document.');
    }

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
      throw new Error('No existe introspection_endpoint en el discovery document.');
    }

    const requestBody = {
      token: req.session.auth.accessToken,
      token_type_hint: 'access_token'
    };

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
      throw new Error('No existe token_endpoint en el discovery document.');
    }

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

  return router;
}

function createAppRoutes() {
  const router = express.Router();

  router.get('/login', async (req, res) => {
    try {
      const { oidcConfiguration, config } = await getOidcClient();
      const authRequest = createAuthRequest(req.session, config);
      const authorizationParams = {
        scope: config.scope,
        redirect_uri: buildCallbackUrl(config),
        state: authRequest.state,
        nonce: authRequest.nonce
      };

      if (config.usePkce) {
        authorizationParams.code_challenge_method = config.pkceMethod;
        authorizationParams.code_challenge = authRequest.codeChallenge;
      }

      const authorizationUrl = oidc.buildAuthorizationUrl(oidcConfiguration, authorizationParams).toString();
      return res.redirect(authorizationUrl);
    } catch (error) {
      console.error('[auth] Error en /login:', error.message);
      return res.redirect('/?message=Error%20iniciando%20login');
    }
  });

  router.get('/auth/callback', async (req, res) => {
    try {
      const callbackError = typeof req.query.error === 'string' ? req.query.error : '';
      const callbackErrorDescription = typeof req.query.error_description === 'string' ? req.query.error_description : '';

      if (callbackError) {
        const detail = callbackErrorDescription ? `${callbackError}: ${callbackErrorDescription}` : callbackError;
        return res.redirect(`/?message=${encodeURIComponent(`Error en callback OIDC (${detail})`)}`);
      }

      const { oidcConfiguration, config } = await getOidcClient();
      const checks = {
        expectedState: req.session.oidc?.state,
        expectedNonce: req.session.oidc?.nonce
      };

      if (config.usePkce) {
        checks.pkceCodeVerifier = req.session.oidc?.codeVerifier;
      }

      const currentUrl = new URL(req.originalUrl, config.domain);
      const tokenSet = await oidc.authorizationCodeGrant(oidcConfiguration, currentUrl, checks);
      setSessionTokens(req, tokenSet);
      return res.redirect('/tokens');
    } catch (error) {
      console.error('[auth] Error en callback OIDC:', error.message);
      return res.redirect('/?message=Error%20en%20callback%20OIDC');
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
