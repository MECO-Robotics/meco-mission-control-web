# MECO Mission Control Web

React + Vite browser frontend for MECO Mission Control.

This repository contains the broad-screen web workspace for Mission Control: planning, readiness review, robot configuration, inventory, manufacturing coordination, roster operations, reports, and help/tutorial workflows. It runs against `meco-mission-control-platform` and is deployed as static assets behind `nginx`.

Use this README as the contributor entry point. Use [`docs/CURRENT_WEB_SPEC.md`](docs/CURRENT_WEB_SPEC.md) as the current product/spec reference.

## Table of Contents

- [What This Repo Owns](#what-this-repo-owns)
- [System Overview](#system-overview)
- [Quick Start](#quick-start)
- [Common Development Tasks](#common-development-tasks)
- [Current Navigation Model](#current-navigation-model)
- [View-to-File Map](#view-to-file-map)
- [Application Architecture](#application-architecture)
- [Repository Layout](#repository-layout)
- [Data Flow and API Boundary](#data-flow-and-api-boundary)
- [Authentication Behavior](#authentication-behavior)
- [Environment Variables](#environment-variables)
- [Validation and Testing](#validation-and-testing)
- [Development Workflow](#development-workflow)
- [Deployment and Operations](#deployment-and-operations)
- [Troubleshooting](#troubleshooting)
- [Cross-Repo Responsibilities](#cross-repo-responsibilities)
- [Requirements and Specs](#requirements-and-specs)

## What This Repo Owns

`meco-mission-control-web` owns the dense desktop/tablet experience for Mission Control.

It should be the first place to implement workflows that need:

- large planning surfaces
- cross-domain review
- configuration editing
- timeline/board comparison
- evidence review
- mentor/admin context
- richer filtering and diagnostics

The mobile app (`meco-mission-control-mobile`) remains the faster in-shop update surface. Shared behavior should stay contract-compatible, but this repo is the primary home for higher-context workflows.

Current web responsibilities:

- Dashboard review: calendar, activity, and metrics
- Readiness review: action triage, milestones, subsystems, and risks
- Work planning: timeline, task board, and manufacturing execution views
- Robot configuration: map-first subsystem layout, mechanism editing, and part-instance context
- Inventory and purchasing: materials, parts, purchases, and robot-only part-mapping support
- Roster operations: workload, attendance, and directory workflows
- Reports: work logs, QA forms, and milestone results
- In-app help and interactive guidance

## System Overview

Current production topology:

```text
Browser
  |
  | static assets, /api/*, /health
  v
nginx on VPS
  |-- serves web build from /opt/pm-web/site
  |-- proxies /api/* and /health
  v
meco-mission-control-platform on 127.0.0.1:8080
  |
  v
Postgres
```

Repos involved:

- `meco-mission-control-web`: this React/Vite frontend
- `meco-mission-control-platform`: Fastify + Prisma API and persistence
- `meco-mission-control-mobile`: mobile client for fast in-shop updates

`deploy/pm-web.nginx.conf` currently redirects HTTP to HTTPS on `meco-pm.duckdns.org`, serves static web files from `/opt/pm-web/site`, and proxies API/health routes to `127.0.0.1:8080`.

## Quick Start

### Prerequisites

- Node.js `22+` recommended; CI uses Node `22`
- `npm`
- A running local `meco-mission-control-platform` backend, usually on `http://localhost:8080`

### Install

```bash
npm install
```

### Configure env

```bash
cp .env.example .env
```

On Windows PowerShell, create `.env` manually if needed.

Default local frontend API behavior expects:

```env
VITE_API_BASE_URL=/api
VITE_DEV_PROXY_TARGET=http://localhost:8080
```

### Run locally

```bash
npm run dev
```

Default local URL:

```text
http://localhost:5173
```

### Validate before pushing

```bash
npm run verify
```

`verify` runs typecheck, lint, Jest CI tests, and the production bundle build.

## Common Development Tasks

### Add or change a workspace view

1. Find the user-facing navigation key in `src/lib/workspaceNavigation/*`.
2. Find the section renderer in `src/features/workspace/components/sections/*`.
3. Implement the view under `src/features/workspace/views/*`.
4. Add helper/model code near the view if it is view-specific.
5. Add or update tests near existing tests for that view.
6. Run a targeted test, then `npm run verify`.

### Add a sidebar or topbar destination

1. Update navigation types in `src/lib/workspaceNavigation/types.ts`.
2. Update labels/order/targets in `src/lib/workspaceNavigation/constants.ts`.
3. Update helper logic in `src/lib/workspaceNavigation/helpers.ts` if route matching changes.
4. Wire the target into the relevant workspace section component.
5. Check all-project, robot-project, and non-robot-project gating.

### Add a backend-backed record mutation

1. Confirm or implement the backend endpoint in `meco-mission-control-platform`.
2. Add or update frontend request code under `src/lib/auth/*`.
3. Update shared frontend types under `src/types/*`.
4. Wire the action through the relevant app hook:
   - `useAppWorkspaceTaskActions`
   - `useAppWorkspaceCatalogActions`
   - `useAppWorkspaceReportActions`
   - `useAppWorkspaceRosterActions`
5. Pass the action through the controller/shell slice only as far as needed.
6. Add optimistic UI, rollback, unauthorized handling, and data refresh behavior where appropriate.

### Add or change bootstrap data fields

1. Update backend bootstrap shape first.
2. Update frontend types in `src/types/*`.
3. Update normalization in `src/lib/auth/bootstrap` only when compatibility with older payloads is required.
4. Update derived selectors/hooks under `src/app/hooks` or view-local model helpers.
5. Test empty data, legacy data, selected season/project, and `All projects` behavior.

### Change robot configuration behavior

Start with:

- `src/features/workspace/views/taskQueue/TaskRobotMapPlaceholderView.tsx`
- robot-map helper/model files in that view folder
- subsystem layout utilities under `src/lib/appUtils/subsystemLayout`
- subsystem/mechanism/part actions under app workspace catalog/task hooks

Required checks:

- dragging and persisted layout
- reset/auto-arrange behavior
- selected subsystem detail panel
- mechanism and part-instance edit flows
- robot-only gating
- storage/API failure rollback behavior

### Change top-level app shell behavior

Start with:

- `src/app/AppWorkspaceCoreImpl.tsx`
- `src/app/hooks/useAppWorkspaceController.ts`
- `src/app/hooks/useAppWorkspaceState.ts`
- `src/app/hooks/useAppWorkspaceModel.ts`
- `src/app/shell/*`
- `src/components/layout/*`

Avoid pushing view-specific business logic into the shell. The shell should compose state, routing, layout, auth gates, modals, and cross-view controls.

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

## View-to-File Map

Use this table to find the right implementation area before changing UI behavior.

| User-facing area | Primary files |
| --- | --- |
| App/auth gate | `src/app/AppWorkspaceCoreImpl.tsx`, `src/app/hooks/useAppAuth.ts` |
| Shell/controller composition | `src/app/hooks/useAppWorkspaceController.ts`, `src/app/shell/*` |
| Workspace panel routing | `src/features/workspace/WorkspaceContent.tsx`, `src/features/workspace/components/WorkspaceContentPanelsView.tsx` |
| Navigation constants | `src/lib/workspaceNavigation/types.ts`, `src/lib/workspaceNavigation/constants.ts`, `src/lib/workspaceNavigation/helpers.ts` |
| Calendar | `src/features/workspace/views/taskQueue/TaskCalendarPlaceholderView.tsx` |
| Timeline | `src/features/workspace/views/timeline/*` |
| Robot Configuration | `src/features/workspace/views/taskQueue/TaskRobotMapPlaceholderView.tsx` and related robot-map helpers |
| Tasks board | `src/features/workspace/views/taskQueue/TaskQueueView.tsx` |
| Milestones | `src/features/workspace/views/milestones/*` |
| Action Required / Risks / Metrics | `src/features/workspace/views/RisksView.tsx` and related risk/metrics helpers |
| Work logs / Activity | `src/features/workspace/views/worklogs/*` |
| Reports / QA / Milestone results | `src/features/workspace/views/reports/*` |
| Manufacturing | `src/features/workspace/views/manufacturing/*` |
| Inventory | `src/features/workspace/views/inventory/*` |
| Subsystems | `src/features/workspace/views/subsystems/*` |
| Roster | `src/features/workspace/views/roster/*` |
| Help/tutorial | `src/features/workspace/views/help/*`, `src/app/interactiveTutorial/*` |
| Shared workspace shells | `src/features/workspace/components/*` |
| API client facade | `src/lib/auth.ts`, `src/lib/auth/*` |
| Payload builders/utilities | `src/lib/appUtils/*` |
| Shared frontend types | `src/types/*` |

## Application Architecture

The app follows a composition pattern:

```text
App.tsx
  -> AppWorkspaceCoreImpl
      -> auth/config gate
      -> SignInScreen or AppWorkspaceShellView
          -> useAppWorkspaceController
              -> useAppWorkspaceState
              -> useAppWorkspaceDerived
              -> useAppWorkspaceLoader
              -> domain action hooks
          -> WorkspaceContent
              -> section renderers
              -> concrete views
```

### Main layers

| Layer | Responsibility | Avoid putting here |
| --- | --- | --- |
| `src/app` | auth gate, shell state, workspace controller, app-level effects | view-specific UI details |
| `src/components` | shared layout and reusable primitives | domain-specific business rules |
| `src/features/workspace/components` | workspace panel composition and section routing | individual view model complexity |
| `src/features/workspace/views` | concrete user workflows | global app/session concerns |
| `src/lib/auth` | API requests, auth/session helpers, bootstrap normalization | visual/UI logic |
| `src/lib/appUtils` | payload builders and reusable domain utilities | React component state |
| `src/types` | shared frontend contract types | implementation functions |

### Controller/action flow

The workspace controller is intentionally split:

- `useAppWorkspaceState`: local UI state, selected tab/view, selected season/project/member, modal state, toast state
- `useAppWorkspaceDerived`: derived selections, filtered records, scope helpers
- `useAppWorkspaceLoader`: workspace bootstrap loading, unauthorized handling, uploads, refresh helpers
- `useAppWorkspaceTaskActions`: task/event/milestone-oriented mutations
- `useAppWorkspaceCatalogActions`: inventory, subsystem, mechanism, part, manufacturing, purchase mutations
- `useAppWorkspaceReportActions`: QA/report mutations
- `useAppWorkspaceRosterActions`: member/roster mutations
- `buildShellController`: narrows the full model/actions into the props needed by the rendered shell

Do not pass the full app model into new components by default. Prefer narrow props or a focused controller slice.

## Repository Layout

```text
.github/
  workflows/              # CI/deploy workflows

deploy/
  pm-web.nginx.conf       # Production nginx site config

docs/
  CURRENT_WEB_SPEC.md     # Living current web-app spec
  *.docx                  # Historical requirements/spec baselines

scripts/
  organization-audit.mjs  # File/directory/CSS guardrail audit
  codex-worktree-bootstrap.ps1

src/
  app/
    hooks/                # App/workspace state, derived data, loader, actions, controller builders
    interactiveTutorial/  # Guided tutorial state and definitions
    shell/                # App shell view composition
    AppWorkspaceCoreImpl.tsx

  components/
    layout/               # Sidebar, topbar, icons, portal slots
    ui/                   # Shared low-level UI components

  features/
    auth/                 # Auth/sign-in screens
    workspace/
      components/         # Workspace panel composition and section renderers
      shared/             # Workspace shared defaults, filters, model helpers
      views/              # Concrete workspace views by domain
      Workspace*.tsx      # Workspace entrypoints and modal hosts

  lib/
    auth/                 # Auth, session, bootstrap, record API helpers
    appUtils/             # Payload builders and domain utility helpers
    workspaceNavigation/  # Navigation types, constants, helpers

  types/                  # Frontend contract and record types
```

Operational files:

- `AGENTS.md`: workflow, branch, file-size, directory-size, CSS, and Codex worktree rules
- `environment.toml`: Codex worktree startup source of truth
- `.env.example`: local env template
- `.env.production.example`: production env template
- `package.json`: scripts and dependencies

## Data Flow and API Boundary

The frontend API facade is exposed through `src/lib/auth.ts`, which re-exports narrower modules from `src/lib/auth/*`.

High-use endpoint groups:

- Bootstrap and auth:
  - `GET /api/bootstrap`
  - `GET /api/auth/config`
  - `GET /api/auth/me`
  - `POST /api/auth/google`
  - `POST /api/auth/email/start`
  - `POST /api/auth/email/verify`
  - `POST /api/auth/dev-bypass` in non-production only
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

### Bootstrap normalization

The frontend includes compatibility normalization for older or evolving bootstrap payloads. This is intentional, but it should not become a substitute for a clear backend contract.

Normalization currently backfills and aligns:

- missing seasons/projects/workstreams
- required per-season default project buckets
- scoped references for tasks/workstreams/subsystems
- default values for member/artifact/part/manufacturing/work-log fields

When changing backend contracts:

1. Update `meco-mission-control-platform` route validation/schema first.
2. Update frontend types in `src/types/*`.
3. Update request/normalization code in `src/lib/auth/*`.
4. Update view models/selectors that derive from the changed fields.
5. Test with scoped season/project selection, `All projects`, robot project, and non-robot project states.

## Authentication Behavior

Authentication state is backend-driven.

Startup flow:

1. Frontend calls `GET /api/auth/config`.
2. If auth is enabled, sign-in is required.
3. If auth is not enabled, workspace remains accessible with auth config messaging.

Supported sign-in paths:

- Google Identity Services token exchange via `POST /api/auth/google`
- Email code flow via:
  - `POST /api/auth/email/start`
  - `POST /api/auth/email/verify`
- Dev-only bypass via `POST /api/auth/dev-bypass` when backend exposes it outside production

Important behavior details:

- Session token is persisted in `localStorage` as `meco.session.token`.
- On `401` responses, the token is cleared and the user is forced to re-auth.
- Session validity is rechecked periodically.
- Google sign-in only renders on secure hosts:
  - localhost (`localhost`, `127.0.0.1`, `::1`)
  - HTTPS origins

### Local Google SSO testing

Use the Vite proxy so browser origin remains `http://localhost:5173` while API traffic stays under `/api`.

If Google sign-in fails locally because the backend-provided client is not authorized for localhost:

- Add `http://localhost:5173` to authorized JavaScript origins for that OAuth web client, or
- Set `VITE_LOCAL_GOOGLE_CLIENT_ID` to a localhost-authorized client ID.

The frontend never needs a Google client secret.

For production, Google web sign-in requires HTTPS for non-localhost origins.

## Environment Variables

Frontend env vars are read by Vite through `import.meta.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base path for API requests from the browser client. Keep as `/api` for same-origin proxying in dev/prod. |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | Dev-server proxy target for `/api`. Only used by Vite dev server. |
| `VITE_LOCAL_GOOGLE_CLIENT_ID` | unset | Optional localhost-only override for Google web client ID during local development. |

Production example:

```env
VITE_API_BASE_URL=/api
```

## Validation and Testing

### Main quality gate

Run before merge/deploy:

```bash
npm run verify
```

`verify` runs:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:ci`
4. `npm run build:bundle`

### Targeted commands

| Command | Use when |
| --- | --- |
| `npm run typecheck` | changing types, API payloads, component props, navigation keys |
| `npm run lint` | changing React hooks, imports, or general TS/TSX code |
| `npm run test:ci` | validating the full Jest suite in CI mode |
| `npm run test:watch` | iterating locally on a specific unit/view test |
| `npm run build:bundle` | checking Vite production bundle correctness |
| `npm run audit:organization` | checking file/directory/CSS organization warnings |
| `npm run audit:organization:strict` | enforcing hard organization limits before structural PRs |

### Useful targeted test patterns

```bash
npm run test:ci -- TimelineView
npm run test:ci -- RisksView
npm run test:ci -- WorkLogsView
npm run test:ci -- AppSidebar
```

Use targeted tests first when narrowing behavior, then run `npm run verify` before marking the PR ready.

### Organization guardrails

`AGENTS.md` defines the hard rules. Practical summary:

- Prefer small cohesive files and directories.
- Split React/TS files before they exceed the hard cap.
- Split large CSS by component or responsibility.
- Avoid flat mixed-responsibility directories.
- Keep diagnostics and generated artifacts under `.diagnostics/`.
- Use `environment.toml` as the Codex worktree startup source of truth.

## Development Workflow

Recommended local cycle:

1. Start backend (`meco-mission-control-platform`) locally.
2. Start web app (`npm run dev`).
3. Verify login flow and scoped workspace views.
4. Implement the smallest coherent change.
5. Run targeted tests for the touched area.
6. Run `npm run verify`.
7. Push and open a PR into `development`.

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
- When working in a worktree, audit UI changes against the worktree-hosted app instance before finishing.

## Deployment and Operations

### CI/CD workflow

GitHub Actions file:

```text
.github/workflows/deploy-vps.yml
```

Trigger conditions:

- Pushes to `main` affecting app/workflow/deploy files
- Manual `workflow_dispatch`

Pipeline summary:

1. Validate job:
   - install deps with `npm ci`
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

### Required GitHub secrets

Set in `MECO-Robotics/meco-mission-control-web`:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

### Runtime paths on server

- Static site root: `/opt/pm-web/site`
- Uploaded nginx config: `/opt/pm-web/deploy/pm-web.nginx.conf`
- Active nginx site file: `/etc/nginx/sites-available/pm-web`
- Enabled nginx symlink: `/etc/nginx/sites-enabled/pm-web`

## Troubleshooting

### Could not load authentication configuration

Check:

- backend is running
- Vite proxy target is correct
- `/api/auth/config` returns valid JSON
- `VITE_API_BASE_URL` is `/api` for local proxy behavior

### API calls fail in local dev

Check:

- `VITE_API_BASE_URL=/api`
- backend is reachable at `VITE_DEV_PROXY_TARGET`
- backend is running on the expected port
- backend CORS/origin settings match local frontend when needed

### Google sign-in origin mismatch

Check:

- current frontend origin is in OAuth client authorized JavaScript origins
- localhost testing uses either the backend-provided localhost-authorized client or `VITE_LOCAL_GOOGLE_CLIENT_ID`
- production host uses HTTPS

### Repeated session expiry or forced sign-out

Check:

- backend JWT settings and token validity
- local/server clock skew
- whether `/api/auth/me` returns `401`
- whether a stale `meco.session.token` exists in localStorage

### Missing data after switching season/project

Remember:

- workspace data is scoped by selected season/project
- `All projects` can hide project-specific tabs
- manufacturing appears only for robot project scope
- Robot Configuration and part-mapping support are robot-project specific
- frontend bootstrap normalization can backfill defaults, but it does not create missing backend records permanently unless a mutation does so

### View appears blank after navigation changes

Check:

- `src/lib/workspaceNavigation/types.ts` includes the new tab/subview key
- `constants.ts` includes the subitem and target
- section renderer activates the correct `WorkspaceSubPanel`
- active tab and subview state are initialized in `useAppWorkspaceState`
- all-project/non-robot gating is not redirecting the view

### Layout or CSS regression after refactor

Check:

- component still imports the correct scoped CSS entrypoint
- global CSS was not expanded for component-specific behavior
- organization audit passes for CSS/file/directory limits
- affected interaction tests still cover keyboard/responsive behavior where relevant

## Cross-Repo Responsibilities

Related repos:

- `meco-mission-control-platform`: API routes, validation, persistence, auth config truth
- `meco-mission-control-mobile`: mobile-focused client workflows

For auth, payload, schema, or API behavior changes:

1. Update backend contract and validation first.
2. Align frontend types and API client.
3. Re-test full flow end-to-end from web UI.
4. Confirm mobile behavior if the changed contract is shared.

For deployment changes:

1. Update this repo's workflow/nginx/static asset behavior.
2. Confirm platform deploy/runtime assumptions still match.
3. Confirm `/health` and `/api/*` proxy behavior.

## Requirements and Specs

Current living specs and requirements references in `docs/`:

- `docs/CURRENT_WEB_SPEC.md` — current repo-local web app spec aligned to recent PRs and current navigation.
- `docs/MECO_MVP_Spec_v11.docx`
- `docs/MECO_MVP_Spec_v10.docx`
- `docs/MECO_Requirements_v11.docx`
- `docs/MECO_Requirements_v10_clean.docx`
- `docs/MECO_Requirements.docx`

Use `docs/CURRENT_WEB_SPEC.md` as the first reference for current web-app behavior. Treat the Word documents as historical baseline/spec sources unless they are explicitly refreshed in a future docs PR.
