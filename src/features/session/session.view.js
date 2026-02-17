const { renderLayout } = require('../home/home.view');

function renderSession({ isAuthenticated, session }) {
  const safeSession = {
    auth: session.auth
      ? {
          accessToken: session.auth.accessToken ? '[present]' : '[empty]',
          idToken: session.auth.idToken ? '[present]' : '[empty]',
          refreshToken: session.auth.refreshToken ? '[hidden]' : '[empty]',
          expiresAt: session.auth.expiresAt,
          scope: session.auth.scope,
          updatedAt: session.auth.updatedAt
        }
      : null,
    oidc: session.oidc || null
  };

  return renderLayout({
    title: 'Sesión',
    isAuthenticated,
    activeNav: 'session',
    body: `
      <p>Estado de sesión server-side</p>
      <pre>${JSON.stringify(safeSession, null, 2)}</pre>
    `
  });
}

module.exports = {
  renderSession
};
