---
title: Mission Control Web Release Readiness Checklist
description: Release safety checklist for staging or development promotion to main and production deploy
---

# Mission Control Web Release Readiness Checklist

Reference for **Issue #76**.

- Goal: make promotion from `development` to `staging`, from `staging` or `development` to `main`, and production deploys repeatable and safe.
- Scope: repository `meco-mission-control-web` only.
- Related checks are defined in `.github/workflows/ci.yml`, `.github/workflows/merge-requirements.yml`, and `.github/workflows/deploy-vps.yml`.

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

## 2) CI and merge-gate checks (repo-side)

Before a PR is mergeable, the secretless `ci.yml` workflow runs PR code and the
default-branch `merge-requirements.yml` workflow publishes the protected
`merge-requirements` status after enforcing:

- `branch-model`
- `ci-validate` (`npm audit --audit-level=low` and `npm run verify`)
- `snapshot-validate`

The trusted workflow never checks out or executes the PR revision. It accepts only
`pull_request` runs from `.github/workflows/ci.yml`, requires the PR copy of that
workflow to match the trusted SHA-256 embedded in the gate script, and verifies that
the exact PR head passed all three required web checks. It also compares the web
bootstrap contract with the platform repository. For PRs into `main`, it requires
successful `ci-validate` and `snapshot-validate` checks on the exact platform and
mobile commits pinned in `contracts/production-integration.json`.

Because `workflow_run` executes the workflow and gate script from the default branch,
changes to this trust boundary must land on `main` before a development PR relies on
them. The bootstrap subset is `.github/workflows/merge-requirements.yml` and
`scripts/merge-requirements-gate.mjs`.

### Branch model check

- PR target `development` must come from:
  - `feature/*`, `fix/*`, or `hotfix/*`
- PR target `staging` or `staging/*` must come from:
  - `development`, `fix/*`, or `hotfix/*`
  - Treat staging branches as immutable release-candidate snapshots; use `fix/*` or `hotfix/*` only for stabilization fixes.
- PR target `main` must come from:
  - `staging`, `staging/*`, `development`, or `hotfix/*`
- For a staging-sourced `main` PR, cut the staging branch from the current `development` head and leave new unrelated work on `development` until the candidate is intentionally refreshed.

### Snapshot validation check

- Required for all PRs that run CI jobs.
- This job runs production-bundle build + creates `snapshot/manifest.json` and
  `snapshot/web-production-snapshot.tgz`.
- Snapshot artifacts include:
  - `dist/**`
  - `deploy/pm-web.nginx.conf`
  - `.env.production.example`
  - `package.json`
  - `package-lock.json`
  - `snapshot/manifest.json`

### Cross-repository coordination

- The trusted merge gate queries public platform and mobile repository state without
  requiring cross-repository package credentials.
- The vendored web bootstrap contract must match the platform contract at the immutable
  revision in `contracts/production-integration.json`. For development and staging PRs,
  the manifest's platform branch must exactly match the PR target. Promote compatible
  platform contract changes and update the manifest before the dependent web change.
- PRs into `main` require successful platform and mobile `ci-validate` and
  `snapshot-validate` checks before the web `merge-requirements` status passes. Update
  `contracts/production-integration.json` to the full, reviewed platform and mobile
  release branches and commit SHAs being released. The gate authenticates its GitHub
  API reads, proves each immutable revision belongs to its declared release branch,
  and validates required jobs from that revision's successful canonical CI workflow,
  so later external branch movement cannot stale an approval.
- Pull-request `npm run verify-contracts` uses the same pinned platform revision as
  the trusted gate and confirms that revision belongs to its declared release branch.
  Local and post-merge push verification use the selected branch channel.

## 3) Unresolved review-thread check

Before merging a PR, verify there are no unresolved review threads / open unresolved comments in the PR conversation.

- Resolve all threads in the GitHub PR discussion before merge.
- Confirm mergeability state in PR view after final review activity.
- This repo's branch-protection expectations assume conversation resolution is part of the merge policy.

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

## 6) Release blocker list template

Use this block in issue/PR comments before merging to `main`.

| PR / Change | Target | Check type | Status | Owner | Blocker details | ETA |
| --- | --- | --- | --- | --- | --- | --- |
| #1234 | development | `npm run verify` | [ ] Pending |  |  |  |
| #1234 | staging | `ci-validate` | [ ] Pending |  |  |  |
| #1234 | staging | `snapshot-validate` | [ ] Pending |  |  |  |
| #1234 | staging | stabilization fixes only | [ ] Pending |  |  |  |
| #1234 | main | `ci-validate` | [ ] Pending |  |  |  |
| #1234 | main | `snapshot-validate` | [ ] Pending |  |  |  |
| #1234 | main | Unresolved review threads | [ ] Pending |  |  |  |
| #1234 | production | Deploy source validation (main/tag/manifest) | [ ] Pending |  |  |  |
| #1234 | production | VPS backup present | [ ] Pending |  |  |  |
| #1234 | production | Smoke check (`/health`) after deploy | [ ] Pending |  |  |  |

## 7) Completion criteria (promotion complete)

- All items in sections 1-5 are marked complete for the target branch.
- No unresolved review thread or conversation item.
- Snapshot produced and validated in CI.
- Post-merge production deploy source allowed by `deploy-vps.yml`.
- VPS backup retained and rollback check validated from backup inventory.
