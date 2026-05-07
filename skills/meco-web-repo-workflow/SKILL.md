---
name: meco-web-repo-workflow
description: Use when working inside the MECO mission-control web repository or a Codex worktree for repo setup, local startup, file organization, structural compliance, diagnostics, or cross-repo contract checks. Trigger this for tasks that mention AGENTS.md, environment.toml, Codex worktrees, local dev startup, repo rules, file-size limits, diagnostics, or MECO web/platform contract behavior.
---

# MECO Web Repo Workflow

## First Pass

Run the repository preflight once per task:

```powershell
where.exe node
node -v
where.exe npm
where.exe rg
rg --version
git rev-parse --show-toplevel
```

Assume PowerShell 5.1 semantics. Use `npm.cmd` for direct commands. If `rg` fails or resolves to the Codex WindowsApps binary first, refresh `PATH` once and then fall back to `Get-ChildItem` plus `Select-String` if needed.

## Codex Environment

Treat root `environment.toml` as authoritative for Codex worktrees:

```toml
[worktree]
bootstrap_command = "powershell.exe -ExecutionPolicy Bypass -File ./scripts/codex-worktree-bootstrap.ps1"
dev_url = "http://127.0.0.1:5173"
requirements = ["npm.cmd install", "npm.cmd run dev -- --host 127.0.0.1 --port 5173"]
```

Use `scripts/codex-worktree-bootstrap.ps1` as the manual fallback. If `.codex/environments/environment.toml` exists, treat it as generated UI state and do not hand-edit it unless the user explicitly asks.

## Repo Rules

Implement directly when the scope is clear. Keep changes small, cohesive, and local to the requested behavior.

Respect the strict structure limits from `AGENTS.md`: React/TypeScript files hard max 300 implementation lines, directories hard max 20 direct files, CSS hard max 220 rule/declaration lines and 30 selectors, imports hard max 150 lines. Split by feature responsibility when a touched area crosses a trigger.

Keep diagnostics and screenshots under `/.diagnostics/`; do not add root-level PNG, JPG, WEBP, or snapshot artifacts.

For auth, payload, schema, or API work, inspect the paired platform repo before changing the web contract. Treat backend route/schema validation as the source of truth, then align web types and UI.

In dirty worktrees, inspect `git status --short --branch` before editing and stage only the in-scope files when committing.

## Validation

Run checks that match the touched surface before claiming completion. Prefer focused tests for narrow UI/model changes, then `npm.cmd run typecheck` and `npm.cmd run build:bundle` for shared or production-relevant changes. Use `npm.cmd run verify` only when the broader cost is justified.
