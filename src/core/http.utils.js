// HTTP Utilities: plumbing code for request/response handling
// You can skip this file when learning OIDC - it's just HTTP formatting

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

module.exports = {
  executeOidcHttpCall,
  toFormUrlEncoded
};
