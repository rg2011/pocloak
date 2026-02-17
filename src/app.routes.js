function routeMap() {
  return {
    public: [
      'GET /',
      'GET /login',
      'GET /auth/callback',
      'GET /config',
      'POST /config/restart',
      'POST /logout',
      'GET /discovery',
      'GET /discovery/data',
      'GET /discovery/uma2',
      'GET /discovery/realm'
    ],
    protected: ['GET /tokens', 'GET /session', 'GET /oidc', 'GET /oidc/userinfo', 'GET /oidc/introspect', 'GET /oidc/uma']
  };
}

module.exports = {
  routeMap
};
