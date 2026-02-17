function renderHeadsUp({ id = '', text = '', type = 'info', hideWhenAuthenticated = false, hideOnEvent = '' }) {
  if (!text) {
    return '';
  }

  const safeType = ['info', 'success', 'warning', 'danger'].includes(type) ? type : 'info';
  const idAttr = id ? ` id="${id}"` : '';
  const hideWhenAuthAttr = hideWhenAuthenticated ? ' data-hide-when-auth="true"' : '';
  const hideOnEventAttr = hideOnEvent ? ` data-hide-on-event="${hideOnEvent}"` : '';

  return `<div${idAttr} class="notification is-${safeType} is-light" data-heads-up="true"${hideWhenAuthAttr}${hideOnEventAttr}>${text}</div>`;
}

function renderLayout({ title, body, headsUp = '', isAuthenticated, activeNav = '' }) {
  const itemClass = (key) =>
    `navbar-item${activeNav === key ? ' is-active has-background-link-light has-text-link-dark has-text-weight-semibold' : ''}`;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css" />
    <style>
      :root {
        --bulma-body-size: 1rem;
      }

      body {
        font-size: 1rem;
      }
    </style>
  </head>
  <body data-authenticated="${isAuthenticated ? 'true' : 'false'}">
    <nav class="navbar is-light" role="navigation" aria-label="main navigation">
      <div class="container">
        <div class="navbar-brand">
          <a class="navbar-item" href="/"><strong>POCloak</strong></a>
        </div>
        <div class="navbar-menu is-active">
          <div class="navbar-start">
            <a class="${itemClass('config')}" href="/config">Configuración</a>
            <a class="${itemClass('discovery')}" href="/discovery">Discovery</a>
            <a class="${itemClass('home')}" href="/">Inicio</a>
            ${
              isAuthenticated
                ? `<a class="${itemClass('tokens')}" href="/tokens">Tokens</a>`
                : '<a class="navbar-item has-text-grey-light" aria-disabled="true" tabindex="-1" style="opacity:.5;cursor:not-allowed;pointer-events:none;" title="Requiere login">Tokens</a>'
            }
            ${
              isAuthenticated
                ? `<a class="${itemClass('session')}" href="/session">Sesión</a>`
                : '<a class="navbar-item has-text-grey-light" aria-disabled="true" tabindex="-1" style="opacity:.5;cursor:not-allowed;pointer-events:none;" title="Requiere login">Sesión</a>'
            }
            ${isAuthenticated ? `<a class="${itemClass('oidc')}" href="/oidc">OIDC Endpoints</a>` : ''}
          </div>
          <div class="navbar-end">
            <div class="navbar-item">
              ${
                isAuthenticated
                  ? '<form method="post" action="/logout"><button class="button is-danger" type="submit">Logout</button></form>'
                  : '<a class="button is-primary" href="/login">Login</a>'
              }
            </div>
          </div>
        </div>
      </div>
    </nav>

    <section class="section">
      <div class="container">
        ${headsUp}
        <div class="box">
          ${body}
        </div>
      </div>
    </section>
    <script>
      (function initHeadsUp() {
        const isAuthenticated = document.body.dataset.authenticated === 'true';
        const headsUps = document.querySelectorAll('[data-heads-up]');

        function hide(el) {
          el.style.display = 'none';
        }

        for (const headsUp of headsUps) {
          if (headsUp.dataset.hideWhenAuth === 'true' && isAuthenticated) {
            hide(headsUp);
            continue;
          }

          const hideOnEvent = headsUp.dataset.hideOnEvent;
          if (hideOnEvent) {
            window.addEventListener(
              hideOnEvent,
              () => hide(headsUp),
              {
                once: true
              }
            );
          }
        }
      })();
    </script>
  </body>
</html>`;
}

function renderHome({ isAuthenticated, config, message }) {
  const redirectUri = new URL('/auth/callback', config.domain).toString();
  const status = isAuthenticated
    ? '<span class="tag is-success">Autenticado</span>'
    : '<span class="tag is-warning">No autenticado</span>';

  const notification = renderHeadsUp({
    id: 'home-heads-up',
    text: message,
    type: 'info',
    hideWhenAuthenticated: true
  });

  return renderLayout({
    title: 'Inicio',
    isAuthenticated,
    activeNav: 'home',
    headsUp: notification,
    body: `
          <div class="tabs is-boxed">
            <ul>
              <li class="is-active" data-home-tab-item="status"><a href="#" data-home-tab="status">Status</a></li>
              <li data-home-tab-item="implementation"><a href="#" data-home-tab="implementation">Implementation details</a></li>
              <li data-home-tab-item="keycloak"><a href="#" data-home-tab="keycloak">Keycloak hints</a></li>
            </ul>
          </div>

          <div data-home-panel="status">
            <p class="title is-5">Estado de autenticación</p>
            <p>${status}</p>
            <hr />
            <p><strong>Discovery URL:</strong> ${config.discoveryUrl || '(sin configurar)'}</p>
            <p><strong>Client ID:</strong> ${config.clientId || '(sin configurar)'}</p>
            <p><strong>PKCE:</strong> ${config.usePkce ? 'Activado' : 'Desactivado'} (${config.pkceMethod})</p>
            <p><strong>Redirect base domain:</strong> ${config.domain}</p>
            <p><strong>Redirect URI para Keycloak:</strong> <code>${redirectUri}</code></p>
          </div>

          <div data-home-panel="implementation" style="display:none;">
            <p class="title is-5">Implementación del flujo OIDC</p>
            <p>Callback configurado: <code>${redirectUri}</code></p>

            <p class="title is-6" style="margin-top:0.75rem;">1) Login page</p>
            <ul style="margin-left:1.25rem;">
              <li><code>GET /login</code> prepara checks con <code>createAuthRequest(...)</code> en <code>src/core/oidc.client.js</code>.</li>
              <li>Se guardan <code>state</code>, <code>nonce</code> y (si aplica) <code>codeVerifier</code> en <code>express-session</code>.</li>
              <li>Se construye la URL de autorización con <code>openid-client</code>: <code>oidc.buildAuthorizationUrl(...)</code>.</li>
            </ul>

            <p class="title is-6" style="margin-top:0.75rem;">2) Keycloak login</p>
            <ul style="margin-left:1.25rem;">
              <li>El navegador se redirige a Keycloak (<code>/authorize</code>) para autenticación de usuario.</li>
              <li>Keycloak devuelve al cliente a <code>${redirectUri}</code> con parámetros OAuth (<code>code</code>, <code>state</code> o <code>error</code>).</li>
            </ul>

            <p class="title is-6" style="margin-top:0.75rem;">3) Callback validation</p>
            <ul style="margin-left:1.25rem;">
              <li><code>GET /auth/callback</code> revisa primero <code>error</code> y <code>error_description</code>.</li>
              <li>Luego valida <code>expectedState</code>, <code>expectedNonce</code> y <code>pkceCodeVerifier</code> (si PKCE está activo).</li>
              <li>Intercambia <code>code</code> por tokens con <code>openid-client</code>: <code>oidc.authorizationCodeGrant(...)</code>.</li>
              <li>Persiste tokens server-side con <code>setSessionTokens(...)</code> en <code>src/core/auth.service.js</code>.</li>
            </ul>

            <p class="title is-6" style="margin-top:0.75rem;">4) Protected pages</p>
            <ul style="margin-left:1.25rem;">
              <li><code>authGuard</code> protege <code>/tokens</code>, <code>/session</code> y <code>/oidc/*</code>.</li>
              <li><code>tokenRefreshInterceptor()</code> intenta refresh si el access token está próximo a expirar.</li>
            </ul>

            <p class="title is-6" style="margin-top:0.75rem;">5) Public metadata pages</p>
            <ul style="margin-left:1.25rem;">
              <li><code>/discovery</code> es público y consulta metadata sin access token: <code>/discovery/data</code>, <code>/discovery/uma2</code>, <code>/discovery/realm</code>.</li>
              <li>Las URLs de <code>/discovery/uma2</code> y <code>/discovery/realm</code> se derivan desde la <code>discoveryUrl</code> configurada.</li>
            </ul>

            <p class="title is-6" style="margin-top:0.75rem;">6) Shared inspector UI</p>
            <ul style="margin-left:1.25rem;">
              <li>La UI de inspección (tabs + curl + response) se reutiliza en páginas pública y privada desde <code>src/features/oidc/endpoint.inspector.view.js</code>.</li>
            </ul>
          </div>

          <div data-home-panel="keycloak" style="display:none;">
            <p class="title is-5">Keycloak hints</p>
            <p><strong>Callback URI:</strong> <code>${redirectUri}</code></p>
            <p><strong>Client ID:</strong> <code>${config.clientId || 'pocloak'}</code></p>
            <p style="margin-top:0.75rem;">
              Si <code>/oidc/uma</code> devuelve <code>403 access_denied/not_authorized</code>, revisa en Keycloak:
              cliente <code>${config.clientId || 'pocloak'}</code> &rarr; <strong>Settings</strong> &rarr; activa
              <strong>Authorization Enabled</strong>. Después, en la pestaña <strong>Authorization</strong>, crea al menos
              una Policy y un Permission que permitan emitir RPT para el recurso/audience configurado
              (<code>${config.umaAudience || 'pocloak'}</code>).
            </p>
          </div>
      <script>
        (function initHomeTabs() {
          const tabLinks = document.querySelectorAll('[data-home-tab]');
          const tabItems = document.querySelectorAll('[data-home-tab-item]');
          const panels = document.querySelectorAll('[data-home-panel]');

          function showTab(tabId) {
            for (const item of tabItems) {
              item.classList.toggle('is-active', item.dataset.homeTabItem === tabId);
            }
            for (const panel of panels) {
              panel.style.display = panel.dataset.homePanel === tabId ? '' : 'none';
            }
          }

          for (const link of tabLinks) {
            link.addEventListener('click', (event) => {
              event.preventDefault();
              showTab(link.dataset.homeTab);
            });
          }
        })();
      </script>
    `
  });
}

module.exports = {
  renderHome,
  renderLayout,
  renderHeadsUp
};
