const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_CONFIG_PATH = process.env.OIDC_CONFIG_PATH || path.join(process.cwd(), 'config', 'oidc.config.json');

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('[config] No se pudo leer/parsing del fichero de configuración:', error.message);
    return null;
  }
}

function envConfig() {
  return {
    discoveryUrl: process.env.OIDC_DISCOVERY_URL || '',
    clientId: process.env.OIDC_CLIENT_ID || '',
    clientSecret: process.env.OIDC_CLIENT_SECRET || '',
    usePkce: (process.env.OIDC_USE_PKCE || 'true').toLowerCase() === 'true',
    pkceMethod: process.env.OIDC_PKCE_METHOD || 'S256',
    domain: process.env.APP_DOMAIN || 'http://localhost:3000',
    scope: process.env.OIDC_SCOPE || 'openid profile email offline_access',
    umaAudience: process.env.OIDC_UMA_AUDIENCE || ''
  };
}

function sanitizeConfig(config) {
  return {
    discoveryUrl: config.discoveryUrl || '',
    clientId: config.clientId || '',
    clientSecret: config.clientSecret || '',
    usePkce: typeof config.usePkce === 'boolean' ? config.usePkce : true,
    pkceMethod: config.pkceMethod === 'plain' ? 'plain' : 'S256',
    domain: config.domain || 'http://localhost:3000',
    scope: config.scope || 'openid profile email offline_access',
    umaAudience: config.umaAudience || ''
  };
}

function getConfigFilePath() {
  return DEFAULT_CONFIG_PATH;
}

function loadRuntimeConfig() {
  const fromFile = readJsonFile(DEFAULT_CONFIG_PATH) || {};
  const fromEnv = envConfig();
  const merged = {
    ...fromEnv,
    ...fromFile
  };

  return sanitizeConfig(merged);
}

function getRawConfigFile() {
  const config = readJsonFile(DEFAULT_CONFIG_PATH);
  return config || {};
}

function saveConfigFile(nextConfig) {
  const safeConfig = sanitizeConfig(nextConfig);
  const parent = path.dirname(DEFAULT_CONFIG_PATH);

  fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(DEFAULT_CONFIG_PATH, `${JSON.stringify(safeConfig, null, 2)}\n`, 'utf-8');

  return safeConfig;
}

module.exports = {
  getConfigFilePath,
  getRawConfigFile,
  loadRuntimeConfig,
  saveConfigFile
};
