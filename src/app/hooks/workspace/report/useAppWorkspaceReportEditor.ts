import { useCallback, useEffect, useRef } from "react";

import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { buildEmptyQaReportPayload, buildEmptyTestResultPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";

import { useCatalogEditorLifecycle } from "@/app/workspaceCatalog/useCatalogEditorLifecycle";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createQaReportRecord, createTestResultRecord, createWorkLogRecord } from "@/lib/auth/records/reporting";
import type { QaReportPayload, TestResultPayload, WorkLogPayload } from "@/types/payloads";

function getUniqueValidMemberIds(candidateIds: string[] | null | undefined, model: AppWorkspaceModel) {
  return Array.from(
    new Set(
      (candidateIds ?? []).filter((participantId) =>
        model.bootstrap.members.some((member) => member.id === participantId),
      ),
    ),
  );
}

export type AppWorkspaceReportEditor = ReturnType<typeof useAppWorkspaceReportEditor>;

export function useAppWorkspaceReportEditor(model: AppWorkspaceModel) {
  const lifecycle = useCatalogEditorLifecycle(model);
  const { resetEditor } = lifecycle;
  const { selectedProjectId, selectedSeasonId, setWorkLogModalMode, setQaReportModalMode, setMilestoneReportModalMode } = model;
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

  useEffect(() => {
    resetEditor();
    returnToDetails.current = null;
    setWorkLogModalMode(null);
    setQaReportModalMode(null);
    setMilestoneReportModalMode(null);
  }, [selectedProjectId, selectedSeasonId, setWorkLogModalMode, setQaReportModalMode, setMilestoneReportModalMode, resetEditor]);

  const leaveTaskDetails = useCallback((taskId?: string) => {
    resetEditor();
    returnToDetails.current = model.taskEditor.leaveTaskDetails(taskId);
    model.setWorkLogModalMode(null);
    model.setQaReportModalMode(null);
    model.setMilestoneReportModalMode(null);
  }, [model, resetEditor]);

  const openCreateWorkLogModal = useCallback((taskId?: string) => {
    const draft = buildEmptyWorkLogPayload(model.scopedBootstrap, model.activePersonFilter.length === 1 ? model.activePersonFilter[0] : null);
    leaveTaskDetails(taskId);
    model.setWorkLogDraft({ ...draft, taskId: taskId ?? draft.taskId });
    model.setWorkLogModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeWorkLogModal = useCallback(() => { resetEditor(); model.setWorkLogModalMode(null); }, [model, resetEditor]);

  const openCreateQaReportModal = useCallback((taskId?: string) => {
    const draft = buildEmptyQaReportPayload(model.scopedBootstrap, model.activePersonFilter.length === 1 ? model.activePersonFilter[0] : null);
    const task = model.scopedBootstrap.tasks.find((candidate) => candidate.id === taskId) ?? model.scopedBootstrap.tasks[0];
    leaveTaskDetails(taskId);
    model.setQaReportDraft({ ...draft, targetRefs: task ? [{ kind: "task", id: task.id }] : [], projectId: task?.projectId ?? draft.projectId });
    model.setQaReportModalMode("create");
  }, [leaveTaskDetails, model]);

  const closeQaReportModal = useCallback(() => { resetEditor(); model.setQaReportModalMode(null); }, [model, resetEditor]);

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
    resetEditor();
    model.setMilestoneReportModalMode(null);
    model.setMilestoneReportFindings("");
  }, [model, resetEditor]);

  const handleWorkLogSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!model.workLogModalMode) return;
    const operation = lifecycle.beginOperation();
    if (!operation) return;
    model.setDataMessage(null);

    try {
      const taskExists = model.bootstrap.tasks.some((task) => task.id === model.workLogDraft.taskId);
      if (!taskExists) {
        model.setDataMessage("Please choose a real task before saving the work log.");
        return;
      }

      const participantIds = getUniqueValidMemberIds(model.workLogDraft.participantIds, model);
      if (participantIds.length === 0) {
        model.setDataMessage("Please choose at least one participant before saving the work log.");
        return;
      }

      const payload: WorkLogPayload = {
        ...model.workLogDraft,
        notes: model.workLogDraft.notes.trim(),
        participantIds,
      };

      await createWorkLogRecord(payload, model.handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent()) closeWorkLogModal();
    } catch (error) {
      if (operation.isCurrent()) model.setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [model, lifecycle, closeWorkLogModal]);

  const handleQaReportSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!model.qaReportModalMode) return;
    const operation = lifecycle.beginOperation();
    if (!operation) return;
    model.setDataMessage(null);

    try {
      const taskRef = model.qaReportDraft.targetRefs.find((ref) => ref.kind === "task");
      const taskExists = model.bootstrap.tasks.some((task) => task.id === taskRef?.id);
      if (!taskExists) {
        model.setDataMessage("Please choose a real task before saving the QA report.");
        return;
      }

      const participantIds = getUniqueValidMemberIds(model.qaReportDraft.participantIds, model);
      if (participantIds.length === 0) {
        model.setDataMessage("Please choose at least one participant before saving the QA report.");
        return;
      }

      const task = model.bootstrap.tasks.find((candidate) => candidate.id === taskRef?.id) ?? null;
      const reportDate = model.qaReportDraft.createdAt;
      const payload: QaReportPayload = {
        reportType: "qa",
        projectId: task?.projectId ?? model.bootstrap.projects[0]?.id ?? "",
        targetRefs: task ? [{ kind: "task", id: task.id }] : [],
        createdByMemberId: model.qaReportDraft.createdByMemberId ?? null,
        requestedById: model.qaReportDraft.requestedById ?? null,
        mentorId: model.qaReportDraft.mentorId ?? null,
        result: model.qaReportDraft.result,
        summary: model.qaReportDraft.summary.trim(),
        participantIds,
        notes: model.qaReportDraft.notes.trim(),
        createdAt: reportDate,
        reviewedAt: model.qaReportDraft.reviewedAt,
        reviewedById: model.qaReportDraft.reviewedById,
        status: model.qaReportDraft.status,
        evidenceNotes: model.qaReportDraft.evidenceNotes?.trim() || "",
        photoUrl: model.qaReportDraft.photoUrl ?? "",
      };

      await createQaReportRecord(payload, model.handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent()) closeQaReportModal();

    } catch (error) {
      if (operation.isCurrent()) model.setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [model, lifecycle, closeQaReportModal]);

  const handleMilestoneReportSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!model.milestoneReportModalMode) return;
    const operation = lifecycle.beginOperation();
    if (!operation) return;
    model.setDataMessage(null);

    try {
      const milestoneRef = model.milestoneReportDraft.targetRefs.find((ref) => ref.kind === "milestone");
      const milestoneExists = model.bootstrap.milestones.some((item) => item.id === milestoneRef?.id);
      if (!milestoneExists) {
        model.setDataMessage("Please choose a real milestone before saving the milestone report.");
        return;
      }

      const normalizedSummary = model.milestoneReportDraft.summary.trim();

      const findings: string[] = Array.from(
        new Set(
          model.milestoneReportFindings
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        ),
      );

      const milestone = model.bootstrap.milestones.find((candidate) => candidate.id === milestoneRef?.id) ?? null;
      const reportDate = model.milestoneReportDraft.createdAt;
      const payload: TestResultPayload = {
        reportType: "practice",
        projectId: milestone?.projectIds[0] ?? model.bootstrap.projects[0]?.id ?? "",
        targetRefs: milestone ? [{ kind: "milestone", id: milestone.id }] : [],
        createdByMemberId: model.milestoneReportDraft.createdByMemberId ?? null,
        requestedById: model.milestoneReportDraft.requestedById ?? null,
        mentorId: model.milestoneReportDraft.mentorId ?? null,
        result: model.milestoneReportDraft.result,
        summary: normalizedSummary,
        notes: findings.join("\n"),
        createdAt: reportDate,
        participantIds: model.milestoneReportDraft.participantIds ?? [],
        evidenceNotes: model.milestoneReportDraft.evidenceNotes ?? "",
        status: model.milestoneReportDraft.status,
        photoUrl: model.milestoneReportDraft.photoUrl ?? "",
      };

      await createTestResultRecord(payload, model.handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent()) closeMilestoneReportModal();

    } catch (error) {
      if (operation.isCurrent()) model.setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [model, lifecycle, closeMilestoneReportModal]);

  return { handleWorkLogSubmit, handleQaReportSubmit, handleMilestoneReportSubmit,
    isSavingWorkLog: lifecycle.isSaving && Boolean(model.workLogModalMode),
    isSavingQaReport: lifecycle.isSaving && Boolean(model.qaReportModalMode),
    isSavingMilestoneReport: lifecycle.isSaving && Boolean(model.milestoneReportModalMode),
    closeMilestoneReportModal, closeQaReportModal, closeWorkLogModal, openCreateMilestoneReportModal, openCreateQaReportModal, openCreateWorkLogModal };
}
