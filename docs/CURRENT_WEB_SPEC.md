# Current Web App Specification

This document captures the current web-app product and implementation shape on the `development` branch. It is intended to sit beside the older Word requirements documents and give future PRs a stable, repo-local reference for the app as it exists now.

## Product Role

`meco-mission-control-web` is the broad-screen Mission Control client. It should prioritize high-context planning, review, configuration, and coordination workflows that are too dense for the mobile app.

The web app owns cross-project planning, coordination, resource management, evidence review and team operations. Mobile remains the quick in-shop update surface.

## Current Navigation Contract

The app uses the original sidebar implementation: Home shortcut, expandable Work/Resources/Team sections, icon subitems, compact flyouts, and its existing responsive overlay. The topbar displays the current page title. Workspace views use the shared search, controls, and plus slots for functional view actions; the topbar title is not repeated inside the view. The native mobile app retains labeled bottom navigation.

| Area | Views | Consolidation |
| --- | --- | --- |
| Home | Action Required, next four milestone timeline, task status distribution | Uses selected project scope; one attention row per source record; detailed metrics remain in Risks |
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

Risks is one ranked queue of risk records and actionable task signals. Each record appears once with its combined reasons, owner, priority and due context. The default ordering follows urgency; search, source/owner/signal filters and priority/title/due-date sorting operate on this same queue. Resolved risks are excluded by default and can be included explicitly. The severity board and repeated Unassigned, Blocked and Overdue lists are removed.

Risk rows provide quick ownership, severity and status changes with pending and failure feedback. Task rows open the existing task details for task actions. Risk details retain the full mitigation, related-record and audit context, with the existing editor for broader changes. Add risk remains in the shared topbar plus menu. Project health stays collapsed below the queue and is calculated separately from queue search and filters.

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

- Metrics is a decision-focused dashboard, not just a statistics page.
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
- Do not treat Metrics as a generic chart page; it is now decision and readiness oriented.
- Do not place Robot Configuration under generic task planning copy without noting its configuration role.
