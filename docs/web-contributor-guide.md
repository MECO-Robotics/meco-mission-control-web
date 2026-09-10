# Web Contributor Guide

This guide orients contributors to the current Mission Control web app structure,
routing model, edit flows, API conventions, and styling boundaries. Use
`README.md` for setup commands and `docs/CURRENT_WEB_SPEC.md` for the current
product contract.

## Workspace Architecture

The web app is a React and Vite workspace client. `src/main.tsx` mounts the app,
while `src/app/App.tsx` and `src/app/` own top-level bootstrapping, auth state,
workspace hydration, routing state, modal state, and shell composition.

The main workspace controller code is split by responsibility:

- `src/app/hooks/` builds shared workspace state, derived models, auth lifecycle,
  and mutation actions.
- `src/app/shell/` renders the application frame, topbar, sidebar, status
  panels, and workspace chrome.
- `src/features/workspace/` contains user-facing workspace sections and views.
- `src/lib/` contains shared model helpers, API/auth utilities, navigation
  helpers, layout utilities, and domain-specific calculations.
- `src/types/` contains frontend contracts for platform payloads and workspace
  records.

Keep view-specific business logic near the view that uses it. Promote helpers
into `src/lib/` only when they are reused across sections or represent a shared
contract.

## View And Tab Routing

User-facing navigation is defined around workspace sections instead of raw data
entities. The canonical navigation keys, labels, ordering, and availability
rules live under `src/lib/workspaceNavigation/`.

When adding or changing a destination:

1. Update the navigation types and constants in `src/lib/workspaceNavigation/`.
2. Update route matching and availability helpers when project, season, or robot
   scope changes.
3. Wire the destination through the relevant section renderer in
   `src/features/workspace/components/sections/`.
4. Keep the view implementation under `src/features/workspace/views/`.
5. Add focused tests for enabled, disabled, redirected, and empty states when the
   route depends on selected season or project scope.

Prefer user-facing labels from `docs/CURRENT_WEB_SPEC.md` in copy and docs.
Route keys and tab IDs are implementation details unless a code reference is
needed.

## Modal And Edit Flows

Modal state is coordinated from the app shell so views can request an edit
intent without owning global overlay state. Existing flows use typed draft state,
selected IDs, and action callbacks passed down from app hooks into section and
view components.

For new edit flows:

- Keep draft creation and reset behavior explicit.
- Validate required fields before calling a mutation.
- Preserve cancel behavior and avoid mutating workspace arrays directly from a
  form component.
- Route creates, updates, and deletes through the existing app workspace action
  hooks when possible.
- Refresh or reconcile from the platform response after successful backend
  writes.
- Show unauthorized, validation, network, and rollback states in the initiating
  view or modal.

Pseudo-state workflows, such as blocked or waiting-on-dependency task drops,
should open an edit intent with the relevant draft context instead of silently
changing fields that require user explanation.

## API Client Conventions

The frontend talks to the platform through `/api` by default. Local development
uses the Vite proxy target from `VITE_DEV_PROXY_TARGET`, while production nginx
serves static assets and proxies `/api/*` and `/health` to the platform service.

API and auth helpers live under `src/lib/auth/` and related bootstrap modules.
When adding a backend-backed feature:

- Implement or confirm the platform route and response shape first.
- Update frontend types in `src/types/`.
- Normalize only for backward compatibility with older payloads.
- Keep cookie credentials, in-memory CSRF handling, auth expiry handling, and
  no-store assumptions in shared request helpers. Never persist or replay a web
  bearer credential from browser-readable storage.
- Treat `401` as a session/auth state transition, not as a generic empty-data
  response.
- Add tests for empty payloads, scoped season/project payloads, unauthorized
  responses, and API failure states when the flow depends on them.

Do not duplicate platform validation rules in UI code except where immediate
client-side feedback improves the workflow. The platform remains the source of
truth for permissions, persistence, and schema validation.

## Ownership and styles

Follow [CONTRIBUTING.md](../CONTRIBUTING.md). Keep one clear owner and explicit dependencies; delete redundant representations and forwarding layers. Split or merge modules according to responsibility and reuse, without file-size quotas. Keep styles with the view or component whose cascade they control.

For UI work, match existing dense Mission Control patterns. Use restrained
controls, stable dimensions, and predictable responsive behavior. Avoid adding
marketing-style sections or decorative surfaces to operational screens.

When changing styles:

- Check small and wide viewports.
- Confirm text does not overlap, clip, or resize controls unexpectedly.
- Preserve keyboard focus and hover states.
- Keep card usage for repeated items, dialogs, and framed tools.
- Prefer existing tokens, class patterns, and shared components before creating
  new styling conventions.

## Validation

For code changes, run targeted tests first and then `npm run verify` before
handoff. For documentation-only changes, review the linked files and confirm all
changed paths are limited to docs or README files, including staged and
untracked files:

```bash
git status --short
git diff --name-only
git diff --cached --name-only
git diff --check
```

Use browser QA for visible UI changes, especially navigation, modal, drag/drop,
and responsive layout work.
