const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const session = require('express-session');
const { createAppRoutes } = require('./server/routes');

function resolveWebDistPath() {
  const candidatePaths = [path.join(process.cwd(), 'dist', 'web', 'browser'), path.join(process.cwd(), 'dist', 'web')];
  return candidatePaths.find((candidate) => fs.existsSync(path.join(candidate, 'index.html'))) || null;
}

function createApp() {
  const app = express();

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use(
    session({
      name: 'pocloak.sid',
      secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      }
    })
  );

  app.use(createAppRoutes());

  const webDistPath = resolveWebDistPath();
  if (webDistPath) {
    app.use(express.static(webDistPath));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/auth') ||
        req.path === '/login' ||
        req.path === '/logout'
      ) {
        return next();
      }

      return res.sendFile(path.join(webDistPath, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res
        .status(503)
        .send('Frontend Angular no compilado. Ejecuta `npm run build:web` o usa `npm run dev:web` en local.');
    });
  }

  app.use((error, req, res, next) => {
    console.error('[server] Unhandled error:', error.message);
    if (res.headersSent) {
      return next(error);
    }

    const isApiCall = req.path.startsWith('/api');
    if (isApiCall) {
      return res.status(500).json({
        error: 'internal_error',
        message: error.message
      });
    }

    return res.redirect(`/?message=${encodeURIComponent(error.message || 'Unexpected error')}`);
  });

  return app;
}

module.exports = {
  createApp
};
