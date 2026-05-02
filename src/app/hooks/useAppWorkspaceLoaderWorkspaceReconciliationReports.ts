import type { BootstrapPayload } from "@/types";

import {
  buildEmptyQaReportPayload,
  buildEmptyTestResultPayload,
  buildEmptyWorkLogPayload,
} from "@/lib/appUtils";
import { getSinglePersonFilterId } from "@/app/state/workspaceStateUtils";
import type { AppWorkspaceLoaderModel, WorkspaceReconciliationState } from "@/app/hooks/useAppWorkspaceLoaderWorkspaceTypes";

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

  if (model.eventReportModalMode === "create") {
    state.setEventReportDraft(buildEmptyTestResultPayload(scopedPayload));
    state.setEventReportFindings("");
  }
}
