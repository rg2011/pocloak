# POCloak: Angular + Node + Keycloak (OIDC)

Educational proof of concept for Angular teams.

Goal: show an end-to-end OIDC flow with a minimal Angular app and a Node BFF that keeps tokens in server-side session.

## Principles

- Tutorial clarity over enterprise architecture.
- Sensitive tokens never exposed in the DOM.
- No extra UI toolkit: Bulma CDN + semantic HTML.
- Clear split between Angular frontend and Node OIDC backend.

## Architecture

- `web/`: Angular standalone SPA (router, guard, interceptor, tutorial pages)
- `src/`: Node/Express backend + `openid-client`
- `config/oidc.config.json`: runtime-editable OIDC config

Main flow:

1. Angular triggers `GET /login`.
2. Keycloak authenticates and redirects to `GET /auth/callback`.
3. Backend exchanges code for tokens and stores them in `express-session`.
4. Angular calls `/api/*` endpoints to inspect requests and replies.

## Endpoints

Public:

- `GET /api/health`
- `GET /api/auth/status`
- `GET /api/config`
- `POST /api/config`
- `POST /api/config/restart`
- `GET /api/discovery/data`
- `GET /api/discovery/realm`
- `GET /api/discovery/uma2`

Protected:

- `GET /api/tokens`
- `GET /api/session`
- `GET /api/oidc/userinfo`
- `GET /api/oidc/introspect`
- `GET /api/oidc/uma`

Auth control:

- `GET /login`
- `GET /auth/callback`
- `POST /logout`

## Local Development

Terminal 1 (backend):

```bash
npm install
npm run start:api
```

Terminal 2 (frontend Angular):

```bash
npm run dev:web
```

Open `http://localhost:4200`.

Angular dev server proxies `/api`, `/login`, `/auth/*`, and `/logout` to backend at `:3000`.

## Docker

```bash
docker compose build
docker compose up -d
```

In Docker, image builds Angular in tutorial mode (`npm run build:web`: non-minified + sourcemaps) and Express serves `dist/web` at `http://localhost:3000`.

## OIDC Configuration

Supported env vars:

- `OIDC_DISCOVERY_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_USE_PKCE`
- `OIDC_PKCE_METHOD`
- `APP_DOMAIN`
- `OIDC_SCOPE`
- `OIDC_UMA_AUDIENCE`
- `SESSION_SECRET`

Persisted runtime config:

- JSON file in `OIDC_CONFIG_PATH` (default `./config/oidc.config.json`)

Config is saved via API and applied after `POST /api/config/restart`.

## Security Notes

- `refresh_token` is never rendered in UI.
- OIDC request/reply payloads are sanitized (token-like fields obfuscated).
- No `localStorage` credentials.
