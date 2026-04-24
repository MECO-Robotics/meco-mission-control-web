# MECO Web

React/Vite browser frontend for the MECO Robotics project-management platform.

## Hosting direction

This repo now targets the same self-managed Linux VPS as `PM-server`.

The current production shape is:

- `PM-web-app`: static React build served by `nginx`
- `PM-server`: Fastify + Prisma API on port `8080`
- `Postgres`: running alongside the API in Docker

`nginx` serves the web app on port `80`, proxies `/api` to `PM-server`, and proxies `/health` to the backend health endpoint.

## Why this repo exists

The requirements doc strongly supports both mobile-friendly use and broader browser-based access. This repo is the desktop/web surface for:

- mentor and admin dashboards
- subsystem health review
- QA and escalation queues
- purchasing and fabrication oversight
- planning and reporting views

The mobile app remains optimized for in-shop updates, sign-ins, and quick workflow actions.

## Stack split

- `PM-mobile-app`: Expo/React Native for mobile-first workflow access
- `PM-web-app`: React/Vite for browser dashboards and admin access
- `PM-server`: Fastify + Prisma API on the shared VPS

## Local commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Local SSO testing

Use the Vite proxy so the browser can stay on `http://localhost:5173` while API calls still go through `/api`.

- Default local API target: `http://localhost:8080`
- Optional live API target for frontend-only testing: set `VITE_DEV_PROXY_TARGET` to the API host you want Vite to proxy to

Example local frontend env:

```env
VITE_API_BASE_URL=/api
VITE_DEV_PROXY_TARGET=http://localhost:8080
# Optional if the server's Google client is not authorized for localhost:5173:
# VITE_LOCAL_GOOGLE_CLIENT_ID=your-localhost-web-client-id.apps.googleusercontent.com
```

To test Google sign-in from localhost, either:

- add `http://localhost:5173` as an authorized JavaScript origin on the same Google OAuth web client the API returns from `/api/auth/config`
- or set `VITE_LOCAL_GOOGLE_CLIENT_ID` so the frontend uses a separate localhost-safe Google OAuth web client during local development only

When the backend is configured for a non-production environment, the login page also shows a `Continue as local dev` button. It opens a dev-only session without going through Google or email, which keeps the real sign-in UI available for testing while making local development faster.

## Production files

- `.github/workflows/deploy-vps.yml`: CI and VPS deploy workflow
- `deploy/pm-web.nginx.conf`: nginx config for the shared VPS
- `.env.production.example`: recommended production API base for future frontend API calls

## Google SSO

The web app reads its sign-in requirements from `PM-server` at `/api/auth/config`.

- If the server has `GOOGLE_CLIENT_ID` and `AUTH_JWT_SECRET`, the app can require Google sign-in.
- If the server also exposes email sign-in, the login card will show a one-time code fallback for verified `@mecorobotics.org` addresses.
- If the server is not configured yet, the dashboard stays visible with a configuration-pending banner.
- The frontend does not need a Google client secret. Do not add one to this repo or to frontend env files.

For production, Google Identity Services expects a secure origin. Plan to use a real domain with HTTPS and add that exact origin in the Google Cloud Console OAuth client before turning SSO on for the live site.

## Required GitHub secrets

Add these secrets to `MECO-Robotics/PM-web-app`:

- `VPS_HOST`: public IP or hostname of the server
- `VPS_USER`: deploy user, currently `root`
- `VPS_SSH_KEY`: private SSH key used by GitHub Actions

## Deployment behavior

On every push to `main`, GitHub Actions will:

1. install dependencies
2. typecheck, lint, and build the app
3. sync `dist/` to `/opt/pm-web/site`
4. sync the nginx config to `/opt/pm-web/deploy/pm-web.nginx.conf`
5. install nginx if it is missing
6. reload nginx and verify both `/` and `/health`

For future frontend API integration, production requests should target `/api` so the web app and backend stay same-origin behind nginx.
