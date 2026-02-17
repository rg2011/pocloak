require('dotenv').config();

const { createApp } = require('../app.bootstrap');
const { loadRuntimeConfig } = require('./keycloak.config');
const { routeMap } = require('../app.routes');

const port = Number(process.env.PORT || 3000);
const app = createApp();
const routes = routeMap();

app.listen(port, () => {
  const config = loadRuntimeConfig();

  console.info(`[server] POC escuchando en http://localhost:${port}`);
  console.info('[server] Rutas públicas:', routes.public.join(', '));
  console.info('[server] Rutas protegidas:', routes.protected.join(', '));
  console.info('[config] discoveryUrl:', config.discoveryUrl || '(sin configurar)');
  console.info('[config] clientId:', config.clientId || '(sin configurar)');
});
