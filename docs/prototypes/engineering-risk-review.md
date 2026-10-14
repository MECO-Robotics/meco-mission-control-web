# Engineering risk review: committee prototype

## Goal and scope

A build lead can identify and assess an unresolved engineering concern on a mechanism even when no task is blocked or mitigation task exists. They can distinguish the concern, affected work, reported and supporting evidence, temporary repair, mitigation action, verification, and explicit milestone commitments. Blocked tasks remain independently discoverable.

This is an opt-in interactive prototype at `/?view=work-risks&risk-prototype=engineering`. The ordinary Risks view is unchanged. The prototype reuses the actual shell, shared topbar, theme tokens, filters, pagination, dropdowns and dialogs. Its module loads only when requested.

**Current records** reads the normalized bootstrap without mutation callbacks. Proposed repair and verification fields remain Not recorded. **Review scenarios** contains explicitly illustrative examples; edits and verification actions remain in memory and reset on reload. No API, schema, seed or persistence change is included.

## Committee and evidence

The first committee used two independent Luna members for domain/data and visual/interaction research. The second pass uses two independent Sol members to challenge the hierarchy, compare alternative layouts and critique rendered results. The primary agent implements and verifies the integrated design. Research guidance informs this prototype rather than prescribing a particular layout.
The initial data review found six risks, all open and explicitly marked as blocking work, with no named owner or mitigation due date. That sample overemphasizes task blockers. The contract supports source, affected targets, status, severity, mitigation and generic milestone requirements, but does not record temporary repairs or structured verification evidence. These absences are displayed, not inferred from report wording.

Research informed the design, rather than imposing an external compliance process:

- [NASA technical risk management](https://www.nasa.gov/reference/6-4-technical-risk-management/) supports treating a concern, response and ongoing tracking as separate parts of risk management.
- [NASA technical review guidance](https://nodis3.gsfc.nasa.gov/displayAll.cfm?Internal_ID=N_PR_7123_001C_&page_name=all#SECTION_5) informs the committee's emphasis on explicit criteria and review actions.
- [Shneiderman's information visualization paper](https://drum.lib.umd.edu/items/155a868e-fb83-4115-9899-9187ea8c0498) informs overview, filtering and selected detail.
- [W3C use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and [keyboard operation](https://www.w3.org/WAI/WCAG22/Understanding/keyboard) inform labeled counts, non-color cues and native controls.

## Concern-first revision

The first prototype put a mechanism overview before the concern queue. It buried actual records below comparisons, especially on phones. The revised question is: which engineering condition needs review, what evidence exists, and what must happen before its recorded commitment?

| Concept | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Primary concern queue with analytical rail | Actual conditions come first; mechanism comparisons remain available beside the work | Selected review needs more width than the compact rail | Selected |
| Full-width concern ledger with analytics below | Maximum reading space | Desktop comparisons require scrolling | Alternative |
| Mechanism-grouped concern lists | Comparisons sit beside their conditions | Multiple mechanism links make placement and global severity ordering ambiguous | Rejected |

Wide screens retain the approximately 70% concern column and compact analytical rail. A compact blocked-task preview leads the right column, with graphs beneath it. The concern queue starts at the top of the left column. The preview lists up to three tasks and opens the full blocked-task list. Duplicate blocked-task entries below the milestone section are removed. The rail retains severity-coded mechanism comparisons and **Before each milestone**, naming actual concerns as **Must resolve** or **Linked only** with recorded dates. Selecting a concern replaces the graphs with a wider inspector beneath the blocked-task preview, never a third column. On compact screens, DOM and visual order are blocked tasks, graphs with milestone context, then engineering concerns; review uses the established drawer. This ordering reflects the user's refinement after the concern-first review.

Rows expose the actual condition/consequence, labeled severity and work effect, affected mechanism and owner, milestone linkage, mitigation action and named evidence reference. They are single review targets without nested interactive controls. The selected inspector receives keyboard focus; closing it returns focus to the originating row without resetting filters or pagination. Charts keep the same unique-count semantics and filter the queue through one shared-topbar selection.

The shared Filter menu contains the source selector alongside concern filters. Queue metadata always identifies **scenarios, not saved** or **current, read only**, including on the narrowest phones. Keeping the source choice inside filters avoids overflowing the single topbar. Example changes remain local and reset on reload.

[Google SRE monitoring guidance](https://sre.google/workbook/monitoring/) motivates matching dashboard content to the user's action and diagnostic questions. Its [distributed-systems monitoring chapter](https://sre.google/sre-book/monitoring-distributed-systems/) distinguishes short-term workarounds from long-term fixes. These are supporting principles; concern-first ordering is this committee's product judgment. [W3C focus-order guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) supports matching keyboard order to the meaningful reading sequence.

## Critique and corrections

- A false `blocksWork` field now reads **No work block recorded**, avoiding an unsupported permission to proceed.
- Source and supporting evidence retain distinct roles and record kinds; unavailable evidence remains unavailable.
- All milestone links and requirement conditions are retained. A generic required custom condition stays linked context. Only an explicit required `workflow-state=resolved` condition is shown as required concern clearance. Scenario commitments are explicitly authored examples.
- A concern linked to multiple mechanisms remains one queue record; editing preserves all selected mechanisms and milestone links.
- Completion of a mitigation action does not resolve the concern. Example resolution requires criteria plus recorded verification evidence and an explicit resolution action, guarded at the transition as well as the control.
- The source selector uses the shared dropdown. Compact screens put graphs above the concern queue; mechanism groups have Show all / Show fewer controls. Other attached records remain available in selected context.

## Acceptance proof

The prototype's focused model tests cover explicit subject attribution, source/supporting deduplication, unavailable references, exact milestone conditions and multiple links, incidental schedule exclusion, unknown fields, independent task pressure, and unique per-mechanism counts. Browser walkthroughs cover:

1. Suspected fragile mount without mitigation or work blockage.
2. Temporary intake repair complete while the concern and verification stay open.
3. Action completion followed by separate verification and explicit resolution.
4. A single concern affecting multiple mechanisms and multiple milestones.
5. Required clearance versus a required generic test-plan review.
6. Missing evidence, owner, action, milestone and verification information.
7. Responsive blocked-task/graph/concern ordering, keyboard review/focus return, chart selection, stable totals, pagination, empty scopes, mobile and both themes.
8. Current/scenario separation, no API writes, reset on ordinary reload, and unchanged ordinary Risks.

## Product decisions before promotion

The illustrative cracked-bracket example records an observation but has incomplete consequence rationale and no separately recorded corrective redesign action; its load-test task demonstrates verification work. This is a content/workflow gap to resolve before promotion, not evidence of a complete engineering response model.

The prototype does not add a production repair/verification schema, acceptance authority, attachments upload or audited clearance workflow. Promote those concepts intentionally after evaluating the representation. Free text in an example verification form demonstrates the interaction; it is not independent proof of an engineering test. Current risk status and task status remain authoritative and separate.

The prototype supports concern clearance milestones, not readiness forecasts, probability estimates, automatic acceptance, or a general readiness score. The removed Risk response matrix remains absent.
