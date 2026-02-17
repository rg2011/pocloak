FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN if getent passwd 1000 >/dev/null 2>&1; then \
      APP_USER="$(getent passwd 1000 | cut -d: -f1)"; \
      APP_GROUP="$(id -gn "$APP_USER")"; \
    else \
      addgroup -g 1000 appgroup; \
      adduser -D -u 1000 -G appgroup -h /home/appuser appuser; \
      APP_USER=appuser; \
      APP_GROUP=appgroup; \
    fi \
  && HOME_DIR="$(getent passwd "$APP_USER" | cut -d: -f6)" \
  && mkdir -p "$HOME_DIR" \
  && chown -R "$APP_USER:$APP_GROUP" /app "$HOME_DIR" \
  && chmod -R a+rX /app "$HOME_DIR" \
  && chmod -R ug+w /app "$HOME_DIR"

ENV NODE_ENV=production
ENV PORT=3000
ENV OIDC_CONFIG_PATH=/app/config/oidc.config.json

EXPOSE 3000

USER 1000:1000

CMD ["npm", "start"]
