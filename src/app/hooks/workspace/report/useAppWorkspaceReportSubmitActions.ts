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
      const taskExists = model.bootstrap.tasks.some((task) => task.id === model.qaReportDraft.taskId);
      if (!taskExists) {
        model.setDataMessage("Please choose a real task before saving the QA report.");
        return;
      }

      const participantIds = getUniqueValidMemberIds(model.qaReportDraft.participantIds, model);
      if (participantIds.length === 0) {
        model.setDataMessage("Please choose at least one participant before saving the QA report.");
        return;
      }

      const task = model.bootstrap.tasks.find((candidate) => candidate.id === model.qaReportDraft.taskId) ?? null;
      const reportDate = model.qaReportDraft.createdAt ?? localTodayDate();
      const payload: QaReportPayload = {
        reportType: "QA",
        projectId: task?.projectId ?? model.bootstrap.projects[0]?.id ?? "",
        taskId: task?.id ?? "",
        milestoneId: null,
        workstreamId: task?.workstreamId ?? null,
        createdByMemberId: model.qaReportDraft.createdByMemberId ?? null,
        result: model.qaReportDraft.result,
        summary: model.qaReportDraft.summary.trim(),
        participantIds,
        mentorApproved: model.qaReportDraft.mentorApproved ?? false,
        notes: model.qaReportDraft.notes.trim(),
        createdAt: reportDate,
        reviewedAt: model.qaReportDraft.reviewedAt ?? reportDate,
        title: model.qaReportDraft.title?.trim(),
        status: model.qaReportDraft.status,
        findings: model.qaReportDraft.findings ?? [],
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
      const milestoneExists = model.bootstrap.milestones.some((item) => item.id === model.milestoneReportDraft.milestoneId);
      if (!milestoneExists) {
        model.setDataMessage("Please choose a real milestone before saving the milestone report.");
        return;
      }

      const normalizedTitle = (model.milestoneReportDraft.title ?? "").trim();
      if (normalizedTitle.length < 2) {
        model.setDataMessage("Please provide an milestone report title before saving.");
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

      const milestone = model.bootstrap.milestones.find((candidate) => candidate.id === model.milestoneReportDraft.milestoneId) ?? null;
      const reportDate = model.milestoneReportDraft.createdAt ?? localTodayDate();
      const payload: TestResultPayload = {
        reportType: "MilestoneTest",
        projectId: milestone?.projectIds[0] ?? model.bootstrap.projects[0]?.id ?? "",
        taskId: null,
        milestoneId: milestone?.id ?? "",
        workstreamId: null,
        createdByMemberId: model.milestoneReportDraft.createdByMemberId ?? null,
        result: model.milestoneReportDraft.result,
        summary: normalizedTitle,
        notes: findings.join("\n"),
        createdAt: reportDate,
        participantIds: model.milestoneReportDraft.participantIds ?? [],
        mentorApproved: model.milestoneReportDraft.mentorApproved ?? false,
        reviewedAt: model.milestoneReportDraft.reviewedAt ?? reportDate,
        title: normalizedTitle,
        status: model.milestoneReportDraft.status,
        findings,
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
