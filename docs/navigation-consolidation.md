# Navigation consolidation

Implemented in dedicated web, mobile and platform worktrees on `feature/navigation-consolidation`, based on development revisions `eaa1670`, `86a6c39` and `264aa49` respectively.

## Decision

Consolidate the current implementation around four destinations instead of replacing the UI framework. Existing task, manufacturing, risk and evidence behavior remains useful; the duplication is primarily navigation, collection rendering and report launch pages. Remove superseded renderers and wrappers rather than preserve parallel page systems.

The app uses the original sidebar implementation: Home shortcut, expandable Work/Resources/Team sections, icon subitems, compact flyouts, and its existing responsive overlay. The topbar displays the current page title. The native mobile app retains labeled bottom navigation.

| Area | Views | Consolidation |
| --- | --- | --- |
| Home | Priority work, upcoming milestones, Needs attention | One attention row per source record; Project health expands on demand |
| Work | Tasks, Schedule, Risks, Activity | Schedule offers Calendar, Timeline and Agenda; Activity filters work logs, changes, QA and milestone results |
| Resources | Materials/Documents, Parts, Purchases, Manufacturing, Structure | Manufacturing uses a process filter; installed parts live under their definition; CAD import opens from Structure |
| Team | People, Attendance | People combines directory, presence, availability and workload |

Tasks opens first in Work. Robot-only Parts and Manufacturing require a robot project. Structure requires a selected project and uses the robot map or the non-robot workflow view. All-project Resources exposes Materials and Purchases. Non-robot projects use Documents and Purchases. Home remains available without a season; other collections require season data. Help and account controls remain utilities.

Task details use a drawer on desktop and fill the narrow viewport. Logging work and submitting QA open from the task; milestone results open from the milestone. The originating detail returns after save or cancel, and editors protect unsaved changes. Collection filters survive destination changes within the current season/project; changing scope resets these local filters. URLs retain canonical destination, presentation and scope. Task details support Back, Forward and refresh; browser Back restores page scroll.

The former Dashboard, Readiness, Config and Reports destinations, the work-log status board, the separate part-mapping page and the standalone People workload/availability pages have been removed. Their retained behavior is owned by the views above.

See [navigation-consolidation.md](../README.md#current-navigation-model) for the cross-client scope, validation and contract changes.

## Client differences

Mobile Schedule offers Agenda and Timeline. Mobile does not have document/project scope or an audit-change feed in its bootstrap, so it does not advertise Documents or Changes. Mobile attendance remains explicitly session-only because the current platform has no attendance-write API. Mobile timers, offline log queues and retry remain intact, including after Refresh.

## Contract and reset behavior

Favorites have been removed entirely: no star control, sidebar favorites, client mutation, saved bootstrap field, or API endpoint. Previous favorite selections are discarded; no business-data reset is required.

No business-schema migration, database reset or reseed command is required. Development's existing seed-on-start behavior is unchanged; persistence verification uses the production snapshot path.

## Validation

Each repository uses `npm run verify`. Web and mobile compare their mirrored bootstrap contract to the new platform source using `PLATFORM_BOOTSTRAP_CONTRACT_SOURCE_PATH` while the commits remain local. The integration manifest pins platform `fbf974f0a1e318f940a026fc63a47c6a54f64f91` and mobile `908695fe2103d44666055497ea00c08a774b786e`. Publish those commits to development before publishing the web integration; the pins currently refer to local commits.

Web browser checks cover four-area navigation at desktop and narrow widths, robot and non-robot scope availability, presentation refresh, task detail Back/Forward/refresh, page scroll restoration, contextual work/QA/milestone forms, and filter retention. Regression tests cover attention deduplication, contextual preselection/return, parts search through instances, all-role attendance and manufacturing process gates.

Mobile verifies canonical navigation, refresh preserving timer/drafts, offline work-log behavior and an Android Hermes export. No Android emulator or physical device is available in this workspace; native visual testing remains outstanding.

## Verified result

- Web: 122 suites / 525 tests, 11 workflow checks, contract comparison, types, lint and bundle passed. The subsequent removal of unused page styles also passed bundling. Existing Vite chunk-size advisory remains.
- Mobile: full verification passed with 154 tests and 6 workflow checks; final timer/draft refresh regression and contract comparison passed; Android Hermes export and Metro bundle passed.
- Platform: verification passed with 263 tests; one PostgreSQL integration test was skipped because `TEST_DATABASE_URL` was unavailable.
- Desktop and 390px browser checks reported no page errors. Task and People search filters survive navigation Back; task details and exact milestone details restore from history and refresh.

Known pre-existing limitation: dense all-project Timeline milestone markers can overlap and intercept pointer clicks. Keyboard activation and Schedule → Agenda provide access; timeline geometry was not rewritten in this consolidation.
