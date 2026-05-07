---
name: meco-web-workspace-ui
description: Use when implementing or debugging MECO mission-control web workspace UI, especially timeline, task queue, milestones, task detail, task status icons, filters, roster controls, workspace shell layout, scoped CSS, or browser-verified visual regressions on localhost.
---

# MECO Web Workspace UI

## Orientation

Start from the exact surface the user named. Search likely owners before editing:

```powershell
rg -n "TaskQueue|Timeline|Milestone|TaskDetails|WorkspaceViewShared|task status|discipline" src
```

Common hotspots are `src/features/workspace/views/`, `src/features/workspace/components/`, `src/features/workspace/shared/`, and the split CSS tree under `src/app/styles/workspace/` plus `src/app/styles/shell/`.

## Implementation Bias

Reuse existing workspace controls, density, iconography, status tone helpers, and scoped CSS patterns. This product is an operational tool; avoid marketing-style layouts, decorative cards, oversized type, and new visual systems unless the user asks for a redesign.

Keep fixes tied to the failing surface. For task detail or kanban cards, scope changes to that surface first. For timeline regressions, inspect both the renderer and CSS layer before guessing.

Preserve the current task status and discipline systems instead of adding parallel UI-only state. If a status or payload looks contract-related, inspect the platform route/schema before patching web-only behavior.

## Known Patterns

Timeline text reveal that must escape clipped bars should use the overlay-style `timeline-ellipsis-reveal[data-full-text]::after` approach rather than live span expansion.

Task Queue board work should preserve filters, pagination, and existing blocker/dependency-derived state. Discipline badges belong only where the current selected-project/context chip pattern expects them.

For fragile layout reports, run the app from the worktree env and inspect live DOM geometry on `http://127.0.0.1:5173`; static CSS edits alone have caused repeat misses in this repo family.

## Verification

For UI changes, run the narrow relevant test first when one exists, then `npm.cmd run typecheck` and `npm.cmd run build:bundle` for shared changes. Before visual audit, verify any hard-coded audit worktree path named in `AGENTS.md`; if that path is missing, use the active worktree's root `environment.toml` and note the fallback. Put screenshots or temporary captures under `/.diagnostics/`.
