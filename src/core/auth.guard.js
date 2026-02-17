// Auth Guard: protects routes that require authentication
// Similar to Angular's CanActivate guard

const { isAuthenticated } = require('./auth.service');

function authGuard(req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  }

  // API calls get 401, browser requests get redirected
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'No authenticated session found.'
    });
  }

  return res.redirect('/');
}

module.exports = {
  authGuard
};
