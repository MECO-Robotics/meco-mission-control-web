# Engineering risk review: committee prototype

## Goal and scope

A build lead can identify and assess an unresolved engineering concern on a mechanism even when no task is blocked or mitigation task exists. They can distinguish the concern, affected work, reported and supporting evidence, temporary repair, mitigation action, verification, and explicit milestone commitments. Blocked tasks remain independently discoverable.

This is an opt-in interactive prototype at `/?view=work-risks&risk-prototype=engineering`. The ordinary Risks view is unchanged. The prototype reuses the actual shell, shared topbar, theme tokens, filters, pagination, dropdowns and dialogs. Its module loads only when requested.

**Current records** reads the normalized bootstrap without mutation callbacks. Proposed repair and verification fields remain Not recorded. **Review scenarios** contains explicitly illustrative examples; edits and verification actions remain in memory and reset on reload. No API, schema, seed or persistence change is included.

## Committee and evidence

Two independent GPT-6 Luna members researched domain/data and visual/interaction design. The primary agent integrated their recommendations and built the prototype. Both Luna members then independently critiqued the rendered prototype and source against the committee rubric; the primary agent consolidated corrections and verified the result.

The initial data review found six risks, all open and explicitly marked as blocking work, with no named owner or mitigation due date. That sample overemphasizes task blockers. The contract supports source, affected targets, status, severity, mitigation and generic milestone requirements, but does not record temporary repairs or structured verification evidence. These absences are displayed, not inferred from report wording.

Research informed the design, rather than imposing an external compliance process:

- [NASA technical risk management](https://www.nasa.gov/reference/6-4-technical-risk-management/) supports treating a concern, response and ongoing tracking as separate parts of risk management.
- [NASA technical review guidance](https://nodis3.gsfc.nasa.gov/displayAll.cfm?Internal_ID=N_PR_7123_001C_&page_name=all#SECTION_5) informs the committee's emphasis on explicit criteria and review actions.
- [Shneiderman's information visualization paper](https://drum.lib.umd.edu/items/155a868e-fb83-4115-9899-9187ea8c0498) informs overview, filtering and selected detail.
- [W3C use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and [keyboard operation](https://www.w3.org/WAI/WCAG22/Understanding/keyboard) inform labeled counts, non-color cues and native controls.

## Concepts considered

| Concept | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Mechanism concern overview with separate task context | Finds concerns without task blockage and compares affected mechanisms | Must distinguish per-mechanism counts from unique concerns | Selected |
| Concern-first list with existing task charts | Simple and direct | Leaves the overview dominated by tasks | Rejected as insufficient |
| Milestone-first review timeline | Organizes explicit review commitments | Sparse associations can suggest unsupported readiness or gates | Kept as supporting context |

The selected representation puts severity-coded concern bars first, task counts in a separately labeled column, and concerns in their own queue. A blocked-task preview and direct task-list entry remain visible. Milestones are supporting context, collapsed at narrow widths so the first concern remains visible. Area expansion is explicit rather than a clipped internal scroll.

## Critique and corrections

- A false `blocksWork` field now reads **No work block recorded**, avoiding an unsupported permission to proceed.
- Source and supporting evidence retain distinct roles and record kinds; unavailable evidence remains unavailable.
- All milestone links and requirement conditions are retained. A generic required custom condition stays linked context. Only an explicit required `workflow-state=resolved` condition is shown as required concern clearance. Scenario commitments are explicitly authored examples.
- A concern linked to multiple mechanisms remains one queue record; editing preserves all selected mechanisms and milestone links.
- Completion of a mitigation action does not resolve the concern. Example resolution requires criteria plus recorded verification evidence and an explicit resolution action, guarded at the transition as well as the control.
- The source selector uses the shared dropdown. Mobile milestone details collapse; mechanism groups have Show all / Show fewer controls. Other attached records remain available in selected context.

## Acceptance proof

The prototype's focused model tests cover explicit subject attribution, source/supporting deduplication, unavailable references, exact milestone conditions and multiple links, incidental schedule exclusion, unknown fields, independent task pressure, and unique per-mechanism counts. Browser walkthroughs cover:

1. Suspected fragile mount without mitigation or work blockage.
2. Temporary intake repair complete while the concern and verification stay open.
3. Action completion followed by separate verification and explicit resolution.
4. A single concern affecting multiple mechanisms and multiple milestones.
5. Required clearance versus a required generic test-plan review.
6. Missing evidence, owner, action, milestone and verification information.
7. Keyboard chart selection, stable overview totals, pagination, empty scopes, mobile and both themes.
8. Current/scenario separation, no API writes, reset on ordinary reload, and unchanged ordinary Risks.

## Product decisions before promotion

The prototype does not add a production repair/verification schema, acceptance authority, attachments upload or audited clearance workflow. Promote those concepts intentionally after evaluating the representation. Free text in an example verification form demonstrates the interaction; it is not independent proof of an engineering test. Current risk status and task status remain authoritative and separate.

The prototype supports concern clearance milestones, not readiness forecasts, probability estimates, automatic acceptance, or a general readiness score. The removed Risk response matrix remains absent.
