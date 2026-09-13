# Sidebar Modularization Improvement Plan

## Objective

Make the sidebar catalog-driven and modular. A sidebar item should be describable in JSON, while React components provide generic rendering and typed runtime behavior.

The JSON catalog should own item identity, placement, labels, icons, targets, requirements, accessibility metadata, and disabled behavior. React should own state, side effects, navigation dispatch, popup mechanics, and runtime data such as projects and seasons.

## Current state

The sidebar entry point is `src/components/layout/AppSidebar.tsx`. It currently coordinates:

- selected project and season derivation;
- navigation model creation;
- scope popup state and positioning;
- project and season selection handlers;
- help and collapse behavior;
- disabled robot-view notifications;
- quick actions, navigation sections, footer actions, and popup composition.

The current supporting boundaries are:

- `AppSidebarSections.tsx`: section mapping, item rendering, hover rollouts, active state, disabled state, and icon lookup;
- `useAppSidebarNavigationModels.ts`: navigation model derivation;
- `workspaceNavigation/constants.ts`: navigation catalog and section grouping;
- `workspaceNavigation/availability.ts`: catalog-backed availability resolution;
- `useAppSidebarPopupState.ts`: project popup open state, outside-click handling, Escape handling, and vertical clamping;
- `AppSidebarScopeMenuPopup.tsx`: project/season popup rendering;
- `AppSidebarQuickActions.tsx` and `AppSidebarProjectFooter.tsx`: additional hardcoded action groups;
- `sidebarItems.json`: the initial JSON catalog;
- `sidebarProjectIcons.tsx`: runtime project-specific icon selection and colors.

### Review baseline

A three-agent read-only review of the development worktree confirmed that the current risk is configuration drift and state coordination, not insufficient component count. The agents independently prioritized:

1. Make JSON availability requirements authoritative. **Complete.**
2. Extract a generic `SidebarItem` renderer. **Complete.**
3. Consolidate popup state and scope transitions. **Complete.**
4. Separate pure navigation resolution from React hooks.
5. Modularize quick actions and footer actions only after the navigation path is stable.

The review also confirmed two migration residues that should be removed early:

- `sidebarItems.json` declares `requires`, but `availability.ts` still determines availability through a separate matrix.
- `AppSidebarSections.tsx` still identifies the robot destination by item ID, so the JSON does not yet fully describe disabled behavior.

The existing sidebar tests are useful behavior evidence. They should be redistributed by responsibility rather than replaced with broad snapshots.

## Target architecture

```text
sidebarItems.json
  -> typed catalog loader
  -> navigation/availability resolver
  -> Sidebar component
       -> SidebarSection
            -> SidebarItem
       -> SidebarQuickActions
       -> SidebarFooter
       -> SidebarPopupHost
```

The catalog is the single source of truth for static sidebar item metadata. The application supplies a runtime context and an action registry.

```ts
type SidebarRuntimeContext = {
  navigationState: NavigationState;
  availabilityContext: ViewAvailabilityContext;
  isCollapsed: boolean;
  notificationCount: number;
};

type SidebarActionRegistry = {
  navigate: (target: NavigationTarget) => void;
  notify: (notice: WorkspaceEditToastNotice) => void;
  run: (actionId: string) => void;
};
```

## Catalog contract

The lean item shape is:

```json
{
  "id": "work-tasks",
  "label": "Tasks",
  "section": "work",
  "icon": "ListTodo",
  "target": {
    "tab": "tasks",
    "taskView": "queue"
  },
  "requires": ["project"]
}
```

Defaults should be intentional:

- missing `requires` means available unless another resolver rule applies;
- array order determines item order;
- `activeWhen` is derived from `target`;
- collapsed behavior and tooltip behavior are global renderer behavior;
- tutorial selectors are derived from item identity unless explicitly overridden;
- missing optional visual metadata uses the component default.

If a disabled item needs special behavior, use declarative metadata rather than an ID check:

```json
{
  "id": "resources-structure",
  "disabledBehavior": "notify",
  "disabledNotice": {
    "title": "Select Robot Project",
    "message": "Select a robot project first to open this view.",
    "tone": "error"
  }
}
```

Do not put JSX, callbacks, arbitrary JavaScript, or executable predicates in JSON. Store native Lucide icon export names in PascalCase and resolve them directly through the typed icon registry. Use symbolic action IDs resolved through typed registries.

## Staged implementation

### Stage 1 — Establish and validate the catalog **(Complete)**

Goal: make JSON authoritative for navigation item metadata without changing visible behavior.

Work:

1. Define `SidebarItemConfig` and `SidebarCatalog` types.
2. Validate the JSON at module load or in a focused test:
   - IDs are unique;
   - every ID is a valid `NavigationSubItemId`;
   - sections are valid;
   - targets have valid tab/view combinations;
   - icon names are registered;
   - requirements are known.
3. Replace inline `NAVIGATION_SUB_ITEMS` definitions with the catalog.
4. Keep navigation helper APIs stable while they consume catalog data.
5. Remove the obsolete `subItemIcons` map from `sidebarProjectIcons.tsx`.

Validation:

- catalog shape test;
- existing workspace navigation tests;
- sidebar section rendering tests;
- typecheck and build.

Exit condition: changing a label, icon, section, target, or item order requires only a JSON change.

Implementation note: do not add a runtime schema framework for this catalog. A typed loader plus focused invariant tests is sufficient for the current application.

### Stage 2 — Extract the generic item renderer **(Complete)**

Goal: reduce `AppSidebarSections.tsx` to section composition.

Create `src/components/layout/sidebar/SidebarItem.tsx` with responsibility for:

- icon rendering;
- active and enabled attributes;
- collapsed labels and rollout text;
- tutorial target generation;
- click dispatch;
- disabled behavior;
- keyboard and pointer hover behavior.

Suggested interface:

```tsx
type SidebarItemProps = {
  config: SidebarItemConfig;
  isActive: boolean;
  isEnabled: boolean;
  isCollapsed: boolean;
  onSelect: (config: SidebarItemConfig) => void;
  onDisabledSelect: (config: SidebarItemConfig) => void;
};
```

`SidebarSections` should map sections and pass resolved models to `SidebarItem`. It should not know that one item represents a robot destination.

Validation:

- preserve existing active, collapsed, hover, focus, and disabled assertions;
- add a focused renderer test for configured icon, target, tooltip, and disabled behavior.

The renderer should receive resolved booleans and callbacks. It should not import workspace availability rules or inspect application-specific IDs.

### Stage 3 — Move availability requirements into JSON **(Complete)**

Goal: eliminate the second availability source of truth.

Currently, `availability.ts` contains `NAVIGATION_SUB_ITEM_AVAILABILITY_MATRIX`, while JSON contains an initial `requires` field. These must not diverge.

Implement a requirement registry:

```ts
const requirements = {
  project: (context) => context !== "no-project" && context !== "no-season",
  season: (context) => context !== "no-season",
  "robot-project": (context) => context === "robot-project",
} as const;
```

Then resolve:

```ts
function isAvailable(item, context) {
  return (item.requires ?? []).every((requirement) =>
    requirements[requirement](context),
  );
}
```

Before removing the matrix, compare every catalog item across every availability context and update tests for intended behavior. Some current behavior is more specific than a single requirement—for example, materials and documents vary by project type. Represent those cases with named requirements such as `materials-project` or `non-robot-project`, not compound ID checks.

Validation:

- exhaustive item/context availability test;
- no remaining references to the matrix;
- disabled notification behavior remains unchanged;
- navigation target resolution remains unchanged.

Migration rule: first generate or compare a truth table for every existing item and every `ViewAvailabilityContext`. Only then remove the matrix. This prevents a lower test count or simpler JSON from being mistaken for preserved behavior.

### Stage 4 — Consolidate sidebar popup state **(Complete)**

Goal: replace parallel popup flags with one explicit state model.

Current state is split between `isProjectPopupOpen`, `activeScopePanel`, and the optional `isScopePopupOpen` pass-through.

Use a discriminated union:

```ts
type SidebarPopupState =
  | { type: "closed" }
  | { type: "scope"; panel: "project" | "season"; top: number }
  | { type: "settings" }
  | { type: "notifications" };
```

Create `useSidebarPopupController` to own:

- open and close transitions;
- outside pointer dismissal;
- Escape dismissal;
- popup positioning and clamping;
- trigger and popup refs.

The popup host should render based on the discriminant and should not receive compatibility aliases for the same state.

Validation:

- scope popup tests for project and season panels;
- outside-click and Escape tests;
- popup clamping tests;
- ensure opening one popup closes another.

Do not make the popup controller responsible for project or season mutations. It should report selections; the workspace controller remains responsible for persistence and data refresh.

### Stage 5 — Modularize scope data and actions

Goal: separate dynamic records from popup structure.

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

Validation:

- project and season option tests;
- robot project edit visibility test;
- dynamic empty-state tests.

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

### Stage 7 — Simplify the top-level sidebar and remove migration residue

Goal: make `AppSidebar.tsx` composition-only.

After the previous stages, move remaining coordination into focused hooks:

- `useSidebarNavigationController`;
- `useSidebarScopeController`;
- `useSidebarPopupController`;
- `useSidebarActionRegistry`.

`AppSidebar` should primarily derive runtime context, compose the sidebar regions, and pass the controller outputs down. Remove obsolete aliases, duplicate target definitions, dead icon maps, and pass-through props.

Validation:

- full sidebar test suite;
- full typecheck, lint, and production build;
- local application startup;
- manual desktop collapsed/expanded and narrow-screen overlay verification.

## Testing strategy

Keep each test layer focused:

- catalog tests validate configuration shape;
- resolver tests validate active state and availability;
- component tests validate rendering and interaction;
- controller tests validate state transitions and dismissal;
- a small number of integration tests validate the assembled sidebar.

Do not add snapshot coverage for the entire sidebar. It would encode implementation details and make catalog changes noisy.

### Test ownership after extraction

| Concern | Owning test layer |
| --- | --- |
| JSON IDs, sections, icons, targets, and known requirements | Catalog contract test |
| Active item and target matching | Pure navigation resolver tests |
| Requirement evaluation across contexts | Availability resolver tests |
| Button semantics, collapsed rendering, hover rollout, and disabled behavior | `SidebarItem` component tests |
| Popup transitions, outside click, Escape, and clamping | Popup controller tests |
| Project/season option rendering and selection callbacks | Scope popup tests |
| Assembled sidebar wiring | Small existing integration tests |

The current source-inspection tests should be reduced where they merely assert implementation structure. Retain them only when they protect an intentional module boundary or behavior that is difficult to exercise through the component.

## Review findings and decisions

### Finding: `requires` is currently descriptive, not functional

Decision: Stage 3 is required before claiming the sidebar is fully JSON-configurable. Until then, the catalog is only authoritative for static navigation metadata.

### Finding: popup state has parallel representations

Decision: remove the optional `isScopePopupOpen` compatibility prop during Stage 4. One popup state representation should flow from the controller to the host.

### Finding: project icons are dynamic

Decision: keep project icon selection in runtime TypeScript. It depends on project name, type, and ID, and should not be encoded as static sidebar item JSON.

### Finding: specialized controls are not ordinary items

Decision: quick actions, settings, notifications, and scope controls may use catalog entries that select known renderers. Do not create an arbitrary JSON UI engine.

### Finding: active-state logic includes route-specific exceptions

Decision: preserve the existing special mappings for robot map, CAD, and inventory views while moving the base item definitions into JSON. Simplify only after resolver tests prove equivalent behavior.

## Non-goals

- Do not make JSON executable.
- Do not move dynamic project/season records into static configuration.
- Do not replace the existing navigation model or route semantics solely for modularity.
- Do not preserve duplicate legacy catalogs after migration.
- Do not create a general-purpose UI schema engine.
- Do not change visual styling unless required to preserve current behavior.

## Completion checklist

- [x] JSON catalog has typed validation.
- [x] No inline sidebar item catalog remains.
- [x] `SidebarItem` owns generic item rendering.
- [x] Availability is defined once and requirements are optional.
- [ ] Robot-specific disabled behavior is configured, not ID-detected.
- [x] Popup state has one consolidated state owner.
- [ ] Scope panels use configuration plus runtime records.
- [ ] Quick and footer actions have modular definitions.
- [ ] Obsolete icon and pass-through modules are removed.
- [ ] Tests cover catalog, resolver, component, and controller behavior.
- [ ] Local application works after a clean bootstrap and ordinary restart.
- [ ] Any intentional breaking changes and reset commands are documented.
