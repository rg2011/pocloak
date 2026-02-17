# AGENTS.md

## Objetivo del repositorio

Este repositorio es una POC didáctica para enseñar OIDC a equipos Angular, integrando Node.js con Keycloak.

Arquitectura inspirada en Angular: separación por `core`, `features`, `routes`, `guard`, `interceptor`.

**Prioridad**: claridad del flujo OIDC por encima de abstracciones complejas.

### Enfoque pedagógico

- Comentarios inline explican conceptos OIDC (state, nonce, PKCE, refresh)
- Código simplificado: ~60 líneas de sanitización vs 85+ en versiones anteriores
- Configuración simple: solo variables de entorno (sin persistencia en fichero)
- Diagramas visuales de flujo en la UI
- Inspector HTTP muestra request/response sanitizados

## Estado actual de implementación (fuente de verdad)

### Stack

- Node.js 20 (CommonJS)
- Express 4
- `openid-client`
- `express-session`
- HTML semántico + Bulma por CDN, sin CSS personalizado

### Estructura implementada

- Backend `src/`
  - `src/core`
    - `auth.service.js`
    - `auth.guard.js`
    - `http.interceptor.js`
    - `oidc.client.js`
  - `src/server`
    - `server.js`
    - `routes.js`
    - `keycloak.config.js`
  - `src/app.bootstrap.js`
  - `src/app.routes.js`
- Frontend Angular `web/src/app/`
  - `core/` (`auth.service.ts`, `auth.guard.ts`, `auth.interceptor.ts`, `api.types.ts`)
  - `features/` (`home`, `flows`, `discovery`, `oidc`, `tokens`, `session`)
  - `shared/` (`endpoint-inspector.component.ts`, `swimlane-diagram.component.ts`)
- Raíz:
  - `Dockerfile`
  - `docker-compose.yml`
  - `.devcontainer/devcontainer.json`
  - `.env.example` (plantilla de configuración)

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
   - `web/src/app/shared/endpoint-inspector.component.ts`
   - Se reutiliza en páginas `discovery` y `oidc` para evitar duplicación de tabs/script/curl/response.

### Configuración implementada

- Ruta de consulta: `GET /api/config`
- UI: pestaña `Config` dentro de `home` (no página `config` separada)
- Configuración desde variables de entorno (ver `.env.example`)
- No hay persistencia en fichero JSON (simplificado para uso local)

## Reglas de diseño (mantener)

- Mantener simplicidad y legibilidad explícita.
- Evitar frameworks frontend pesados y CSS custom.
- Mantener separación `core` / `features` / `server`.
- No exponer refresh token en el DOM.
- No introducir secretos en frontend.

## Guardrails pedagógicos (muy importante)

- Cada cambio debe enseñar un concepto OIDC concreto. Si no, no entra.
- Preferir implementación explícita y local sobre abstracciones genéricas.
- Evitar "side quests" de UX/infra que no mejoren la comprensión del flujo OIDC.
- Si una mejora de UI requiere más código que el concepto que explica, simplificar.
- Mantener rutas, tabs y componentes con comportamiento predecible y fácil de leer.

### Checklist antes de añadir funcionalidad

- ¿Qué concepto OIDC se aprende con este cambio?
- ¿Se puede explicar en 1-2 frases en la UI o en comentarios inline?
- ¿Añade más complejidad accidental que valor didáctico?
- ¿Existe una versión más simple (aunque menos "completa") que enseñe lo mismo?
- ¿Un desarrollador Angular nuevo en OIDC entendería el flujo leyendo este archivo?

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

- `Dockerfile` crea `appuser` con UID/GID 1000.
- `docker-compose.yml` lee variables de entorno desde `.env` local.
- Mantener `restart: unless-stopped` para facilitar desarrollo.

### Puntos frágiles conocidos

- La ruta `/oidc/uma` depende de configuración y permisos reales del cliente en Keycloak.
- Las rutas públicas `/discovery/uma2` y `/discovery/realm` se derivan desde `discoveryUrl`; si el formato de URL cambia y no contiene `/.well-known/`, la derivación puede fallar.
- `token_endpoint_auth_method` cambia según exista o no `clientSecret`.

### Qué no hacer sin pedir confirmación

- No añadir toolchains frontend ni bundlers.
- No cambiar almacenamiento de tokens a `localStorage`.
- No convertir esta POC en arquitectura de producción (RBAC complejo, etc.) salvo petición explícita.
- No reintroducir configuración dinámica con persistencia en fichero (simplificado para uso local).
