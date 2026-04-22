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

## Production files

- `.github/workflows/deploy-vps.yml`: CI and VPS deploy workflow
- `deploy/pm-web.nginx.conf`: nginx config for the shared VPS
- `.env.production.example`: recommended production API base for future frontend API calls

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
