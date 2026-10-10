# Color Theme

This document summarizes the visual language currently used by the app. Exact copied values are limited to hex colors; gradients, alpha washes, shadows, spacing, and layout behavior are described in plain language.

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

The app background is a light layered field: a white-to-cool-slate page base with soft blue and red radial washes. Auth and shell backgrounds reuse the same brand wash idea, with stronger blue/red atmosphere in dark mode.

Global body text starts at `#11213d`. Links inherit surrounding color.

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

Dark mode keeps brand blue and red intact, but raises their transparent washes so the brand atmosphere remains visible against the dark shell.

## Status Colors

Shared status tokens:

| Status | Light Background | Light Text | Dark Background | Dark Text |
| --- | --- | --- | --- | --- |
| Success | `#dcfce7` | `#166534` | `#064e3b` | `#34d399` |
| Info | `#e0f2fe` | `#075985` | `#082f49` | `#38bdf8` |
| Warning | `#fef3c7` | `#92400e` | `#451a03` | `#fbbf24` |
| Danger | `#fee2e2` | `#991b1b` | `#450a0a` | `#f87171` |
| Neutral | `#f1f5f9` | `#475569` | `#1e293b` | `#94a3b8` |

Task and workflow status accents:

| Meaning | Hex |
| --- | --- |
| Not started / neutral | `#54627b` |
| In progress | `#b77900` |
| Waiting for QA | `#275098` |
| Complete | `#246847` |
| Blocked alternate | `#8f4b5d` |
| Waiting on dependency | `#c25a14` |
| High priority / purchase in progress | `#a84712` |
| Alternate in-progress text | `#8a5c00` |

Status pills are usually tinted backgrounds using the same family as the text color. Timeline status icons are circular, use translucent white surfaces, and expose compact variants for dense rows.

## Workspace Color Palette

Workspace-generated colors are normalized to six-character hex values and fall back to this palette:

`#E76F51`, `#F4A261`, `#E9C46A`, `#2A9D8F`, `#4F86C6`, `#7A5CFA`, `#C855BC`, `#D64550`

These colors are used for workstreams, subsystems, timeline grouping, and user-selected workspace accents. The fallback subsystem highlight is `#4F86C6`.

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
| Partnerships | `#3a8a76` |
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

Destructive actions use red surfaces and red text, with `#b42318` as the main danger text in light surfaces and `#fca5a5` as the dark-mode danger text. Delete/action surfaces also use `#fff1f2` and `#fda29b`.

Task details use red gradients for destructive headers and emphasis, including `#b81d2c`, `#f02c3d`, and `#8f1320`.

## Secondary Blues

The app uses several blue support colors for focus, dark-mode labels, progress bars, and notification timers:

`#93c5fd`, `#bfdbfe`, `#dbeafe`, `#2563eb`, `#0ea5e9`, `#60a5fa`, `#38bdf8`, `#deebff`, `#eef2f8`

These should stay subordinate to brand blue unless the component is a system/progress indicator.

## Neutrals And Soft Surfaces

Common neutral and surface colors:

`#21304a`, `#58667d`, `#64748b`, `#cbd5e1`, `#d1d1d1`, `#d6dbe6`, `#e5e7eb`, `#e6e7f3`, `#f1f5f9`, `#f8fafc`, `#f8fbff`, `#eef4fb`

Neutral UI tends to use cool slate rather than warm grey. Panels, cards, table rows, and filter menus are separated mostly by thin borders, low-opacity shadows, and alternate-row fills.

## Shell And Navigation

The shell has a fixed top bar and a fixed left sidebar. The top bar height is 58px. The expanded sidebar and brand area are 156px wide; the collapsed sidebar is 64px wide.

The top bar is flat, panel-colored, and separated by a single border. The sidebar uses a vertical gradient between alternate-row and panel surfaces. Active sidebar tabs use a soft brand-blue wash, brand-blue text, and a modest border. Inactive sidebar tabs stay transparent and copy-colored.

Sidebar collapse and overlay states animate width and shell padding. Overlay mode adds a dark scrim and a rightward sidebar shadow.

## Controls

Select controls share a 10px radius, compact vertical padding, right-side chevron indicators made from the current text color, and a blue focus ring. Focus uses a transparent brand-blue ring; hover increases the border tint.

Filter controls use rounded pills, compact icon buttons, uppercase count labels, and tone classes:

| Tone | Text Hex |
| --- | --- |
| Primary | `#16478e` |
| Success | `#246847` |
| Warning | `#a84712` |
| Danger | `#9b1d2a` |
| Neutral | `#54627b` |

Dark filter controls can switch to `#bfdbfe` for foreground and check marks.

## Cards, Boards, And Tables

Cards and board columns use panel surfaces, thin borders, and soft shadows. Task queue columns have a 16px radius, compact internal grid spacing, and uppercase micro-headings. Counts use pill-shaped blue-tinted badges.

Tables are grid-based rather than native table layouts. Headers use small uppercase labels, muted copy color, and brand-blue sort arrows. Purchase, manufacturing, and print tables each define their own proportional column templates.

Task queue advanced cards use zoom-scaled spacing and type. Dark-mode board labels use cool blues and slates such as `#93c5fd` and `#cbd5e1`. Attention states use `#dc2626`, `#ef4444`, `#b91c1c`, `#ca8a04`, and `#2563eb`.

## Timeline

Timeline bars use discipline color as the primary accent and task status color as the secondary accent. Bars have reveal overlays, masked overflow fades, row hover/selected highlights, and compact status logos.

Timeline controls are pill-shaped and compact. Expand/collapse and period navigation use short ease-out animations. Today markers, row highlights, milestone overlays, and subsystem bands derive color from the same discipline/subsystem accent system.

## Auth Experience

Auth pages center a two-column layout over a large, faint MECO backdrop image. The light auth shell uses a clean blue/red radial atmosphere over `#f8fbff` to `#eef4fb`.

The dark auth card uses a deep blue gradient between `#0b1731` and `#10284d`, brand-colored radial washes, white text, rounded corners near 30px, and a stronger shadow.

Auth cards use soft borders, glassy white overlays in light mode, translucent dark surfaces in dark mode, and a large MECO logo/backdrop with reduced opacity.

## Typography

Body text uses a serif-first reading stack. Headings, navigation, filters, buttons, labels, and dense operational controls use a geometric sans-first stack.

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

Depth is restrained. The app uses:

- Very soft panel shadows for board columns and cards.
- Stronger shadows for modals, toast notifications, overlays, and dark profile menus.
- Drop shadows on logos/backdrops where the mark needs to float.
- Minimal or no shadow on fixed chrome like the top bar.

## Motion

Motion is short and functional. Sidebar width, shell padding, filter focus, hover states, timeline unfolding, timeline period swipes, status captions, and board card affordances use brief easing. The app avoids long decorative motion.

## Responsive Behavior

The app is built around fixed shell chrome with responsive content density. Selects and toolbars collapse toward full width on smaller screens. Tables and task boards preserve internal structure through horizontal scroll or stable min-widths rather than collapsing into unreadable columns. Auth switches from two-column composition to tighter stacked behavior on smaller screens.

## Assets

Brand SVG assets use the official blue, red, grey, black, and white palette. The white logo variant uses white for most lettering and red for select numeric/brand detail. The login backdrop uses the same brand colors at lower opacity as an atmospheric layer.

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
