import type { BootstrapPayload } from "@/types/bootstrap";

import { buildEmptyQaReportPayload, buildEmptyTestResultPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";
import { getSinglePersonFilterId } from "@/app/state/workspaceMemberRoleUtils";
import type { AppWorkspaceLoaderModel, WorkspaceReconciliationState } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function reconcileWorkLogAndReports(
  state: WorkspaceReconciliationState,
  model: AppWorkspaceLoaderModel,
  scopedPayload: BootstrapPayload,
) {
  if (model.workLogModalMode === "create") {
    state.setWorkLogDraft(
      buildEmptyWorkLogPayload(scopedPayload, getSinglePersonFilterId(model.activePersonFilter)),
    );
  }

  if (model.qaReportModalMode === "create") {
    state.setQaReportDraft(
      buildEmptyQaReportPayload(scopedPayload, getSinglePersonFilterId(model.activePersonFilter)),
    );
  }

  if (model.milestoneReportModalMode === "create") {
    state.setMilestoneReportDraft(buildEmptyTestResultPayload(scopedPayload));
    state.setMilestoneReportFindings("");
  }
}
