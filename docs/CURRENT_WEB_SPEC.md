# Current Web App Specification

This document captures the current web-app product and implementation shape on the `development` branch. It is intended to sit beside the older Word requirements documents and give future PRs a stable, repo-local reference for the app as it exists now.

## Product Role

`meco-mission-control-web` is the broad-screen Mission Control client. It should prioritize high-context planning, review, configuration, and coordination workflows that are too dense for the mobile app.

The web app is responsible for:

- Dashboard review surfaces for calendar, activity, and metrics.
- Readiness review surfaces for action triage, milestones, subsystems, and risks.
- Work planning through timeline and task-board views.
- Robot configuration for subsystem, mechanism, and part-instance structure.
- Manufacturing coordination for CNC, 3D print, and fabrication work.
- Inventory tracking for materials, parts, purchases, and robot-only part mappings.
- Roster review for workload, attendance, and directory workflows.
- Reports for work logs, QA forms, and milestone results.
- Help and tutorial surfaces for user guidance.

The mobile app remains the fast in-shop update surface. Shared behavior should stay contract-compatible, but dense planning and review interactions belong here first.

## Current Navigation Contract

The sidebar is organized around these sections:

| Section | Purpose | Current subviews |
| --- | --- | --- |
| Dashboard | Fast review of what is happening now | Calendar, Activity, Metrics |
| Readiness | What needs attention before execution or events | Action Required, Milestones, Subsystems, Risks |
| Config | Configuration and directory maintenance | Robot Configuration, Part mappings, Directory |
| Work | Execution planning and manufacturing work | Timeline, Tasks, Manufacturing |
| Inventory | Materials, parts, and purchasing | Materials, Parts, Purchases |
| Roster | Student/mentor availability and participation | Workload, Attendance |
| Reports | Historical or evidence-oriented records | Work logs, QA forms, Milestone results |

The route/tab keys remain implementation details. User-facing docs and UI copy should use the section and subview labels above unless a code-level reference is required.

### View Availability Rules

- Manufacturing is robot-project specific.
- Robot projects expose Materials, Parts, and Purchases under Inventory.
- Non-robot projects collapse inventory toward Documents/Materials and Purchases.
- Part mappings are a robot configuration/inventory support surface, not a general standalone planning view.
- `All projects` can hide or redirect project-specific views when the selected scope cannot support them.

## Current View Specifications

### Dashboard

Dashboard is a lightweight review group, not a separate data model. It should surface already-existing workspace data through decision-focused entry points.

- Calendar shows schedule/milestone context.
- Activity shows platform audit actions and recent work context.
- Metrics summarizes build health, plan-vs-actual, progress, coverage, and action queues.

### Readiness

Readiness is for deciding what must be fixed, reviewed, or watched next.

- Action Required is the primary triage page. It ranks cross-domain items by urgency and explains why each item needs attention.
- Milestones are deadline and evidence anchors.
- Subsystems show robot/workflow structure and health context.
- Risks remain the risk-management board and should stay connected to task, QA, purchase, and manufacturing signals where possible.

### Work

Work is the execution planning area.

- Timeline is the schedule-oriented view, with subsystem rows and task/milestone alignment.
- Tasks is the state board for task execution.
- Manufacturing is part of Work because fabrication status blocks execution, even though the underlying records also relate to inventory and robot structure.

### Robot Configuration

Robot Configuration is the main structure-editing surface for robot projects.

Expected behavior:

- Center the robot/reference image or placeholder as the spatial anchor.
- Show draggable subsystem cards on the map.
- Persist subsystem placement fields through the subsystem layout API path.
- Allow reset/auto-arrange flows to operate on the full subsystem dataset, not only the visible search-filtered subset.
- Open a detail panel from a subsystem card.
- Keep mechanism and part-instance management inside that detail flow.
- Prefer icon-only edit/add controls where the target is visually obvious.
- Hide or gate robot-only controls outside robot-project scope.

This page should absorb part-mapping complexity where practical. Avoid recreating a separate part map unless there is a clear workflow that cannot be handled from subsystem/mechanism/part context.

### Inventory

Inventory owns materials, parts, purchases, and robot-only part-mapping support.

- Materials are available across project types.
- Parts are robot-project specific.
- Purchases are project-scoped and should remain visible where procurement exists.
- Part mappings should be subordinate to robot configuration and robot inventory needs.

### Roster

Roster should explain who is available, who is overloaded, and who has participation data needing review.

- Workload is the operational planning surface.
- Attendance is the participation record surface.
- Directory is a configuration/admin surface and is currently reachable through Config.

### Reports

Reports are evidence and history surfaces.

- Work logs should remain available for review and metrics support.
- QA forms are quality evidence and can generate follow-up action.
- Milestone results are event/deadline evidence anchors.

## Data and API Contract Notes

The frontend still performs bootstrap normalization to tolerate legacy and evolving payload shapes. This compatibility layer is intentional, but new backend changes should tighten the source contract rather than expand frontend patching indefinitely.

When changing data contracts:

1. Update the platform route/schema contract first.
2. Align `src/types/**` and `src/lib/auth.ts` in this repo.
3. Validate scoped season/project behavior, including `All projects` and non-robot project cases.
4. Verify view gating for robot-only tabs and controls.

## UI and Interaction Principles

- Optimize for decision-making, not raw record display.
- Keep configuration separate from readiness when possible, but allow Robot Configuration to own structure editing because structure is spatial and hierarchical.
- Do not create another standalone page when a workflow can be handled inside the responsible domain view.
- Prefer derived signals over new entities when the same meaning can be computed from tasks, work logs, QA, risks, manufacturing, purchases, and audit actions.
- Preserve keyboard and responsive behavior in topbar and timeline interactions.
- Keep empty, loading, rollback, and storage-failure states explicit.

## Implementation Guardrails

Follow `AGENTS.md` for repository structure rules.

Key implications for web-app changes:

- Split React files before they exceed the hard file-size cap.
- Keep feature-specific CSS scoped and split by component or responsibility.
- Avoid flat directories with mixed responsibilities.
- Keep generated diagnostics under `.diagnostics/`, not in the repository root.
- Use `environment.toml` as the Codex worktree startup source of truth.

## Recent PR-Derived Product Decisions

The following recent PR themes are now part of the current spec:

- Metrics is a decision-focused dashboard, not just a statistics page.
- Attention has become Action Required and should function as cross-domain triage.
- WorkLogs Activity now shows platform audit actions, not only work-log records.
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

For structural refactors, run:

```bash
npm run audit:organization:strict
```

## Known Documentation Drift to Avoid

- Do not describe the old primary-tab model as the current user-facing navigation.
- Do not describe Part Mapping as a normal standalone page without noting robot-only gating and Robot Configuration ownership.
- Do not describe Attention as the current label; user-facing copy is Action Required.
- Do not treat Metrics as a generic chart page; it is now decision and readiness oriented.
- Do not place Robot Configuration under generic task planning copy without noting its configuration role.
