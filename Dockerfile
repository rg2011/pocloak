FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN addgroup -g 1000 appgroup \
  && adduser -D -u 1000 -G appgroup -h /home/appuser appuser \
  && mkdir -p /home/appuser \
  && chown -R appuser:appgroup /app /home/appuser \
  && chmod -R a+rX /app /home/appuser \
  && chmod -R ug+w /app /home/appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV OIDC_CONFIG_PATH=/app/config/oidc.config.json

EXPOSE 3000

USER appuser

CMD ["npm", "start"]
