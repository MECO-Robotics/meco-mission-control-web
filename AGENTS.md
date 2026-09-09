# Web agent instructions

- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for setup, validation and PR policy.
- Work in dedicated worktrees outside base checkouts. Base checkouts are for inspection, fetching and worktree creation.
- This is an undeployed prototype with disposable development data. Prefer coherent replacement over compatibility scaffolding; update affected consumers and describe resets or breaking changes.
- In the Mission Control workspace, read only relevant `CODE_CLEANUP_PLAN.md` rows and source files. Do not preload historical audits, full indexes or optional adapter documentation.
- Prefer one clear owner and authoritative representation. Delete superseded paths and forwarding layers; do not split files to meet numeric limits.
- Inspect platform and affected clients together for transport, authentication or schema changes. Preserve required authorization and browser security behavior.
- Keep agent write scopes disjoint when delegating; integrate and review centrally.
- Use `environment.toml` for worktree startup. Check UI changes against that worktree's running application.
- Keep generated diagnostics outside tracked source. Run checks relevant to the change and report actual outcomes and limitations; never claim unrun checks passed.
- Web merge protections are intentionally disabled during prototype development (user direction, 2026-09-09). Keep CI validation and dedicated-worktree PRs; do not reinstate approval/digest gates without user direction. Deployment approvals remain separate. See docs/prototype-merge-policy.md.
