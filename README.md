# POCloak: Angular + Node + Keycloak (OIDC)

Educational proof of concept for Angular teams.

Goal: show an end-to-end OIDC flow with a minimal Angular app and a Node BFF that keeps tokens in server-side session.

## Principles

- Tutorial clarity over enterprise architecture.
- Sensitive tokens never exposed in the DOM.
- No extra UI toolkit: Bulma CDN + semantic HTML.
- Clear split between Angular frontend and Node OIDC backend.
- New features are accepted only when they improve OIDC learning value.

## Architecture

- `web/`: Angular standalone SPA (router, guard, interceptor, tutorial pages)
- `src/`: Node/Express backend + `openid-client`

Main flow:

1. Angular triggers `GET /login`.
2. Keycloak authenticates and redirects to `GET /auth/callback`.
3. Backend exchanges code for tokens and stores them in `express-session`.
4. Angular calls `/api/*` endpoints to inspect requests and replies.

## Code Organization

### Backend (Node/Express)

- `src/core/`: Core OIDC functionality
  - `auth.service.js`: Token management in server-side session
  - `auth.guard.js`: Protects routes requiring authentication
  - `http.interceptor.js`: Automatic token refresh
  - `oidc.client.js`: OIDC discovery and client configuration
- `src/server/`: Server setup
  - `server.js`: Express server entry point
  - `routes.js`: API endpoints with inline teaching comments
  - `keycloak.config.js`: Environment-based configuration
- `src/app.bootstrap.js`: Express app initialization
- `src/app.routes.js`: Route map (public vs protected)

### Frontend (Angular)

- `web/src/app/core/`: Auth services, guards, interceptors
- `web/src/app/features/`: Page components (home, flows, tokens, session, oidc, discovery)
- `web/src/app/shared/`: Reusable components (endpoint inspector, swimlane diagram)

### Teaching Features

- Inline comments explain OIDC concepts (state, nonce, PKCE, token refresh)
- Visual swimlane diagrams show login/access flows and a conceptual SPA+PKCE flow
- HTTP inspector shows sanitized request/response for each OIDC call
- Home page includes a Config tab that displays current settings with .env instructions

## Endpoints

Public:

- `GET /api/health`
- `GET /api/auth/status`
- `GET /api/config`
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

Configuration is loaded from environment variables:

- `OIDC_DISCOVERY_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_USE_PKCE`
- `OIDC_PKCE_METHOD`
- `APP_DOMAIN`
- `OIDC_SCOPE`
- `OIDC_UMA_AUDIENCE`
- `SESSION_SECRET`

To configure:

1. Copy `.env.example` to `.env`
2. Edit values in `.env`
3. Restart the server

## Security Notes

- `refresh_token` is never sent to the browser (stored only in server-side session).
- OIDC request/reply payloads are sanitized before display (tokens obfuscated).
- No credentials in `localStorage` or browser storage.
- JWT tokens decoded for display only (not verified - teaching purpose).
- Inline comments mark security-critical code sections.
