---
name: meco-web-publish-deploy
description: Use when publishing MECO mission-control web changes by commit, push, pull request, CI repair, production deploy, VPS verification, release tag, or release-manifest flow. Trigger this for requests mentioning commit, push, PR, branch, deploy, VPS, GitHub Actions, ci-validate, snapshot-validate, production gate, or live health checks.
---

# MECO Web Publish Deploy

## Branch Rules

Follow the repo branch model from `AGENTS.md`: feature and fix work targets `development` by PR from `feature/*`, `fix/*`, or `hotfix/*`; `main` receives PRs only from `development` or `hotfix/*`.

Before publishing, inspect:

```powershell
git status --short --branch
git remote -v
git log --oneline --decorate -3
```

If a Codex worktree is detached, create an explicit branch before commit/push. In dirty trees, stage only the intended files.

## Local Validation

Match validation to risk. The workflow gates currently run `npm run typecheck && npm run build:bundle`; local commands should use `npm.cmd`.

Use focused Jest tests when touching tested behavior. Use `npm.cmd run test:ci`, `npm.cmd run lint`, or `npm.cmd run verify` when publishing broad, shared, or production-critical changes.

## GitHub Checks

The CI workflow exposes required checks named `ci-validate` and `snapshot-validate`. PRs into `main` also require `cross-repo-production-gate`, which checks development health across web, platform, and mobile.

When debugging CI, fetch the real failed job logs before editing. Do not infer the cause from the check name alone.

## Production Deploy

Production web deploys only from `main`, `release-*` tags, or an explicit release manifest. `.github/workflows/deploy-vps.yml` validates with `npm run typecheck && npm run build:bundle`, uploads `dist`, backs up `/opt/pm-web`, syncs to `/opt/pm-web/site`, and checks `https://meco-pm.duckdns.org/health`.

If the user asks to deploy or verify VPS propagation, match the pushed SHA to the `Deploy Web App to VPS` run, wait for completion, then probe the live health endpoint. A successful push alone is not proof of deployment.
