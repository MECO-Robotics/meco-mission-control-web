# Color Theme

This document defines the shared visual rules used by the app. Runtime semantic colors live in `src/app/theme/index.ts`; shell sizing and control dimensions live in `src/app/styles/shell/layout/frame.css`. Keep this document aligned with those sources when either changes.

## Brand

The app is built around the MECO brand palette:

| Role | Hex |
| --- | --- |
| Primary blue | `#16478e` |
| Primary red | `#ea1c2d` |
| Brand grey | `#bbbbbb` |
| Black | `#000000` |
| White | `#ffffff` |

Brand blue is the default action, focus, selection, navigation, count, and identity color. Brand red is reserved for destructive emphasis, urgent accents, deadline/event emphasis, and brand artwork. Grey supports logo artwork, inactive chrome, and subtle neutral UI.

The browser theme color also uses `#16478e`.

## Global Surface

The global type stack uses system sans-serif for both display and interface text, with platform fallbacks.

The app background is a restrained white-to-cool-slate page base in light mode and deep slate gradient in dark mode. The auth introduction panel may use the documented brand atmosphere; auth cards use solid semantic panel surfaces and the full-page auth shell stays on the restrained page base. Sidebar collapse changes the shell and sidebar dimensions immediately so content does not animate layout properties.

Workspace text inherits `--text-title` from the shell; normal copy and metadata
use `--text-copy` and `--text-muted`. Links use the semantic `--text-link` and
`--text-link-hover` pair so they remain readable on both theme surfaces. The
document root uses `#475569` only as a pre-shell fallback.

## Canonical Semantic Tokens

`src/app/theme/index.ts` is the runtime source of truth for these CSS custom
properties. Use these names for shared surfaces, text, borders, focus, brand,
and status UI instead of inventing aliases or relying on light-only fallbacks.
When a shared semantic role is missing, define it here and in the runtime theme
before using it. A CSS fallback must not silently establish a competing theme.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--official-blue`, `--meco-blue` | `#16478e` | `#16478e` | Brand actions and identity accents |
| `--official-red`, `--meco-red` | `#ea1c2d` | `#ea1c2d` | Brand and destructive accents |
| `--official-grey` | `#bbbbbb` | `#bbbbbb` | Brand artwork |
| `--official-black` | `#000000` | `#ffffff` | Inverse brand foreground |
| `--official-white` | `#ffffff` | `#ffffff` | White brand artwork |
| `--meco-soft-blue` | `rgba(22, 71, 142, 0.08)` | `rgba(22, 71, 142, 0.2)` | Active navigation and brand selection washes |
| `--meco-soft-red` | `rgba(234, 28, 45, 0.08)` | `rgba(234, 28, 45, 0.2)` | Brand emphasis washes |
| `--search-highlight-bg` / `--search-highlight-text` | `#fde68a` / `#713f12` | `#92400e` / `#fef3c7` | Literal workspace search matches and milestone suggestion marks |
| `--row-tint` | `rgba(22, 71, 142, 0.14)` | `rgba(59, 130, 246, 0.18)` | Selected or highlighted rows |
| `--bg-panel` | `#ffffff` | `#1e293b` | Cards, panels, and controls |
| `--bg-row-alt` | `#f8fafc` | `#0f172a` | Secondary shell surfaces and neutral controls |
| `--bg-row-stripe` | `#e2e8f0` | `#0b1220` | Neutral alternating record rows and board lanes |
| `--border-base` | `#e5e7eb` | `#334155` | Standard separators and outlines |
| `--border-grid` | `#64748b` | `#94a3b8` | Kanban structural separators and Gantt date-grid lines across panel and zebra surfaces |
| `--border-strong` | `#cbd5e1` | `#475569` | Emphasized separators |
| `--text-title` | `#000000` | `#f8fafc` | Headings and primary labels |
| `--text-copy` | `#475569` | `#e2e8f0` | Body copy and inactive navigation |
| `--text-muted` | `#475569` | `#94a3b8` | Secondary metadata |
| `--text-accent` | `#16478e` | `#93c5fd` | Small non-interactive brand labels on workspace surfaces |
| `--text-link` / `--text-link-hover` | `#1d4ed8` / `#1e40af` | `#93c5fd` / `#bfdbfe` | Interactive links on workspace surfaces |
| `--shadow-soft` | `0 2px 8px rgba(15, 28, 52, 0.08)` | `0 2px 8px rgba(0, 0, 0, 0.24)` | Soft loading and panel depth |
| `--shadow-overlay` | `0 4px 12px rgba(15, 23, 42, 0.14)` | `0 4px 12px rgba(2, 6, 23, 0.3)` | Popovers and menus that need separation from nearby content |
| `--official-green` | `#166534` | `#34d399` | Success and completion accents |
| `--status-success-bg` / `--status-success-text` | `#dcfce7` / `#166534` | `#064e3b` / `#34d399` | Success states |
| `--status-info-bg` / `--status-info-text` | `#e0f2fe` / `#075985` | `#082f49` / `#38bdf8` | Informational states and visible focus indicators |
| `--status-warning-bg` / `--status-warning-text` | `#fef3c7` / `#92400e` | `#451a03` / `#fbbf24` | Warning states |
| `--status-danger-bg` / `--status-danger-text` | `#fee2e2` / `#991b1b` | `#450a0a` / `#f87171` | Danger states |
| `--status-neutral-bg` / `--status-neutral-text` | `#f1f5f9` / `#475569` | `#1e293b` / `#94a3b8` | Neutral states |
| `--cad-viewer-background` / `--cad-viewer-text` | `#17202c` / `#edf3fa` | `#17202c` / `#edf3fa` | CAD model canvas with fixed dark contrast |
| `--calendar-event-milestone` | `#16478e` | `#16478e` | Calendar milestone event with white text |
| `--calendar-event-task-due` | `#4f46e5` | `#4f46e5` | Calendar task deadline with white text |
| `--calendar-event-qa-due` | `#92400e` | `#92400e` | Calendar QA deadline with white text |
| `--calendar-event-manufacturing-due` | `#166534` | `#166534` | Calendar manufacturing deadline with white text |
| `--calendar-event-other` | `#475569` | `#475569` | Other calendar event with white text |
| `--calendar-event-meeting` | `#16478e` | `#16478e` | Calendar meeting with white text |
| `--team-task-open-chart` / `--team-task-open-text` | `#eab308` / `#a16207` | `#facc15` / `#facc15` | Team open-task metrics |
| `--team-task-blocked-chart` / `--team-task-blocked-text` | `#ea1c2d` / `#b91c1c` | `#ea1c2d` / `#f87171` | Team blocked-task metrics |
| `--team-task-overdue-chart` / `--team-task-overdue-text` | `#f97316` / `#c2410c` | `#fb923c` / `#fb923c` | Team overdue-task metrics |

Shared zebra treatment uses `--bg-panel` for the first record and
`--bg-row-stripe` for the second, counting only matching record siblings.
Tables, board lanes, Timeline project/subsystem bands, roster members,
subsystem/workflow rows, Teams and Home's Your tasks quicklist use this neutral
pair. Headers, inline forms and detail siblings do not advance the stripe. Selected and attention states retain their
own semantic styling; `--row-tint` is not a zebra color. Other record lists and
modal content do not receive new striping from this rule.

Use `--status-danger-text` for shared error copy, `--text-title` for pagination
controls, and `--bg-row-alt` for neutral pagination buttons. These roles replace
legacy aliases such as `--danger-text`, `--text-strong`, and `--bg-base`.

### Surface elevation

Use `--shadow-soft` for ordinary panels, cards, auth surfaces, and shared chrome
in both themes. Pair it with a 1px semantic border when a visible edge is needed.
Use `--shadow-overlay` for menus and popovers. Avoid broad, diffuse shadows on
operational surfaces.

Use `--text-copy` rather than generic gray for readable inactive controls.
Use `--meco-soft-blue` with `--text-title` for selected nested navigation;
`--status-info-text` supplies its visible keyboard focus ring. Keep border widths
at 1px or less on colored card and callout edges. Status background and text
tokens are pairs and should be applied together. Sidebar width and shell offset
changes are immediate; animate visual properties such as transform and opacity
when motion improves feedback.

Reset browser-default button surfaces on clickable table rows with a transparent
background, no default border, and inherited text styling. Keep row and status
colors on the page or row surface; do not let a browser's gray button face become
an untracked theme surface.

### Shared layout and control values

These dimensions are shared shell behavior and are defined by the runtime CSS
variables in `src/app/styles/shell/layout/frame.css`:

| Variable | Value | Use |
| --- | --- | --- |
| `--shell-topbar-height` | `58px` | Fixed application topbar |
| `--shell-sidebar-expanded-width` | `156px` | Expanded sidebar and brand area |
| `--shell-sidebar-collapsed-width` | `64px` | Collapsed sidebar and brand area |
| `--control-select-radius` | `10px` | Select and shared compact control corners |
| `--control-select-padding-block` | `0.34rem` | Compact select vertical padding |
| `--control-select-form-padding-block` | `0.62rem` | Form select vertical padding |
| `--control-select-focus-border` | Light: `rgba(22, 71, 142, 0.44)`; dark: 72% `--status-info-text` | Select focus border |
| `--control-select-focus-ring` | Light: `0 0 0 2px rgba(22, 71, 142, 0.14)`; dark: 28% `--status-info-text` | Select focus halo |

The workspace topbar has one fixed row. It contains the fixed shell brand,
current view title, a search control, filters, custom controls, and exactly one
shared plus-menu. At narrow widths, controls can scroll within the row while the
title and plus-menu stay visible. When a view has no page-specific create
actions, the shell's workspace-level menu remains available. Record-specific
create, edit, and delete actions stay beside the record they affect. Do not add
a second title or toolbar row.

Operational views use compact density: controls and metadata stay short, with
stable dimensions; repeated records use thin borders and restrained shadows.
Use horizontal scrolling or stable internal minimum widths for dense tables and
boards rather than squeezing columns until labels collide. At colored card and
callout edges, use no more than a 1px border. Under `prefers-reduced-motion`,
disable decorative transitions while preserving state changes.

## Theme Modes

Light mode uses:

| Role | Hex |
| --- | --- |
| Panel surface | `#ffffff` |
| Alternate row surface | `#f8fafc` |
| Border | `#e5e7eb` |
| Title text | `#000000` |
| Copy text | `#475569` |
| Page lower wash | `#f5f7fb` |

Dark mode uses:

| Role | Hex |
| --- | --- |
| Page base start | `#08111f` |
| Page base end / row surface | `#0f172a` |
| Panel surface | `#1e293b` |
| Border | `#334155` |
| Title text | `#f8fafc` |
| Copy text | `#e2e8f0` |

Dark mode keeps brand blue and red intact. Use paired status tokens for color washes; reserve radial gradients for the auth introduction panel.

## Domain Status Accents

Use the canonical status token pairs above for task states, priorities,
deadlines, warnings, and errors. The task priority ladder is consistent across
priority icons, pills, and detail views: critical/high use danger, medium uses warning,
and low uses neutral. Task statuses map as follows:

| Status | Token pair |
| --- | --- |
| Not started | `--status-neutral-bg` / `--status-neutral-text` |
| In progress | `--status-warning-bg` / `--status-warning-text` |
| Waiting for QA | `--status-info-bg` / `--status-info-text` |
| Complete | `--status-success-bg` / `--status-success-text` |
| Blocked | `--status-danger-bg` / `--status-danger-text` |
| Waiting on dependency | `--status-warning-bg` / `--status-warning-text` |

Status backgrounds and foregrounds always use their semantic pair. For a
restrained 1px status outline, mix the status foreground at 30% with transparent.
Timeline status icons use the same foreground tokens and retain their compact
variants for dense rows.

## Workspace Color Palette

Workspace-generated colors are normalized to six-character hex values and fall back to this palette:

`#E76F51`, `#F4A261`, `#E9C46A`, `#2A9D8F`, `#4F86C6`, `#7A5CFA`, `#C855BC`, `#D64550`

These colors are used for workstreams, subsystems, timeline grouping, and user-selected workspace accents. The fallback subsystem highlight is `#4F86C6`.

Kanban project rails reuse sidebar project identity colors through `--kanban-project-accent` as opaque surface tints. Kanban lane icons use `--kanban-lane-accent`: teams reuse the timeline discipline palette, while subsystem/workstream groups reuse their configured workspace colors. Names retain semantic text colors; icons mix their accent with the theme's title color for contrast. Cards remain neutral.

## Timeline Discipline Colors

Timeline task bars use discipline-based accents:

| Discipline | Hex |
| --- | --- |
| Design | `#c67b1f` |
| Manufacturing | `#b86125` |
| Assembly | `#d1863d` |
| Electrical | `#c9a227` |
| Programming | `#6d5bd0` |
| Testing | `#b84f7a` |
| Planning | `#6a7f96` |
| Communications | `#2f8f83` |
| Finance | `#5d8c4a` |
| Research | `#4b7ca8` |
| Documentation | `#8c6b4d` |
| Engagement | `#b26d3b` |
| Presentation | `#a05fb8` |
| Media production | `#d05b7f` |
| Game analysis | `#3e7cc7` |
| Scouting | `#3aa0b8` |
| Data analysis | `#4f65b8` |
| Risk review | `#8b5c4d` |
| Curriculum | `#5e8f6a` |
| Instruction | `#7d62c7` |
| Practice | `#3d9b7a` |
| Assessment | `#c16b4a` |
| Photography | `#a85c46` |
| Video | `#7a5be0` |
| Graphics | `#d45e8c` |
| Writing | `#6f7b91` |
| Web | `#2f8fa6` |
| Social media | `#dd6f5a` |
| Fallback | `#7a8799` |

Timeline selection and hover states are derived by mixing the active discipline or subsystem color into transparent highlight fills and strokes.

## Milestone Event Colors

Milestone columns and chips use event-specific tints with stronger readable text:

| Event | Light Text | Dark Text |
| --- | --- | --- |
| Practice | `#0d2e5c` | `#bfdbfe` |
| Competition | `#1f3f7a` | `#dbeafe` |
| Deadline | `#8e1120` | `#fecdd3` |
| Internal review | `#1d5338` | `#bbf7d0` |
| Demo | `#36475f` | `#e2e8f0` |

Practice and competition lean blue, deadlines lean red, internal review leans green, and demo stays neutral.

## Alerts And Destructive UI

Destructive actions use the `--status-danger-bg` and `--status-danger-text`
token pair in both themes. Reserve stronger red gradients for destructive task
detail headers, using the existing `#b81d2c`, `#f02c3d`, and `#8f1320` values.

## Secondary Blues

The app uses several blue support colors for focus, dark-mode labels, progress bars, and notification timers:

`#93c5fd`, `#bfdbfe`, `#dbeafe`, `#2563eb`, `#0ea5e9`, `#60a5fa`, `#38bdf8`, `#deebff`, `#eef2f8`

These should stay subordinate to brand blue unless the component is a system/progress indicator.

## Neutrals And Soft Surfaces

Use `--text-copy` and `--text-muted` for neutral text, `--border-base` and
`--border-strong` for separators, and `--bg-row-alt` and `--bg-panel` for
surfaces. Keep neutral UI cool slate; do not introduce local grey values where
one of these shared roles applies.

Use 1px `--border-base` rules between adjacent columns in workspace lists and
tables. Align headers with row fields, including reserved edit-action space.
When table rows stack on narrow screens, separate field labels from values;
single-column lists keep their existing stacking.

## Shell And Navigation

The shell has a fixed top bar and a fixed left sidebar. The top bar height is 58px. The expanded sidebar and brand area are 156px wide; the collapsed sidebar is 64px wide.

The top bar is flat, panel-colored, and separated by a single border. The sidebar uses a vertical gradient between alternate-row and panel surfaces. Active sidebar tabs use a soft brand-blue wash and readable title text. Nested navigation uses the same wash, title text, copy-colored inactive text, and a visible info-colored focus ring. Inactive sidebar tabs stay transparent and copy-colored.

Sidebar collapse updates shell and sidebar dimensions immediately. Overlay mode keeps the shell offset fixed, adds a dark scrim, and gives the floating sidebar a rightward shadow.

## Controls

Select controls share a 10px radius, compact vertical padding, right-side chevron indicators made from the current text color, and a blue focus ring. Focus uses a transparent brand-blue ring; hover increases the border tint.

Filter controls use rounded pills, compact icon buttons, uppercase count labels,
and tone classes. Their foreground and check colors use the paired shared status
tokens; selected and hover backgrounds mix the same status text color into its
status background. Dark mode uses the dark values from those token pairs.

| Tone | Token pair |
| --- | --- |
| Info | `--status-info-bg` / `--status-info-text` |
| Success | `--status-success-bg` / `--status-success-text` |
| Warning | `--status-warning-bg` / `--status-warning-text` |
| Danger | `--status-danger-bg` / `--status-danger-text` |
| Neutral | `--status-neutral-bg` / `--status-neutral-text` |

Workspace notification cards use the four semantic status pairs in both themes.
Neutral notification history uses an inverse gray surface with white text.

## Cards, Boards, And Tables

Cards and board columns use panel surfaces, thin borders, and soft shadows. Task queue columns have a 16px radius, compact internal grid spacing, and uppercase micro-headings. Counts use pill-shaped blue-tinted badges.

Tables are grid-based rather than native table layouts. Headers use small uppercase labels, muted copy color, and brand-blue sort arrows. Purchase, manufacturing, and print tables each define their own proportional column templates.

Task queue cards use neutral 1px borders without priority-colored outlines or tinted shadows. Priority uses the shared glyphs, with accessible labels and semantic text colors. Future and completed-task deadlines stay neutral; due-today and overdue deadlines use warning and danger text. Cards use zoom-scaled spacing and type. Board labels use the canonical text tokens. Task status and priority states use the semantic token pairs defined above in both themes.

## Timeline

Timeline bars use discipline color as the primary accent and task status color as the secondary accent. Bars have reveal overlays, masked overflow fades, row hover/selected highlights, and compact status logos. Reveal text uses the same contrast-aware foreground as the task title.

Timeline controls are pill-shaped and compact. Expand/collapse and period navigation use short ease-out animations. Today markers, row highlights, milestone overlays, and subsystem bands derive color from the same discipline/subsystem accent system.

## Auth Experience

Auth pages center the sign-in content over the app's restrained light or dark page base. The introduction panel carries the deep blue surface, brand-colored radial washes, and white text. Auth cards use solid `--bg-panel` surfaces, semantic borders, and `--shadow-soft` in both themes so status and sign-in copy remains readable.

## Typography

Body text, headings, navigation, filters, buttons, labels, and dense operational controls use the system sans-serif stack with platform fallbacks.

Text hierarchy favors:

- Large compact auth headings with tight line height.
- Small uppercase labels for metadata, filters, table headers, and sidebar context.
- Bold weights for tabs, controls, counts, board column headings, and status labels.
- Normal letter spacing in most text, with deliberate positive tracking only for small uppercase labels.

## Shape, Radius, And Density

The app uses compact operational density:

- Top-level cards and auth panels use larger radii.
- Repeated cards and board columns usually sit around medium radii.
- Sidebar tabs and workspace tabs are squarer and tighter.
- Pills, status chips, counts, icon status marks, and badges use fully rounded shapes.
- Controls are generally compact, with stable widths and heights for icons, counters, boards, and toolbar items.

## Shadows And Depth

Depth is restrained. Use `--shadow-soft` for panels, cards, auth surfaces, and
shared chrome, and `--shadow-overlay` for menus and popovers. Add separate depth
only for a distinct component need, such as a brand mark that must float.

## Motion

Motion is short and functional. Sidebar width and shell padding update
immediately. Animate visual feedback such as filter focus, hover, timeline
unfolding, timeline period swipes, status captions, and board card affordances.
The app avoids long decorative motion.

## Responsive Behavior

The app is built around fixed shell chrome with responsive content density. Selects and view controls can use available width on smaller screens. The workspace topbar remains one row; search and controls scroll horizontally when needed, with title and shared plus-menu remaining visible. Tables and task boards preserve internal structure through horizontal scroll or stable min-widths rather than collapsing into unreadable columns. Auth switches from two-column composition to tighter stacked behavior on smaller screens.

## Assets

Brand SVG assets use the official blue, red, grey, black, and white palette. The white logo variant uses white for most lettering and red for select numeric/brand detail.

The tab icon and main logo are the strongest source of visual identity and should remain aligned with `#16478e`, `#ea1c2d`, `#bbbbbb`, `#000000`, and `#ffffff`.

## Source Map

Primary visual sources:

- `src/app/theme/index.ts`: runtime light/dark theme tokens.
- `src/index.css`: global typography, brand CSS variables, and body background.
- `src/app/styles/**`: shell, workspace, views, responsive styling.
- `src/features/workspace/shared/model/workspaceColors.ts`: workspace color palette and normalization.
- `src/features/workspace/views/timeline/timelineTaskColors.ts`: timeline discipline accents.
- `src/features/workspace/shared/events/eventStyles.ts`: milestone event styles.
- `public/*.svg`: MECO logo, tab icon, and login backdrop brand colors.
