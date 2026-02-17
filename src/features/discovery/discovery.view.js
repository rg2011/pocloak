const { renderLayout } = require('../home/home.view');
const { renderEndpointInspector } = require('../oidc/endpoint.inspector.view');

function renderDiscoveryPage({ isAuthenticated }) {
  const inspector = renderEndpointInspector({
    prefix: 'discovery',
    hintText: 'Pulsa una pestaña para cargar metadata pública derivada de la URL base del realm.',
    tabs: [
      { label: 'Discovery', endpoint: '/discovery/data' },
      { label: 'UMA2 Discovery', endpoint: '/discovery/uma2' },
      { label: 'Realm metadata', endpoint: '/discovery/realm' }
    ]
  });

  return renderLayout({
    title: 'Discovery',
    isAuthenticated,
    activeNav: 'discovery',
    headsUp: inspector.headsUp,
    body: inspector.body
  });
}

module.exports = {
  renderDiscoveryPage
};
