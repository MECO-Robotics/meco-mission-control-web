import type { BootstrapPayload } from "@/types/bootstrap";

import { buildEmptyQaReportPayload, buildEmptyTestResultPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";
import { getSinglePersonFilterId } from "@/app/state/workspaceMemberRoleUtils";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

export function reconcileWorkLogAndReports(
  state: AppWorkspaceState,
  scopedPayload: BootstrapPayload,
) {
  if (state.workLogModalMode === "create") {
    state.setWorkLogDraft(
      buildEmptyWorkLogPayload(scopedPayload, getSinglePersonFilterId(state.activePersonFilter)),
    );
  }

  if (state.qaReportModalMode === "create") {
    state.setQaReportDraft(
      buildEmptyQaReportPayload(scopedPayload, getSinglePersonFilterId(state.activePersonFilter)),
    );
  }

  if (state.milestoneReportModalMode === "create") {
    state.setMilestoneReportDraft(buildEmptyTestResultPayload(scopedPayload));
    state.setMilestoneReportFindings("");
  }
}
