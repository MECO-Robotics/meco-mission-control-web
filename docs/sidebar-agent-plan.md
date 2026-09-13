# Stage 5 Implementation Plan: AppSidebarPopups Catalog Integration

## Objective
Modularize the `AppSidebarPopups` by consuming `scopePanels` definitions from the sidebar catalog (`src/components/layout/sidebar/sidebarItems.json`) instead of using hardcoded values.

## Target Files
- `src/components/layout/sidebar/sidebarItems.json`: Define `scopePanels` (project, season).
- `src/components/layout/AppSidebarPopups.tsx`: Consume `scopePanels` from catalog.
- `src/components/layout/AppSidebarScopeMenuPopup.tsx`: Accept panel config via props.
- `src/components/layout/useAppSidebarPopupState.ts`: Derive panel config from catalog.

## Expected Symbols
- `scopePanels`: Array of `{ id, label, icon }` in `sidebarItems.json`.
- `AppSidebarScopeMenuPopupProps`: Updated to include `panels`.

## Validation Commands
- `npm run typecheck`
- `npm run lint`
- `npm test` (relevant component tests)
