# Contributing to Mission Control Web

## Start here

Use Node22 (see `.nvmrc`), run `npm ci`, and follow the [README quick start](README.md#quick-start) for the local API and environment configuration. `npm run dev` starts Vite; Codex worktrees use `environment.toml`. Shared skills are optional ignored local imports, installed explicitly with `scripts/sync-skills.sh` or its PowerShell counterpart. They are not required to run the application. The existing skills workflow validates that import operation, not freshness of tracked application source.

## Change and review

Follow the [shared contribution workflow](https://github.com/MECO-Robotics/mission-control-skills/blob/main/CONTRIBUTING.md). Start normal feature/fix work from development in a dedicated worktree; open its PR into development, then promote development to main through a separate PR. Stabilization may target an existing staging branch; main accepts development, staging or an explicitly intended hotfix, subject to live branch rules. Never bypass required checks or approvals.

Prefer cohesive ownership, explicit dependencies and one authoritative representation. Remove redundant projections and forwarding layers instead of creating smaller fragments to satisfy file-size limits. This prototype is not deployed or serving real operational data; breaking replacements are permitted when all affected clients, tests and documentation change together. Describe any reset commands and discarded state.

PRs should explain the problem, resulting behavior and validation. Include screenshots for visible changes and contract/migration evidence when applicable. Issue/project bookkeeping and optional context adapters are not prerequisites for routine contributions.

## Validation

Use focused tests while developing. Before marking a code or CI change ready, run `npm run verify`: it owns contract validation, workflow security checks, TypeScript, lint, Jest and the production bundle build. Do not repeat these commands separately after that same revision passes. Documentation-only changes require link/command review and `git diff --check`.

For coordinated local contract work, run `PLATFORM_BOOTSTRAP_CONTRACT_SOURCE_PATH=/absolute/path/to/platform/contracts/platform/bootstrap/v1/contract.json npm run verify`. The explicit source must match the checked-in artifact; local sources are rejected in CI, which retains the pinned manifest checks.

For UI changes, exercise affected behavior in the local application. Changes to transport or bootstrap data must update platform and relevant mobile consumers. Keep tests focused on outcomes; do not preserve obsolete wiring with source-layout assertions.

CI validates PRs and protected-branch pushes; release jobs reuse the verified bundle. The trusted merge gate accepts exact reviewed CI digests. To change CI, first promote the new digest allowlist under the existing trusted workflow, then integrate the matching workflow bytes. Preserve required check names and review protections. Use GitHub's normal protected PR merge flow; automated comments do not satisfy an approving-review requirement.
