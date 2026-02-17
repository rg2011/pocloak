# POCloak: Node + Keycloak (OIDC)

POC didáctica para mostrar integración Node.js + Keycloak con flujo OIDC completo y estructura orientada al modelo mental de Angular (`core`, `features`, `routes`, `guard`, `interceptor`).

## Stack actual

- Node.js 20 + Express 4
- `openid-client`
- `express-session`
- UI server-side HTML semántico + Bulma CDN (sin CSS custom)

## Estructura actual

- `src/core`
  - `auth.service.js`: sesión de tokens, decode JWT, checks de refresh
  - `auth.guard.js`: protección de rutas autenticadas
  - `http.interceptor.js`: refresh automático por expiración
  - `oidc.client.js`: discovery, cliente OIDC y PKCE/state/nonce
- `src/features`
  - `home`, `discovery`, `tokens`, `session`, `oidc`, `config` (vistas/controlador)
- `src/server`
  - `server.js`: arranque y logs
  - `routes.js`: rutas públicas/protegidas
  - `keycloak.config.js`: lectura/merge/persistencia de configuración
- `config/oidc.config.json`: fichero editable en runtime

## Rutas

Públicas:

- `GET /`
- `GET /login`
- `GET /auth/callback`
- `POST /logout`
- `GET /config`
- `POST /config/restart` (guarda el JSON enviado, redirige a `/` y hace `process.exit(0)`)
- `GET /discovery` (pantalla pública con tabs de metadata)
- `GET /discovery/data` (llamada HTTP al OIDC discovery document)
- `GET /discovery/uma2` (llamada HTTP a la well-known UMA2 del realm)
- `GET /discovery/realm` (llamada HTTP a metadata pública del realm)

Protegidas (`AuthGuard` + interceptor refresh):

- `GET /tokens`
- `GET /session`
- `GET /oidc`
- `GET /oidc/userinfo`
- `GET /oidc/introspect`
- `GET /oidc/uma`

Separación funcional:

- `Discovery` (público) se centra en metadata pública de Keycloak/realm.
- `OIDC Endpoints` (protegido) se centra en llamadas que requieren access token de sesión.

En `discovery`, `userinfo`, `introspect` y `uma` la respuesta incluye:

- `request`: `url`, `method`, `headers`, `body`
- `reply`: `http_code`, `headers`, `body`

Los tokens se muestran ofuscados en los datos de llamada y en campos token-like de la respuesta.

## Configuración OIDC

Fuente de configuración (orden de precedencia):

1. Variables de entorno (valores por defecto)
2. Fichero JSON en `OIDC_CONFIG_PATH` (sobrescribe defaults)

Variables soportadas:

- `OIDC_DISCOVERY_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_USE_PKCE` (`true`/`false`)
- `OIDC_PKCE_METHOD` (`S256`/`plain`)
- `APP_DOMAIN` (base para `redirect_uri`)
- `OIDC_SCOPE`
- `OIDC_UMA_AUDIENCE`
- `SESSION_SECRET`

## Ejecución local

```bash
npm install
cp .env.example .env
npm start
```

Abrir `http://localhost:3000`.

`npm start` usa `scripts/process-supervisor.js`, que vuelve a levantar el proceso cuando `/config/restart` hace `process.exit(0)`.

## Docker

```bash
docker compose build
docker compose up -d
```

Detalles relevantes:

- `Dockerfile` crea usuario `appuser` (`uid=1000`, `gid=1000`, con home).
- `docker-compose.yml` monta `./config:/app/config`.
- `docker-compose.yml` usa `restart: unless-stopped`.
- El contenedor se ejecuta como `1000:1000` para evitar conflictos de permisos en volumen host.

## Devcontainer

- Configuración: `.devcontainer/devcontainer.json`
- Guía: `.devcontainer/README.md`
- Arranque automático: `npm run dev:container` (mismo supervisor de proceso que `npm start`)

## Notas de seguridad de esta POC

- El refresh token nunca se renderiza en DOM.
- Los tokens se guardan en sesión server-side.
- No se usa `localStorage`.
- Esta implementación es didáctica y no pretende ser producción-ready.
