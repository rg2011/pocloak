# Devcontainer Usage

This project includes a devcontainer at `.devcontainer/devcontainer.json` for online development (for example, GitHub Codespaces or VS Code Dev Containers).

## Start

1. Open the repository in a devcontainer-compatible environment.
2. Reopen in container when prompted.
3. Wait for `postCreateCommand` to finish (`npm install`).
4. The app starts automatically on attach with `npm run dev:container`.

## Access the app

- Open forwarded port `3000`.
- Base URL is usually `http://localhost:3000` (or your cloud workspace forwarded URL).

## Default container behavior

- Node.js 20 environment.
- `PORT=3000`.
- `OIDC_CONFIG_PATH` points to `config/oidc.config.json` inside the workspace.
- Runs as non-root user `node`.

## Quick test checklist

1. Open `/` and verify home page loads.
2. Open `/config` and verify config file is visible/editable.
3. Save a small config change and verify persistence in `config/oidc.config.json`.
4. Use "Guardar y reiniciar proceso" in `/config` and verify it redirects to `/` and the app comes back up.
5. If Keycloak is configured, test `/login` and callback flow.
