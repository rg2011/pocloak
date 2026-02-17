const { isAuthenticated } = require('./auth.service');

function authGuard(req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'No hay sesión autenticada.'
    });
  }

  return res.redirect('/');
}

module.exports = {
  authGuard
};
