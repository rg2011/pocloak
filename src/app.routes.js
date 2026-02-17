function routeMap() {
  return {
    public: [
      'GET /login',
      'GET /auth/callback',
      'POST /logout',
      'GET /api/health',
      'GET /api/auth/status',
      'GET /api/config',
      'GET /api/discovery/data',
      'GET /api/discovery/uma2',
      'GET /api/discovery/realm'
    ],
    protected: [
      'GET /api/tokens',
      'GET /api/session',
      'GET /api/oidc/userinfo',
      'GET /api/oidc/introspect',
      'GET /api/oidc/uma'
    ]
  };
}

module.exports = {
  routeMap
};
