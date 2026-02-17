# POCloak: Angular + Node + Keycloak (OIDC)

POC didáctica para equipos Angular.

Objetivo: enseñar el flujo OIDC end-to-end con una app Angular mínima y un backend Node (BFF) que guarda tokens en sesión servidor.

## Principios de esta POC

- Tutorial por encima de arquitectura enterprise.
- Tokens sensibles fuera del DOM.
- Sin toolkits UI extra: Bulma CDN + HTML semántico.
- Separación clara entre frontend Angular y backend OIDC.

## Arquitectura

- `web/`: SPA Angular standalone (router, guard, interceptor, páginas tutorial)
- `src/`: backend Node/Express + `openid-client`
- `config/oidc.config.json`: configuración editable en runtime

Flujo principal:

1. Angular dispara `GET /login`.
2. Keycloak autentica y redirige a `GET /auth/callback`.
3. Backend intercambia código por tokens y los guarda en `express-session`.
4. Angular consume endpoints en `/api/*` para inspeccionar requests/replies.

## Endpoints

Públicos:

- `GET /api/health`
- `GET /api/auth/status`
- `GET /api/config`
- `POST /api/config`
- `POST /api/config/restart`
- `GET /api/discovery/data`
- `GET /api/discovery/realm`
- `GET /api/discovery/uma2`

Protegidos:

- `GET /api/tokens`
- `GET /api/session`
- `GET /api/oidc/userinfo`
- `GET /api/oidc/introspect`
- `GET /api/oidc/uma`

Auth control:

- `GET /login`
- `GET /auth/callback`
- `POST /logout`

## Desarrollo local

Terminal 1 (backend):

```bash
npm install
npm run start:api
```

Terminal 2 (frontend Angular):

```bash
npm run dev:web
```

Abrir `http://localhost:4200`.

El dev server Angular proxea `/api`, `/login`, `/auth/*`, `/logout` al backend en `:3000`.

## Docker

```bash
docker compose build
docker compose up -d
```

En Docker, la imagen compila Angular en modo tutorial (`npm run build:web`: sin minificación y con sourcemaps) y Express sirve `dist/web` en `http://localhost:3000`.

## Configuración OIDC

Variables soportadas:

- `OIDC_DISCOVERY_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_USE_PKCE`
- `OIDC_PKCE_METHOD`
- `APP_DOMAIN`
- `OIDC_SCOPE`
- `OIDC_UMA_AUDIENCE`
- `SESSION_SECRET`

Persistencia editable:

- fichero JSON en `OIDC_CONFIG_PATH` (por defecto `./config/oidc.config.json`)

La configuración se guarda por API y se aplica tras `POST /api/config/restart`.

## Seguridad didáctica

- `refresh_token` no se renderiza en UI.
- llamadas OIDC muestran request/reply saneados (tokens obfuscados).
- no se usa `localStorage` para credenciales.
