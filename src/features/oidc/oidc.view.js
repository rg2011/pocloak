const { renderLayout } = require('../home/home.view');
const { renderEndpointInspector } = require('./endpoint.inspector.view');

function renderOidcPage({ isAuthenticated }) {
  const inspector = renderEndpointInspector({
    prefix: 'oidc',
    hintText: 'Pulsa una pestaña para ejecutar la llamada.',
    tabs: [
      { label: 'Userinfo', endpoint: '/oidc/userinfo' },
      { label: 'Introspect', endpoint: '/oidc/introspect' },
      { label: 'UMA (RPT)', endpoint: '/oidc/uma' }
    ]
  });

  return renderLayout({
    title: 'OIDC Endpoints',
    isAuthenticated,
    activeNav: 'oidc',
    headsUp: inspector.headsUp,
    body: inspector.body
  });
}

module.exports = {
  renderOidcPage
};
