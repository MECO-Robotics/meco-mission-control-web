import { useCallback, useEffect, useRef } from "react";

import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { buildEmptyQaReportPayload, buildEmptyTestResultPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";

export type AppWorkspaceReportModalActions = ReturnType<typeof useAppWorkspaceReportModalActions>;

export function useAppWorkspaceReportModalActions(model: AppWorkspaceModel) {
  const returnToDetails = useRef<(() => void) | null>(null);
  const reportIsOpen = Boolean(model.workLogModalMode || model.qaReportModalMode || model.milestoneReportModalMode);

  // Successful submissions close through their own handlers; dismissal and save both
  // return to the record that launched this action without stacking dialogs.
  useEffect(() => {
    if (!reportIsOpen && returnToDetails.current) {
      const restore = returnToDetails.current;
      returnToDetails.current = null;
      restore();
    }
  }, [reportIsOpen]);

  const leaveTaskDetails = useCallback((taskId?: string) => {
    returnToDetails.current = taskId ? () => model.setActiveTimelineTaskDetailId(taskId) : null;
    model.setActiveTimelineTaskDetailId(null);
    model.setTaskModalMode(null);
    model.setWorkLogModalMode(null);
    model.setQaReportModalMode(null);
    model.setMilestoneReportModalMode(null);
  }, [model]);

  const openCreateWorkLogModal = useCallback((taskId?: string) => {
    const draft = buildEmptyWorkLogPayload(model.scopedBootstrap, model.activePersonFilter.length === 1 ? model.activePersonFilter[0] : null);
    leaveTaskDetails(taskId);
    model.setWorkLogDraft({ ...draft, taskId: taskId ?? draft.taskId });
    model.setWorkLogModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeWorkLogModal = useCallback(() => model.setWorkLogModalMode(null), [model]);

  const openCreateQaReportModal = useCallback((taskId?: string) => {
    const draft = buildEmptyQaReportPayload(model.scopedBootstrap, model.activePersonFilter.length === 1 ? model.activePersonFilter[0] : null);
    const task = model.scopedBootstrap.tasks.find((candidate) => candidate.id === (taskId ?? draft.taskId));
    leaveTaskDetails(taskId);
    model.setQaReportDraft({ ...draft, taskId: task?.id ?? "", projectId: task?.projectId ?? draft.projectId, workstreamId: task?.workstreamId ?? null, milestoneId: null, targetRiskId: task?.targetRiskId ?? null });
    model.setQaReportModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeQaReportModal = useCallback(() => model.setQaReportModalMode(null), [model]);

  const openCreateMilestoneReportModal = useCallback((milestoneId?: string, onReturn?: () => void) => {
    const draft = buildEmptyTestResultPayload(model.scopedBootstrap);
    const milestone = model.scopedBootstrap.milestones.find((candidate) => candidate.id === (milestoneId ?? draft.milestoneId));
    leaveTaskDetails();
    returnToDetails.current = onReturn ?? null;
    model.setMilestoneReportDraft({ ...draft, milestoneId: milestone?.id ?? "", projectId: milestone?.projectIds[0] ?? draft.projectId, taskId: null, workstreamId: null });
    model.setMilestoneReportFindings("");
    model.setMilestoneReportModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeMilestoneReportModal = useCallback(() => {
    model.setMilestoneReportModalMode(null);
    model.setMilestoneReportFindings("");
  }, [model]);

  return { closeMilestoneReportModal, closeQaReportModal, closeWorkLogModal, openCreateMilestoneReportModal, openCreateQaReportModal, openCreateWorkLogModal };
}
