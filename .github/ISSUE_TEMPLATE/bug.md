---
name: Bug report
about: Report a web defect, regression, or frontend/backend contract mismatch
title: "Bug: "
labels:
  - area:web
  - type:bug
  - priority:p2
---

## Summary

Shortly describe the bug and where it appears.

## Repro steps

1.
2.
3.

## Expected / Actual

- Expected:
- Actual:

## Impact and scope

- Environment (route/user/role/browser/device):
- Frequency:
- API route/schema/payload involved:
- Env/config/feature flag involved:
- Migration or deploy dependency:

## Evidence

- Browser/viewport:
- API request(s) affected (if any):
- Console or network error output:
- Screenshot/video:

## Validation

- [ ] I reproduced on `development`.
- [ ] I can point to the expected API/contract path (`meco-mission-control-platform` route/schema).
- [ ] I ran `npm run verify` (`npm.cmd run verify` on Windows) before submitting, or noted why not:
- [ ] Visual confirmation (screenshot/video) attached for UI issues.

## Risk and rollback notes

- User impact:
- Known workaround:
- Rollback/mitigation path:
- Release risk:
