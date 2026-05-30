---
name: UX review
about: Request a focused UX review of a workflow or page
title: "UX: "
labels:
  - ux
---

## Flow / screen under review

Route or feature:

## Review objective

What is the expected user outcome?

## Current or proposed state

- Link(s):
- Target user devices:
- User role/persona:
- Data state needed for review:

## Checkpoints

- [ ] Layout, hierarchy, and whitespace are readable at target breakpoints.
- [ ] Interaction states (hover/focus/error/loading/empty) are clear.
- [ ] Accessibility and keyboard paths are considered.
- [ ] Copy and labels match the workflow vocabulary.
- [ ] API/loading/error states preserve the intended UX.

## Evidence

- Screenshot/video (before/after if applicable):
- Design reference (if any):
- Browser/device/viewport:

## Validation

- [ ] Visual QA completed at target breakpoints.
- [ ] `npm run verify` (`npm.cmd run verify` on Windows) run, or reason not applicable:
- [ ] Relevant contract/API state confirmed in `meco-mission-control-platform`, if applicable:

## Risk and release notes

- [ ] No release risk.
- [ ] Potential release risk / rollback consideration:
- Env/config/migration dependency:
- Risk notes:
- Rollback/mitigation plan:
