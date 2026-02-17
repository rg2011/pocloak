const { renderLayout } = require('../home/home.view');

function renderTokens({ isAuthenticated, tokens }) {
  const content = !tokens
    ? `
      <p>No hay tokens en sesión.</p>
    `
    : `
      <p>Vista segura de tokens</p>
      <table class="table is-fullwidth is-striped">
        <tbody>
          <tr><th>Token type</th><td>${tokens.tokenType || ''}</td></tr>
          <tr><th>Scope</th><td>${tokens.scope || ''}</td></tr>
          <tr><th>Expires at (epoch)</th><td>${tokens.expiresAt || ''}</td></tr>
          <tr><th>Refresh token presente</th><td>${tokens.hasRefreshToken ? 'Sí' : 'No'}</td></tr>
        </tbody>
      </table>
      <p class="title is-6">ID Token Claims (decodificado)</p>
      <pre>${JSON.stringify(tokens.idTokenClaims, null, 2)}</pre>
      <p class="title is-6">Access Token Claims (decodificado)</p>
      <pre>${JSON.stringify(tokens.accessTokenClaims, null, 2)}</pre>
    `;

  return renderLayout({
    title: 'Tokens',
    isAuthenticated,
    activeNav: 'tokens',
    body: content
  });
}

module.exports = {
  renderTokens
};
