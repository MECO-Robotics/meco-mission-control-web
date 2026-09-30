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
    returnToDetails.current = model.taskEditor.leaveTaskDetails(taskId);
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
    const task = model.scopedBootstrap.tasks.find((candidate) => candidate.id === taskId) ?? model.scopedBootstrap.tasks[0];
    leaveTaskDetails(taskId);
    model.setQaReportDraft({ ...draft, targetRefs: task ? [{ kind: "task", id: task.id }] : [], projectId: task?.projectId ?? draft.projectId });
    model.setQaReportModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeQaReportModal = useCallback(() => model.setQaReportModalMode(null), [model]);

  const openCreateMilestoneReportModal = useCallback((milestoneId?: string, onReturn?: () => void) => {
    const draft = buildEmptyTestResultPayload(model.scopedBootstrap);
    const defaultMilestoneId = draft.targetRefs.find((ref) => ref.kind === "milestone")?.id;
    const milestone = model.scopedBootstrap.milestones.find((candidate) => candidate.id === (milestoneId ?? defaultMilestoneId));
    leaveTaskDetails();
    returnToDetails.current = onReturn ?? null;
    model.setMilestoneReportDraft({ ...draft, targetRefs: milestone ? [{ kind: "milestone", id: milestone.id }] : [], projectId: milestone?.projectIds[0] ?? draft.projectId });
    model.setMilestoneReportFindings("");
    model.setMilestoneReportModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeMilestoneReportModal = useCallback(() => {
    model.setMilestoneReportModalMode(null);
    model.setMilestoneReportFindings("");
  }, [model]);

  return { closeMilestoneReportModal, closeQaReportModal, closeWorkLogModal, openCreateMilestoneReportModal, openCreateQaReportModal, openCreateWorkLogModal };
}
