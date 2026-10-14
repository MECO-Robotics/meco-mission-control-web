---
title: Mission Control Web Release Readiness Checklist
description: Release safety checklist for staging or development promotion to main and production deploy
---

# Mission Control Web Release Readiness Checklist

Reference for **Issue #76**.

- Goal: make promotion from `development` to `staging`, from `staging` or `development` to `main`, and production deploys repeatable and safe.
- Scope: repository `meco-mission-control-web` only.
- CI and deployment workflows are in `.github/workflows/ci.yml` and
  `.github/workflows/deploy-vps.yml`. The retained
  `.github/workflows/merge-requirements.yml` workflow is disabled.

## 1) Required local quality gates before PR merge

1. Ensure local verify command passes before opening/refreshing the PR:

   - Windows: `npm.cmd run verify`
   - POSIX/macOS/Linux: `npm run verify`

2. This command is currently defined as:

   - `npm run verify-contracts`
   - `npm run test:security-workflows`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test:ci`
   - `npm run build:bundle`

3. Ensure any API contract changes are validated against backend contract truth in
   `meco-mission-control-platform` (schema/route + payload validation) before
   adjusting web typing/mapping.

## 2) CI and merge policy

CI continues to validate pull requests and main/development pushes. Its results are
available as validation evidence. During prototype development, branch protection,
merge approval, required-status, and workflow-digest gates are disabled. The retained
`merge-requirements.yml` workflow does not publish or enforce a protected
`merge-requirements` status. Dedicated worktrees and reviewable pull requests remain
the development convention; deployment approvals are separate. See
[prototype-merge-policy.md](prototype-merge-policy.md) for current settings and
reinstatement guidance.

### Branch routing convention

These source/target patterns document the current review convention; they are not an
enforced merge gate.

- PR target `development` must come from:
  - `feature/*`, `fix/*`, or `hotfix/*`
- PR target `staging` or `staging/*` must come from:
  - `development`, `fix/*`, or `hotfix/*`
  - Treat staging branches as immutable release-candidate snapshots; use `fix/*` or `hotfix/*` only for stabilization fixes.
- PR target `main` must come from:
  - `staging`, `staging/*`, `development`, or `hotfix/*`
- For a staging-sourced `main` PR, cut the staging branch from the current `development` head and leave new unrelated work on `development` until the candidate is intentionally refreshed.

### Snapshot validation check

- The CI workflow runs this job for pull requests; its result is validation evidence,
  not a protected merge requirement.
- The job runs a production-bundle build and creates `snapshot/manifest.json` and
  `snapshot/web-production-snapshot.tgz`.
- Snapshot artifacts include:
  - `dist/**`
  - `deploy/pm-web.nginx.conf`
  - `.env.production.example`
  - `package.json`
  - `package-lock.json`
  - `snapshot/manifest.json`

### Cross-repository coordination

- `npm run verify-contracts` compares the web bootstrap contract with the platform
  contract. Pull requests use the platform revision in
  `contracts/production-integration.json`; other runs use the selected branch channel.
  Promote compatible platform contract changes and update the manifest before the
  dependent web change.
- For a production release, update the manifest with the reviewed platform and mobile
  release branches and commit SHAs, then review their CI and snapshot results manually.
  The trusted merge gate is disabled, so web merges do not automatically check those
  external results.

## 3) Review-thread hygiene

Review unresolved threads and comments before merging, and resolve them when the
discussion is complete. This is a review practice, not a branch-protection rule.

## 4) Production env and proxy assumptions

Runtime assumptions inferred from `vite.config.ts`, README, and `deploy/pm-web.nginx.conf`:

- Frontend served as static bundle at `/opt/pm-web/site`.
- Vite dev server proxies API traffic with:
  - `VITE_API_BASE_URL=/api`
  - `VITE_DEV_PROXY_TARGET` default `http://localhost:8080`
- Production nginx contract:
  - HTTPS host expected: `meco-pm.duckdns.org`
  - `/api/*` and `/health` are proxied to `127.0.0.1:8080`
  - Root path serves `index.html` SPA fallback (`try_files ... /index.html`)
  - HTTP on port 80 redirects to HTTPS

## 5) Deployment and rollback path

Deployment source control in `deploy-vps.yml`:

- Allowed production deploy sources:
  - `main` branch push
  - `workflow_dispatch` with matching `release_manifest` SHA
- Deployment validation before sync:
  - `npm run typecheck`
  - `npm run build:bundle`
- Deployment SSH trust:
  - `VPS_SSH_KNOWN_HOSTS` contains the exact host-key entry confirmed through an out-of-band trusted channel.
  - A missing or mismatched host key fails before backup or file transfer.

Rollback path (implemented by workflow):

- Before every deployment, workflow creates backup in `/opt/pm-backups/web`:
  - `pm-web-<UTC timestamp>.tgz`
  - Keeps recent backups while pruning older entries.
- Snapshot/rollback guidance after a bad production deploy:
  1. SSH to VPS.
  2. Identify the most recent known-good backup under `/opt/pm-backups/web`.
  3. Extract it back to `/opt`.
  4. Verify `nginx` config and restart/reload nginx services if needed.
- Do not keep secrets in notes/artifacts; secrets stay in repo settings only.

## 6) Manual release-readiness checklist

Use this block to record review and release-readiness evidence. CI and snapshot
results, branch routing, and review threads are manual review practices; they are not
protected merge blockers.

| PR / Change | Stage | Readiness check | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| #1234 | development | Local `npm run verify` | [ ] Pending |  |  |
| #1234 | PR | Review CI validation results | [ ] Pending |  |  |
| #1234 | PR | Review generated snapshot artifact | [ ] Pending |  |  |
| #1234 | staging | Confirm candidate and stabilization scope | [ ] Pending |  |  |
| #1234 | main | Review platform/mobile CI and snapshot results for release SHAs | [ ] Pending |  |  |
| #1234 | PR | Review discussion and resolve threads when complete | [ ] Pending |  |  |
| #1234 | production | Deploy source validation (`main`/manifest) | [ ] Pending |  |  |
| #1234 | production | VPS backup present | [ ] Pending |  |  |
| #1234 | production | Smoke check (`/health`) after deploy | [ ] Pending |  |  |

## 7) Completion review

- Record local verification and relevant CI/snapshot outcomes for the release candidate.
- Review and resolve discussion threads as appropriate; this is not a branch-protection condition.
- Before production deployment, confirm `deploy-vps.yml` accepts the source and passes its validation steps.
- After deployment, confirm the VPS backup is retained and check `/health`; use the rollback path above if the release is unhealthy.
