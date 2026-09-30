import { useCallback } from "react";

import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createQaReportRecord, createTestResultRecord, createWorkLogRecord } from "@/lib/auth/records/reporting";
import { localTodayDate } from "@/lib/dateUtils";
import type { QaReportPayload, TestResultPayload, WorkLogPayload } from "@/types/payloads";

export type AppWorkspaceReportSubmitActions = ReturnType<typeof useAppWorkspaceReportSubmitActions>;

function getUniqueValidMemberIds(candidateIds: string[] | null | undefined, model: AppWorkspaceModel) {
  return Array.from(
    new Set(
      (candidateIds ?? []).filter((participantId) =>
        model.bootstrap.members.some((member) => member.id === participantId),
      ),
    ),
  );
}

export function useAppWorkspaceReportSubmitActions(model: AppWorkspaceModel) {
  const handleWorkLogSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingWorkLog(true);
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
      await model.loadWorkspace();
      model.setWorkLogModalMode(null);
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingWorkLog(false);
    }
  }, [model]);

  const handleQaReportSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingQaReport(true);
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
      const reportDate = model.qaReportDraft.createdAt ?? localTodayDate();
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
        reviewedAt: model.qaReportDraft.reviewedAt ?? null,
        status: model.qaReportDraft.status,
        evidenceNotes: model.qaReportDraft.evidenceNotes?.trim() || "",
        photoUrl: model.qaReportDraft.photoUrl ?? "",
      };

      await createQaReportRecord(payload, model.handleUnauthorized);
      await model.loadWorkspace();
      model.setQaReportModalMode(null);

    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingQaReport(false);
    }
  }, [model]);

  const handleMilestoneReportSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingMilestoneReport(true);
    model.setDataMessage(null);

    try {
      const milestoneRef = model.milestoneReportDraft.targetRefs.find((ref) => ref.kind === "milestone");
      const milestoneExists = model.bootstrap.milestones.some((item) => item.id === milestoneRef?.id);
      if (!milestoneExists) {
        model.setDataMessage("Please choose a real milestone before saving the milestone report.");
        return;
      }

      const normalizedSummary = model.milestoneReportDraft.summary.trim();
      if (normalizedSummary.length < 2) {
        model.setDataMessage("Please provide a report summary before saving.");
        return;
      }

      const findings: string[] = Array.from(
        new Set(
          model.milestoneReportFindings
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        ),
      );

      const milestone = model.bootstrap.milestones.find((candidate) => candidate.id === milestoneRef?.id) ?? null;
      const reportDate = model.milestoneReportDraft.createdAt ?? localTodayDate();
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
        reviewedAt: model.milestoneReportDraft.reviewedAt ?? null,
        evidenceNotes: model.milestoneReportDraft.evidenceNotes ?? "",
        status: model.milestoneReportDraft.status,
        photoUrl: model.milestoneReportDraft.photoUrl ?? "",
      };

      await createTestResultRecord(payload, model.handleUnauthorized);
      await model.loadWorkspace();
      model.setMilestoneReportModalMode(null);
      model.setMilestoneReportFindings("");
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingMilestoneReport(false);
    }
  }, [model]);

  return {
    handleMilestoneReportSubmit,
    handleQaReportSubmit,
    handleWorkLogSubmit,
  };
}
