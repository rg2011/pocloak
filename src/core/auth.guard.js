const { isAuthenticated } = require('./auth.service');

function authGuard(req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  }

  return res.redirect('/');
}

module.exports = {
  authGuard
};
