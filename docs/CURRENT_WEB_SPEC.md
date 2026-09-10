# Current Web App Specification

This document captures the current web-app product and implementation shape on the `development` branch. It is intended to sit beside the older Word requirements documents and give future PRs a stable, repo-local reference for the app as it exists now.

## Product Role

`meco-mission-control-web` is the broad-screen Mission Control client. It should prioritize high-context planning, review, configuration, and coordination workflows that are too dense for the mobile app.

The web app owns cross-project planning, coordination, resource management, evidence review and team operations. Mobile remains the quick in-shop update surface.

## Current Navigation Contract

The app has four primary destinations. Desktop uses a sidebar; narrow web and mobile use labeled bottom navigation. Secondary destinations live in one explicit view selector.

| Area | Views | Consolidation |
| --- | --- | --- |
| Home | Priority work, upcoming milestones, Needs attention | One attention row per source record; Project health expands on demand |
| Work | Tasks, Schedule, Risks, Activity | Schedule offers Calendar, Timeline and Agenda; Activity filters work logs, changes, QA and milestone results |
| Resources | Materials/Documents, Parts, Purchases, Manufacturing, Structure | Manufacturing uses a process filter; installed parts live under their definition; CAD import opens from Structure |
| Team | People, Attendance | People combines directory, presence, availability and workload |

Tasks opens first in Work. Robot-only Parts and Manufacturing require a robot project. Structure requires a selected project and uses the robot map or the non-robot workflow view. All-project Resources exposes Materials and Purchases. Non-robot projects use Documents and Purchases. Home remains available without a season; other collections require season data. Help and account controls remain utilities.

Task details use a drawer on desktop and fill the narrow viewport. Logging work and submitting QA open from the task; milestone results open from the milestone. The originating detail returns after save or cancel, and editors protect unsaved changes. Collection filters survive destination changes within the current season/project; changing scope resets these local filters. URLs retain canonical destination, presentation and scope. Task details support Back, Forward and refresh; browser Back restores page scroll.

The former Dashboard, Readiness, Config and Reports destinations, the work-log status board, the separate part-mapping page and the standalone People workload/availability pages have been removed. Their retained behavior is owned by the views above.

See [navigation-consolidation.md](navigation-consolidation.md) for the cross-client scope, validation and favorite reset behavior.

## Data and API Contract Notes

The frontend still performs bootstrap normalization to tolerate legacy and evolving payload shapes. This compatibility layer is intentional, but new backend changes should tighten the source contract rather than expand frontend patching indefinitely.

When changing data contracts:

1. Update the platform route/schema contract first.
2. Align `src/types/**` and `src/lib/auth.ts` in this repo.
3. Validate scoped season/project behavior, including `All projects` and non-robot project cases.
4. Verify view gating for robot-only tabs and controls.

## UI and Interaction Principles

- Optimize for decision-making, not raw record display.
- Keep structure editing inside Resources → Structure, with readiness evidence linked from the relevant task or milestone.
- Do not create another standalone page when a workflow can be handled inside the responsible domain view.
- Prefer derived signals over new entities when the same meaning can be computed from tasks, work logs, QA, risks, manufacturing, purchases, and audit actions.
- Preserve keyboard and responsive behavior in topbar and timeline interactions.
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
