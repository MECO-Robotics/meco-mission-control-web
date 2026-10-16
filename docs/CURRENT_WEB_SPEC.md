# Current Web App Specification

This document captures the current web-app product and implementation shape on the `development` branch. It is intended to sit beside the older Word requirements documents and give future PRs a stable, repo-local reference for the app as it exists now.

## Product Role

`meco-mission-control-web` is the broad-screen Mission Control client. It should prioritize high-context planning, review, configuration, and coordination workflows that are too dense for the mobile app.

The web app owns cross-project planning, coordination, resource management, evidence review and team operations. Mobile remains the quick in-shop update surface.

## Current Navigation Contract

The app uses the original sidebar implementation: Home shortcut, expandable Work/Resources/Team sections, icon subitems, compact flyouts, and its existing responsive overlay. The topbar displays the current page title. Workspace views use the shared search, controls, and plus slots for functional view actions; the topbar title is not repeated inside the view. The native mobile app retains labeled bottom navigation.

| Area | Views | Consolidation |
| --- | --- | --- |
| Home | Action Required, next four milestone timeline, task status distribution | Uses selected project scope; one attention row per source record; Risks provides build review and linked work |
| Work | Tasks, Schedule, Risks, Activity | Schedule offers Calendar, Timeline and Agenda; Activity filters work logs, changes, QA and milestone results |
| Resources | Materials/Documents, Parts, Purchases, Manufacturing, Structure | Manufacturing uses a process filter; installed parts live under their definition; CAD import opens from Structure |
| Team | People, Teams | People combines directory, presence, availability and individual workload; Teams manages ResponsibleGroups, adds or reuses matching WorkType disciplines, and derives team workload/capacity |

Tasks opens first in Work. Robot-only Parts and Manufacturing require a robot project. Structure requires a selected project and uses the robot map or the non-robot workflow view. All-project Resources exposes Materials and Purchases. Non-robot projects use Documents and Purchases. Home remains available without a season; other collections require season data. Help and account controls remain utilities.

Task details use a drawer on desktop and fill the narrow viewport. Logging work and submitting QA open from the task; milestone results open from the milestone. The originating detail returns after save or cancel, and editors protect unsaved changes. Collection filters survive destination changes within the current season/project; changing scope resets these local filters. URLs retain canonical destination, presentation and scope. Task details support Back, Forward and refresh; browser Back restores page scroll.

The former Dashboard, Readiness, Config and Reports destinations, the work-log status board, the separate part-mapping page and the standalone People workload/availability pages have been removed. Their retained behavior is owned by the views above.

### Home dashboard signals

Home uses the selected project (or all projects) and current bootstrap data. The active person filter also scopes tasks and task-linked risks. Each signal answers a separate project-lead decision:

This hierarchy follows dashboard evaluation research that measures whether users can complete real decisions and whether the displayed data is accurate, current, and complete, rather than rewarding chart count. PLM context also connects product structure and change workflows to manufacturing, which supports routing action rows to their owning domain. See the [dashboard evaluation framework](https://eprints.whiterose.ac.uk/id/eprint/184215/1/dashboard_evaluation.pdf), [dashboard decision study](https://osuva.uwasa.fi/items/76b8c883-a991-4901-8cac-82ac65eb3f3b), and [PTC Windchill overview](https://www.ptc.com/en/products/windchill).

| Signal | Decision question and source | Status and ordering rule | Click destination |
| --- | --- | --- | --- |
| Action Required | What needs attention now? Shares the Risks queue's active risks and blocked, overdue, waiting-for-QA or due-soon task signals. Multiple signals for the same source record are combined into one row with their reasons. | Ranks blocking work first, then overdue, critical/high risks, waiting-for-QA tasks, tasks due within seven days, and other active risks. Priority, due date, title and record identity break ties. Shows the five highest-ranked rows. | Task opens its detail drawer; risk opens that risk's details. “View all” opens Risks. |
| Upcoming milestones | What is coming next, and what readiness has been recorded? Reads milestones in the scoped bootstrap payload. | Excludes complete and past milestones, sorts by start date, and shows the next four with existing milestone status and readiness. Missing readiness is “Not assessed”; it is not treated as ready. | Opens the selected milestone in Schedule → Agenda. |
| Task status | How are scoped tasks distributed across execution states, and which group needs follow-up? Reads current scoped bootstrap tasks and groups by their stored status. | Displays exact counts for not started, in progress, waiting for QA, and complete. The stacked bar is proportional to those counts; labels and counts remain visible without color. | Activating a status label reveals matching tasks; selecting a task opens its detail drawer. |

See [navigation-consolidation.md](navigation-consolidation.md) for the cross-client scope, validation and contract changes.

### Risks triage

Risks is a build-review surface with coordinated charts, a ranked queue and a selected-record inspector. Bottlenecks by area show unfinished work split into blocked, waiting on dependencies, QA and other work. Deadline exposure compares recorded task and mitigation deadlines. These are current-state diagnostics, not a delivery forecast or an aggregate health score. Tasks linked to multiple areas appear in each area's chart.

Selecting a chart segment filters the same deduplicated record queue; the selected context can be cleared in the shared topbar. Search, source/owner/signal filters and priority/title/due-date sorting apply to this queue. Resolved risks are excluded by default and can be included explicitly. Selecting a record reveals its context, next actions and an explicit relationship diagram. The diagram distinguishes attached work, mitigation and prerequisite links, reports missing records, and preserves cycles without inventing associations. Manufacturing attachments identify tasks with manufacturing details; purchase attachments identify purchase records and their linked tasks. A mitigation task is a response, not automatically affected work.

Ownership, severity and status changes live with the selected risk and show pending/failure feedback. Task actions use the existing task details. The full risk editor retains attachments, mitigation and audit context. Add risk remains in the shared topbar plus menu. The old severity board, repeated action-count lists, Project health dashboard and hours-based pseudo-progress are removed.

Home shares the same risks-and-tasks queue and urgency rules for its Action Required preview. Its five-row limit does not limit the Risks queue. Purchasing, manufacturing and report review records stay in their owning domain views.

## Data and API Contract Notes

The frontend normalizes bootstrap data at its boundary. Reports use the canonical `reports` and `reportFindings` collections; derived QA/test mirrors and their legacy import path are removed. Tighten the source contract and remove obsolete prototype adapters instead of expanding compatibility scaffolding.

When changing data contracts:

1. Update the platform route/schema contract first.
2. Align `src/types/**` and the relevant module under `src/lib/auth/` in this repo.
3. Validate scoped season/project behavior, including `All projects` and non-robot project cases.
4. Verify view gating for robot-only tabs and controls.

## UI and Interaction Principles

- Optimize for decision-making, not raw record display.
- Keep structure editing inside Resources → Structure, with readiness evidence linked from the relevant task or milestone.
- Do not create another standalone page when a workflow can be handled inside the responsible domain view.
- Prefer derived signals over new entities when the same meaning can be computed from tasks, work logs, QA, risks, manufacturing, purchases, and audit actions.
- Preserve keyboard and responsive behavior in topbar and timeline interactions.
- Use the shared topbar slots for functional search, filters, sort, view-specific controls, and create actions. Do not add duplicate in-view page headings or operational-summary prose; place instructions in Help/tutorial content. See [web-contributor-guide.md](web-contributor-guide.md#workspace-topbar-contract).
- Keep empty, loading, rollback, and storage-failure states explicit.

## Implementation Guardrails

Follow [CONTRIBUTING.md](../CONTRIBUTING.md) for contributor and ownership criteria.

Key implications for web-app changes:

- Give behavior one clear owner; remove redundant wiring rather than splitting files to satisfy quotas.
- Keep feature-specific CSS scoped and split by component or responsibility.
- Avoid flat directories with mixed responsibilities.
- Keep generated diagnostics under `.diagnostics/`, not in the repository root.
- Use `environment.toml` as the Codex worktree startup source of truth.

## Recent PR-Derived Product Decisions

The following recent PR themes are now part of the current spec:

- Risks connects current bottlenecks and recorded deadlines to reviewable records and explicit dependency links.
- Home prioritizes Action Required, then the next four milestones, with task status distribution as its only supporting chart. It uses current scoped data and does not imply historical trends or an aggregate readiness score.
- Attention has become Action Required and should function as cross-domain triage.
- WorkLogs Activity now shows platform audit actions, not only work-log records, and follows the
  platform retention/privacy policy for archive, delete, and admin-access behavior.
- The standalone Part Mapping page was removed from general navigation pressure.
- Robot Configuration is map-first with draggable subsystem cards and subsystem detail editing.
- Robot Configuration follow-up work hardened rollback behavior, reset-layout scope, storage-failure handling, and robot-only topbar gating.
- Timeline subsystem rows require correct row-index propagation to keep merged-cell highlights aligned.
- Topbar portal/search behavior should avoid flicker and target churn.
- Organization audit rules are part of the expected validation and maintainability flow.

## Validation Expectations

Before merging web-app changes, run:

```bash
npm run verify
```

For targeted follow-ups, also run the narrow test command related to the modified view when one exists, such as:

```bash
npm run test:ci -- TimelineView
npm run test:ci -- RisksView
npm run test:ci -- WorkLogsView
```


## Known Documentation Drift to Avoid

- Do not describe the old primary-tab model as the current user-facing navigation.
- Do not describe Part Mapping as a normal standalone page without noting robot-only gating and Robot Configuration ownership.
- Do not describe Attention as the current label; user-facing copy is Action Required.
- Do not restore the retired Project health score or treat logged hours as completion. Risks shows recorded work states, deadlines and response links.
- Do not place Robot Configuration under generic task planning copy without noting its configuration role.

## Receiving and current evidence

Purchases show received and remaining quantities with receipt locations and history. Mentor/admin users can record partial receipts for ordered, shipped or delivered purchases. Receiving records quantity and stock destination; it does not mark work or parts ready. An acknowledged receipt stays pending reconciliation if the following refresh fails, so the same action cannot be accidentally retried.

New task drafts use the selected project and a subsystem from that project. Owner defaults and choices use leads/students; mentor defaults use mentors. Missing eligible people remain unassigned. Existing advanced and manufacturing details remain available and retain saved values when collapsed.

Part readiness uses reviewed, revision-matched evidence. Historical results remain stored; stale results do not verify a changed part revision. Required milestone criteria must exist before readiness can be established.
