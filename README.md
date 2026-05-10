# MECO Mission Control Web

React + Vite browser frontend for MECO Mission Control.

This app is the web workspace for planning, execution, inventory, manufacturing coordination, roster management, reporting, configuration, and project-level documentation workflows. It runs against `meco-mission-control-platform` and is deployed as static assets behind `nginx`.

## Table of Contents

- [System Overview](#system-overview)
- [Product Scope in This Repo](#product-scope-in-this-repo)
- [Current Navigation Model](#current-navigation-model)
- [Repository Layout](#repository-layout)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Authentication Behavior](#authentication-behavior)
- [API Integration and Contract Notes](#api-integration-and-contract-notes)
- [Development Workflow](#development-workflow)
- [Validation Commands](#validation-commands)
- [Deployment and Operations](#deployment-and-operations)
- [Troubleshooting](#troubleshooting)
- [Cross-Repo Responsibilities](#cross-repo-responsibilities)
- [Requirements and Specs](#requirements-and-specs)

## System Overview

Current production topology:

- `meco-mission-control-web`: static React build served by `nginx`
- `meco-mission-control-platform`: Fastify + Prisma API, default on port `8080`
- `Postgres`: backing store for the API

Traffic shape:

- Browser requests static assets from `nginx`
- Browser calls `/api/*` on the same origin
- `nginx` proxies `/api/*` and `/health` to the Mission Control API

`deploy/pm-web.nginx.conf` currently redirects HTTP to HTTPS on `meco-pm.duckdns.org`, serves static web files from `/opt/pm-web/site`, and proxies API/health routes to `127.0.0.1:8080`.

## Product Scope in This Repo

The web app is designed for broader-screen, high-context workflows that need more space and review context than the mobile app.

Current web responsibilities:

- Dashboard review: calendar, activity, and metrics
- Readiness review: action triage, milestones, subsystems, and risks
- Work planning: timeline, task board, and manufacturing execution views
- Robot configuration: map-first subsystem layout, mechanism editing, and part-instance context
- Inventory and purchasing: materials, parts, purchases, and robot-only part-mapping support
- Roster operations: workload, attendance, and directory workflows
- Reports: work logs, QA forms, and milestone results
- In-app help and interactive guidance

The mobile app (`meco-mission-control-mobile`) remains focused on fast in-shop updates. This repo prioritizes richer dashboard, planning, configuration, and review workflows.

## Current Navigation Model

The sidebar is organized by user-facing work area rather than raw data model entity.

| Section | Purpose | Current subviews |
| --- | --- | --- |
| Dashboard | Fast review of current schedule, activity, and health | Calendar, Activity, Metrics |
| Readiness | Items that need attention before execution or events | Action Required, Milestones, Subsystems, Risks |
| Config | Structure and directory maintenance | Robot Configuration, Part mappings, Directory |
| Work | Execution planning and fabrication flow | Timeline, Tasks, Manufacturing |
| Inventory | Materials, parts, and procurement | Materials, Parts, Purchases |
| Roster | Student/mentor availability and participation | Workload, Attendance |
| Reports | Historical and evidence-oriented records | Work logs, QA forms, Milestone results |

Important scope behavior:

- Manufacturing is robot-project specific.
- Robot projects expose Materials, Parts, and Purchases under Inventory.
- Non-robot projects collapse inventory toward Documents/Materials and Purchases.
- Robot Configuration is the preferred home for subsystem, mechanism, and part-instance structure editing.
- Part mappings are robot-only support context and should not be treated as a general standalone planning page.
- `All projects` can hide or redirect project-specific views when the selected scope cannot support them.

For the fuller living product spec, see [`docs/CURRENT_WEB_SPEC.md`](docs/CURRENT_WEB_SPEC.md).

## Repository Layout

The repo is organized by app shell and feature boundaries:

```text
src/
  app/                 # App shell, auth/session orchestration, theme/shell state
  components/          # Shared UI and layout primitives (topbar/sidebar/icons)
  features/
    auth/              # Auth screens and sign-in UX
    workspace/
      views/           # Task/readiness/inventory/manufacturing/roster/report/help views
      shared/          # Shared workspace types, defaults, utility options
      components/      # Workspace composition sections and grouped panel rendering
      Workspace*.tsx   # Workspace composition + modal hosts
  lib/
    auth.ts            # API client, auth/session calls, bootstrap normalization
    appUtils/          # Form, payload, layout, and domain utility helpers
    workspaceNavigation/ # Navigation constants, helpers, and types
  types/               # Shared frontend type contracts grouped by responsibility
```

Operational and deployment files:

- `.github/workflows/deploy-vps.yml`
- `deploy/pm-web.nginx.conf`
- `AGENTS.md`
- `environment.toml`
- `.env.example`
- `.env.production.example`

## Tech Stack

- React `19`
- Vite `8`
- TypeScript `6`
- ESLint `9`
- Jest `30` (`@swc/jest`)

Package scripts:

- `npm run dev`
- `npm run typecheck`
- `npm run test`
- `npm run test:ci`
- `npm run test:watch`
- `npm run lint`
- `npm run build`
- `npm run build:bundle`
- `npm run audit:organization`
- `npm run audit:organization:strict`
- `npm run verify`
- `npm run preview`

## Local Setup

### Prerequisites

- Node.js `22+` recommended (CI uses Node `22`)
- `npm`
- Running local `meco-mission-control-platform` backend (usually `http://localhost:8080`)

### 1) Install dependencies

```bash
npm install
```

### 2) Create local env file

```bash
cp .env.example .env
```

On Windows PowerShell, create `.env` manually if needed.

### 3) Start the web app

```bash
npm run dev
```

Default URL:

- `http://localhost:5173`

### 4) Start backend in parallel

Run `meco-mission-control-platform` locally so `/api` proxy requests succeed.

### 5) Validate before pushing

```bash
npm run verify
```

Use the individual commands (`typecheck`, `test`, `lint`, `build`) when narrowing a specific failure.

## Environment Variables

Frontend env vars are read by Vite (`import.meta.env`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base path for API requests from the browser client. Keep as `/api` for same-origin proxying in dev/prod. |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | Dev-server proxy target for `/api`. Only used by Vite dev server. |
| `VITE_LOCAL_GOOGLE_CLIENT_ID` | unset | Optional localhost-only override for Google web client ID during local development. |

Production example:

```env
VITE_API_BASE_URL=/api
```

## Authentication Behavior

Authentication state is backend-driven.

Startup flow:

1. Frontend calls `GET /api/auth/config`.
2. If auth is enabled, sign-in is required.
3. If auth is not enabled, workspace remains accessible (with auth config messaging).

Supported sign-in paths:

- Google Identity Services token exchange via `POST /api/auth/google`
- Email code flow via:
  - `POST /api/auth/email/start`
  - `POST /api/auth/email/verify`
- Dev-only bypass via `POST /api/auth/dev-bypass` (when backend exposes it outside production)

Important behavior details:

- Session token is persisted in `localStorage` (`meco.session.token`).
- On `401` responses, the token is cleared and user is forced to re-auth.
- Session validity is rechecked periodically.
- Google sign-in only renders on secure hosts:
  - localhost (`localhost`, `127.0.0.1`, `::1`) or
  - HTTPS origins

### Local Google SSO Testing

Use the Vite proxy so browser origin remains `http://localhost:5173` while API traffic stays under `/api`.

If Google sign-in fails locally because the backend-provided client is not authorized for localhost:

- Option A: Add `http://localhost:5173` to authorized JavaScript origins for that OAuth web client.
- Option B: Set `VITE_LOCAL_GOOGLE_CLIENT_ID` to a localhost-authorized client ID.

The frontend never needs a Google client secret.

For production, Google web sign-in requires HTTPS for non-localhost origins.

## API Integration and Contract Notes

The frontend API layer is in `src/lib/auth.ts`.

High-use endpoints from this app:

- Bootstrap and auth:
  - `GET /api/bootstrap`
  - `GET /api/auth/config`
  - `GET /api/auth/me`
  - `POST /api/auth/google`
  - `POST /api/auth/email/start`
  - `POST /api/auth/email/verify`
  - `POST /api/auth/dev-bypass` (non-production only)
- Planning/workflow:
  - `POST/PATCH /api/tasks`
  - `POST/PATCH/DELETE /api/events`
  - `POST /api/seasons`
  - `POST/PATCH /api/subsystems`
  - `POST/PATCH/DELETE /api/mechanisms`
- Inventory/manufacturing/artifacts:
  - `POST/PATCH/DELETE /api/materials`
  - `POST/PATCH/DELETE /api/part-definitions`
  - `POST/PATCH/DELETE /api/part-instances`
  - `POST/PATCH /api/purchases`
  - `POST/PATCH /api/manufacturing`
  - `GET/POST/PATCH/DELETE /api/artifacts`
- People/work logs:
  - `POST/PATCH/DELETE /api/members`
  - `POST /api/work-logs`

### Bootstrap Normalization in Frontend

The frontend currently includes compatibility normalization for legacy/bootstrap payload shapes. This is intentional to keep older data usable while contracts evolve.

Normalization currently backfills and aligns:

- missing seasons/projects/workstreams
- required per-season default project buckets
- scoped references for tasks/workstreams/subsystems
- default values for member/artifact/part/manufacturing/work-log fields

When changing backend contracts, validate both repos together:

- `meco-mission-control-platform/src/routes/registerRoutes.ts` is backend route/validation truth.
- `meco-mission-control-web/src/types/**` and `src/lib/auth.ts` must stay in sync.

## Development Workflow

Recommended local cycle:

1. Start backend (`meco-mission-control-platform`) locally.
2. Start web app (`npm run dev`).
3. Verify login flow and scoped workspace views (season/project).
4. Implement targeted changes.
5. Run the quality gate (`npm run verify`).
6. Push when local checks pass.

Branch and PR workflow is governed by `AGENTS.md`:

- `main` is production-ready only.
- `development` is the integration branch for active work.
- `feature/*`, `fix/*`, and `hotfix/*` are short-lived work branches.
- PRs into `development` must come from `feature/*`, `fix/*`, or `hotfix/*`.
- Merges into `main` should come only from `development` or `hotfix/*`.
- Protected branches require CI, snapshot validation, review approval, conversation resolution, linear history, and admin enforcement as described in `AGENTS.md`.

Codex/worktree notes:

- `environment.toml` is the startup source of truth for Codex worktrees.
- Keep startup commands and dev URL in `environment.toml`, not duplicated across docs.
- Put diagnostic screenshots, generated reports, and temporary snapshots under `.diagnostics/`, not in the repository root.

### Useful Frontend Entry Points

- App shell and composition: `src/app/App.tsx`
- Auth/session orchestration: `src/app/useAppAuth.ts`
- Workspace rendering and routing: `src/features/workspace/WorkspaceContent.tsx`
- View-specific UI: `src/features/workspace/views/*`
- Navigation model: `src/lib/workspaceNavigation/*`
- API calls and payload normalization: `src/lib/auth.ts`

## Validation Commands

Run these before merge/deploy:

```bash
npm run verify
```

What each gate catches:

- `typecheck`: TS type drift between views, shared types, and API payloads
- `lint`: code quality and consistency issues
- `test:ci`: behavior checks for utility and view logic
- `build:bundle`: production bundle correctness

For structural refactors or file/directory cleanup, also run:

```bash
npm run audit:organization:strict
```

## Deployment and Operations

### CI/CD Workflow

GitHub Actions file: `.github/workflows/deploy-vps.yml`

Trigger conditions:

- Pushes to `main` affecting app/workflow/deploy files
- Manual `workflow_dispatch`

Pipeline summary:

1. Validate job:
   - install deps (`npm ci`)
   - typecheck
   - test
   - lint
   - build
2. Deploy job:
   - rebuild app
   - rsync `dist/` to `/opt/pm-web/site`
   - upload `deploy/pm-web.nginx.conf` to `/opt/pm-web/deploy/`
   - ensure `nginx` installed/configured
   - reload/restart `nginx`
   - verify `/` and `/health`

### Required GitHub Secrets

Set in `MECO-Robotics/meco-mission-control-web`:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

### Runtime Paths on Server

- Static site root: `/opt/pm-web/site`
- Uploaded nginx config: `/opt/pm-web/deploy/pm-web.nginx.conf`
- Active nginx site file: `/etc/nginx/sites-available/pm-web`
- Enabled nginx symlink: `/etc/nginx/sites-enabled/pm-web`

## Troubleshooting

### "Could not load authentication configuration"

Check:

- backend is running
- Vite proxy target is correct
- `/api/auth/config` returns a valid JSON payload

### Google sign-in origin mismatch

Symptoms:

- Google button errors on localhost or deployed host

Fix:

- Ensure current frontend origin is in OAuth client authorized JavaScript origins
- On localhost, optionally set `VITE_LOCAL_GOOGLE_CLIENT_ID`
- Ensure production host is HTTPS

### Repeated session expiry / forced sign-out

Check:

- backend JWT settings and token validity
- clock skew on local machine/server
- whether `/api/auth/me` returns `401`

### Missing data after switching season/project

Remember:

- workspace data is intentionally scoped by selected season/project
- `All projects` view can hide project-specific tabs
- manufacturing tab appears only for robot project scope
- Robot Configuration and part-mapping support are robot-project specific

### API calls fail in local dev

Check:

- `VITE_API_BASE_URL` is `/api`
- backend is reachable at `VITE_DEV_PROXY_TARGET`
- backend CORS/origin settings match local frontend when needed

## Cross-Repo Responsibilities

Related repos:

- `meco-mission-control-platform`: API routes, validation, persistence, auth config truth
- `meco-mission-control-mobile`: mobile-focused client workflows

For auth, payload, schema, or API behavior changes:

1. Update backend contract and validation first.
2. Align frontend types and API client.
3. Re-test full flow end-to-end from web UI.

## Requirements and Specs

Current living specs and requirements references in `docs/`:

- `docs/CURRENT_WEB_SPEC.md` — current repo-local web app spec aligned to recent PRs and current navigation.
- `docs/MECO_MVP_Spec_v11.docx`
- `docs/MECO_MVP_Spec_v10.docx`
- `docs/MECO_Requirements_v11.docx`
- `docs/MECO_Requirements_v10_clean.docx`
- `docs/MECO_Requirements.docx`

Use `docs/CURRENT_WEB_SPEC.md` as the first reference for current web-app behavior. Treat the Word documents as historical baseline/spec sources unless they are explicitly refreshed in a future docs PR.
