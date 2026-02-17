const express = require('express');
const session = require('express-session');
const { createAppRoutes } = require('./server/routes');

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

  return app;
}

module.exports = {
  createApp
};
