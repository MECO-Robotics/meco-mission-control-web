import { useCallback } from "react";

import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { buildEmptyQaReportPayload, buildEmptyTestResultPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";

export type AppWorkspaceReportModalActions = ReturnType<typeof useAppWorkspaceReportModalActions>;

export function useAppWorkspaceReportModalActions(model: AppWorkspaceModel) {
  const openCreateWorkLogModal = useCallback(() => {
    model.setWorkLogDraft(
      buildEmptyWorkLogPayload(
        model.scopedBootstrap,
        model.activePersonFilter.length === 1 ? model.activePersonFilter[0] : null,
      ),
    );
    model.setWorkLogModalMode("create");
  }, [model]);

  const closeWorkLogModal = useCallback(() => {
    model.setWorkLogModalMode(null);
  }, [model]);

  const openCreateQaReportModal = useCallback(() => {
    model.setQaReportDraft(
      buildEmptyQaReportPayload(
        model.scopedBootstrap,
        model.activePersonFilter.length === 1 ? model.activePersonFilter[0] : null,
      ),
    );
    model.setQaReportModalMode("create");
  }, [model]);

  const closeQaReportModal = useCallback(() => {
    model.setQaReportModalMode(null);
  }, [model]);

  const openCreateMilestoneReportModal = useCallback(() => {
    model.setMilestoneReportDraft(buildEmptyTestResultPayload(model.scopedBootstrap));
    model.setMilestoneReportFindings("");
    model.setMilestoneReportModalMode("create");
  }, [model]);

  const closeMilestoneReportModal = useCallback(() => {
    model.setMilestoneReportModalMode(null);
    model.setMilestoneReportFindings("");
  }, [model]);

  return {
    closeMilestoneReportModal,
    closeQaReportModal,
    closeWorkLogModal,
    openCreateMilestoneReportModal,
    openCreateQaReportModal,
    openCreateWorkLogModal,
  };
}
