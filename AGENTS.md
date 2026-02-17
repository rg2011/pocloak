# AGENTS.md

## Objetivo del repositorio

Este repositorio es una POC didáctica para integrar Node.js con Keycloak usando OIDC, con arquitectura inspirada en Angular (separación por `core`, `features`, `routes`, `guard`, `interceptor`).

Prioridad: claridad del flujo OIDC por encima de abstracciones complejas.

## Estado actual de implementación (fuente de verdad)

### Stack

- Node.js 20 (CommonJS)
- Express 4
- `openid-client`
- `express-session`
- HTML semántico + Bulma por CDN, sin CSS personalizado

### Estructura implementada

- `src/core`
  - `auth.service.js`
  - `auth.guard.js`
  - `http.interceptor.js`
  - `oidc.client.js`
- `src/features`
  - `discovery`
  - `home`
  - `tokens`
  - `session`
  - `oidc`
  - `config`
- `src/server`
  - `server.js`
  - `routes.js`
  - `keycloak.config.js`
- Raíz:
  - `src/app.bootstrap.js`
  - `src/app.routes.js`
  - `config/oidc.config.json`
  - `Dockerfile`
  - `docker-compose.yml`
  - `.devcontainer/devcontainer.json`

### Flujo OIDC implementado

1. `GET /login` redirige a Keycloak.
2. `GET /auth/callback` intercambia código por tokens.
3. Tokens se guardan en `express-session`.
4. `AuthGuard` protege rutas privadas.
5. Interceptor intenta refresh con `refresh_token` cuando el access token está por expirar.
6. Endpoints demo:
   - Públicos:
     - `/discovery/data` (OIDC discovery)
     - `/discovery/uma2` (UMA2 well-known)
     - `/discovery/realm` (metadata pública del realm)
   - Protegidos:
     - `/oidc/userinfo`
     - `/oidc/introspect`
     - `/oidc/uma`

7. UI de inspección HTTP compartida:
   - `src/features/oidc/endpoint.inspector.view.js`
   - Se reutiliza en páginas `discovery` y `oidc` para evitar duplicación de tabs/script/curl/response.

### Configuración implementada

- Ruta editable: `GET/POST /config`
- Ruta de reinicio controlado: `POST /config/restart` (usa `process.exit(0)`)
- Fichero configurable por `OIDC_CONFIG_PATH` (default `./config/oidc.config.json`)
- Merge: defaults desde env + sobreescritura desde fichero

## Reglas de diseño (mantener)

- Mantener simplicidad y legibilidad explícita.
- Evitar frameworks frontend pesados y CSS custom.
- Mantener separación `core` / `features` / `server`.
- No exponer refresh token en el DOM.
- No introducir secretos en frontend.

## Notas para futuras sesiones agentic

### Alcance y estilo de cambios

- Preferir cambios pequeños y localizados.
- No reestructurar carpetas salvo necesidad clara.
- Mantener nombres explícitos y logs didácticos del flujo OIDC.

### Verificaciones mínimas antes de cerrar tarea

- Ejecutar parseo sintáctico JS:
  - `for f in $(rg --files src -g '*.js'); do node --check "$f" || exit 1; done`
- Si se tocaron docs de ejecución, comprobar consistencia con:
  - `Dockerfile`
  - `docker-compose.yml`
  - `.devcontainer/devcontainer.json`
  - `README.md`

### Docker y permisos

- `Dockerfile` crea `appuser` con UID/GID 1000 y home.
- `docker-compose.yml` fuerza `user: "1000:1000"` para volumen de `./config`.
- Mantener `restart: unless-stopped` para soportar reinicio tras `/config/restart`.

### Puntos frágiles conocidos

- La ruta `/oidc/uma` depende de configuración y permisos reales del cliente en Keycloak.
- Las rutas públicas `/discovery/uma2` y `/discovery/realm` se derivan desde `discoveryUrl`; si el formato de URL cambia y no contiene `/.well-known/`, la derivación puede fallar.
- `token_endpoint_auth_method` cambia según exista o no `clientSecret`.
- Cambios de configuración requieren reinicio del proceso para recargar estado limpio del cliente OIDC en memoria.

### Qué no hacer sin pedir confirmación

- No añadir toolchains frontend ni bundlers.
- No cambiar almacenamiento de tokens a `localStorage`.
- No convertir esta POC en arquitectura de producción (RBAC complejo, etc.) salvo petición explícita.
