### Stage 5 — Modularize scope data and actions

Goal: separate dynamic records from popup structure.

Catalog shape: `sidebarItems.json` exports a JSON array of navigation items. Do
not add properties to the array or import named exports from it. Add the
configuration as a dedicated item with `id: "scope-panels"` and a `panels`
array, then derive a typed `ScopePanelConfig[]` from that item at runtime.

Keep projects and seasons as runtime data, but describe static scope panels and actions declaratively:

```json
{
  "scopePanels": [
    { "id": "project", "label": "Projects", "icon": "layout-grid" },
    { "id": "season", "label": "Seasons", "icon": "calendar-days" }
  ]
}
```

The popup renderer should consume panel definitions plus dynamic options. Actions remain typed IDs such as `select-project`, `create-season`, and `edit-robot`.

Keep project-specific icon selection in runtime code because it depends on project name, type, and ID. It should not be forced into static JSON.

File-level tasks:

1. Add `scopePanels` array to `src/components/layout/sidebar/sidebarItems.json` with project and season panel definitions
2. Update `AppSidebarPopups.tsx` to read scope panel configuration from the catalog instead of hardcoded values
3. Update `AppSidebarScopeMenuPopup.tsx` to accept panel configuration from props instead of hardcoded values
4. Update `useAppSidebarPopupState.ts` to derive panel configuration from the catalog
5. Add tests for scope panel configuration loading and rendering

Acceptance criteria:

- The sidebar popup can be configured with different scope panels through JSON
- Project and season panels render with correct labels and icons from the catalog
- The popup still shows project and season options dynamically from runtime data
- Existing functionality for project/season selection remains unchanged
- The popup still shows robot project edit button when appropriate
- Tests verify that scope panel configuration is loaded from the catalog
- Tests verify that panel labels and icons come from the catalog

### Stage 6 — Modularize quick actions and footer actions

Goal: remove remaining hardcoded sidebar action metadata.

Add catalog groups for `quickActions` and `footerActions`. Each entry should identify a renderer or action type:

```json
{
  "id": "notifications",
  "label": "Notifications",
  "icon": "bell",
  "kind": "notification-queue",
  "badge": "notification-count"
}
```

Use specialized renderers for genuinely complex controls:

- `scope` → scope trigger;
- `settings` → settings menu;
- `notification-queue` → notification button;
- `add-menu` → add menu;
- `action` → generic action button.

Do not turn every control into a generic component if its behavior is materially different. Configuration should select a known renderer, not replace the renderer.

Validation:

- existing footer and quick-action tests;
- keyboard interaction tests;
- collapsed and expanded layout tests;
- notification badge tests.
