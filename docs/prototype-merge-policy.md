# Prototype merge policy

User direction on 2026-09-09: remove web integration blocks until the product is feasible. This overrides older instructions that make trust promotion or independent approval mandatory for the current web prototype.

## Current settings

- Classic branch protection removed from main and development.
- Repository rulesets 16137219 (development), 16137229 (main), and 17247679 (staging) disabled.
- Trusted Merge Requirements workflow (`merge-requirements.yml`) disabled through GitHub Actions settings. Its source remains available for later reuse.
- CI and shared-skill validation remain enabled. Dedicated worktrees and reviewable PRs remain the development convention.
- Deployment workflow/environment approvals are unchanged. Merging development is not a deployment request.

The old settings are saved in [prototype-protection-backup](prototype-protection-backup). The historical staging branch had ruleset protection only, not a separate classic branch-protection object.

## Reinstatement

Reinstate only after the user requests it. First review whether each rule is still useful; do not blindly restore obsolete workflow hashes. Update and validate the trusted workflow's allowed CI digest against the intended revision before enabling it.

1. Restore the selected classic branch settings through GitHub branch settings (or translate the saved GET response into the PUT branch-protection schema).
2. Review the saved rulesets, then set the selected rulesets to `active`. If GitHub rejects obsolete stored parameters, supply the normalized saved rule definitions explicitly instead of a partial update.
3. Enable the workflow with `gh workflow enable merge-requirements.yml --repo MECO-Robotics/meco-mission-control-web`.
4. Run a representative PR through CI and trusted validation before requiring its status again.

These changes affect repository integration policy only; they do not alter application authorization or production deployment approvals.
