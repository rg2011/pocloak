const { loadRuntimeConfig } = require('../../server/keycloak.config');
const { renderHome } = require('./home.view');

function homePage(req, res) {
  const config = loadRuntimeConfig();
  const message = typeof req.query.message === 'string' ? req.query.message : '';
  res.send(
    renderHome({
      isAuthenticated: Boolean(req.session.auth),
      config,
      message
    })
  );
}

module.exports = {
  homePage
};
