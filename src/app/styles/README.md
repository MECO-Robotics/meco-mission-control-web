# Mission Control CSS Organization

## Layer Direction

This repo keeps behavior-preserving import order today and uses this target layering model for incremental cleanup:

1. `reset`
2. `tokens`
3. `shell`
4. `components`
5. `workspace`
6. `utilities`

Current top-level CSS entrypoints (`shell.css`, `workspace.css`, `views.css`, `responsive.css`) map to those layers conceptually:

- `shell.css` -> `shell`
- `workspace.css` -> `workspace`
- `views.css` -> `components` / feature-specific view styles
- `responsive.css` -> `utilities` and responsive overrides

When touching styles, prefer moving one scoped area at a time into its intended layer instead of sweeping rewrites.

## Class Naming Conventions

Use these prefixes for new class names and migrated selectors:

- `mc-shell-*` for top-level shell, sidebar, topbar, overlays
- `mc-workspace-*` for workspace frame/panel surfaces
- `mc-task-*` for task/timeline/task-queue/task-detail concerns
- `mc-roster-*` for roster/directory/attendance concerns
- `mc-manufacturing-*` for CNC/print/fabrication concerns

Do not rename existing selectors purely for convention compliance. Apply prefixes when introducing new selectors or when already editing a local style area for functional work.
