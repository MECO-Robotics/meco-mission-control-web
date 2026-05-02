// @ts-nocheck
import { useCallback } from "react";

import {
  buildEmptyQaReportPayload,
  buildEmptyTestResultPayload,
  buildEmptyWorkLogPayload,
  toErrorMessage,
} from "@/lib/appUtils";
import { createQaReportRecord, createTestResultRecord, createWorkLogRecord, createRiskRecord, deleteRiskRecord, updateRiskRecord } from "@/lib/auth";
import { localTodayDate } from "@/lib/dateUtils";
import type { AppWorkspaceModel } from "@/app/useAppWorkspaceModel";
import type { QaReportPayload, TestResultPayload, WorkLogPayload, RiskPayload } from "@/types";

export type AppWorkspaceReportActions = ReturnType<typeof useAppWorkspaceReportActions>;

export function useAppWorkspaceReportActions(model: AppWorkspaceModel) {
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

  const openCreateEventReportModal = useCallback(() => {
    model.setEventReportDraft(buildEmptyTestResultPayload(model.scopedBootstrap));
    model.setEventReportFindings("");
    model.setEventReportModalMode("create");
  }, [model]);

  const closeEventReportModal = useCallback(() => {
    model.setEventReportModalMode(null);
    model.setEventReportFindings("");
  }, [model]);

  const handleWorkLogSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    model.setIsSavingWorkLog(true);
    model.setDataMessage(null);

    try {
      const taskExists = model.bootstrap.tasks.some((task) => task.id === model.workLogDraft.taskId);
      if (!taskExists) {
        model.setDataMessage("Please choose a real task before saving the work log.");
        return;
      }

      const participantIds: string[] = Array.from(
        new Set(
          model.workLogDraft.participantIds.filter((participantId) =>
            model.bootstrap.members.some((member) => member.id === participantId),
          ),
        ),
      );
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

  const handleQaReportSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    model.setIsSavingQaReport(true);
    model.setDataMessage(null);

    try {
      const taskExists = model.bootstrap.tasks.some((task) => task.id === model.qaReportDraft.taskId);
      if (!taskExists) {
        model.setDataMessage("Please choose a real task before saving the QA report.");
        return;
      }

      const participantIds: string[] = Array.from(
        new Set(
          (model.qaReportDraft.participantIds ?? []).filter((participantId) =>
            model.bootstrap.members.some((member) => member.id === participantId),
          ),
        ),
      );
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
        eventId: null,
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

  const handleEventReportSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    model.setIsSavingEventReport(true);
    model.setDataMessage(null);

    try {
      const eventExists = model.bootstrap.events.some((item) => item.id === model.eventReportDraft.eventId);
      if (!eventExists) {
        model.setDataMessage("Please choose a real event before saving the event report.");
        return;
      }

      const normalizedTitle = (model.eventReportDraft.title ?? "").trim();
      if (normalizedTitle.length < 2) {
        model.setDataMessage("Please provide an event report title before saving.");
        return;
      }

      const findings: string[] = Array.from(
        new Set(
          model.eventReportFindings
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        ),
      );

      const event = model.bootstrap.events.find((candidate) => candidate.id === model.eventReportDraft.eventId) ?? null;
      const reportDate = model.eventReportDraft.createdAt ?? localTodayDate();
      const payload: TestResultPayload = {
        reportType: "EventTest",
        projectId: event?.projectIds[0] ?? model.bootstrap.projects[0]?.id ?? "",
        taskId: null,
        eventId: event?.id ?? "",
        workstreamId: null,
        createdByMemberId: model.eventReportDraft.createdByMemberId ?? null,
        result: model.eventReportDraft.result,
        summary: normalizedTitle,
        notes: findings.join("\n"),
        createdAt: reportDate,
        participantIds: model.eventReportDraft.participantIds ?? [],
        mentorApproved: model.eventReportDraft.mentorApproved ?? false,
        reviewedAt: model.eventReportDraft.reviewedAt ?? reportDate,
        title: normalizedTitle,
        status: model.eventReportDraft.status,
        findings,
        photoUrl: model.eventReportDraft.photoUrl ?? "",
      };

      await createTestResultRecord(payload, model.handleUnauthorized);
      await model.loadWorkspace();
      model.setEventReportModalMode(null);
      model.setEventReportFindings("");
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingEventReport(false);
    }
  }, [model]);

  const normalizeRiskPayload = useCallback((payload: RiskPayload): RiskPayload => {
    const mitigationTaskId =
      typeof payload.mitigationTaskId === "string" &&
      payload.mitigationTaskId.trim().length > 0
        ? payload.mitigationTaskId.trim()
        : null;

    return {
      ...payload,
      title: payload.title.trim(),
      detail: payload.detail.trim(),
      sourceId: payload.sourceId.trim(),
      attachmentId: payload.attachmentId.trim(),
      mitigationTaskId,
    };
  }, []);

  const handleCreateRisk = useCallback(
    async (payload: RiskPayload) => {
      model.setDataMessage(null);

      try {
        await createRiskRecord(normalizeRiskPayload(payload), model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
        throw error;
      }
    },
    [model, normalizeRiskPayload],
  );

  const handleUpdateRisk = useCallback(
    async (riskId: string, payload: RiskPayload) => {
      model.setDataMessage(null);

      try {
        await updateRiskRecord(riskId, normalizeRiskPayload(payload), model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
        throw error;
      }
    },
    [model, normalizeRiskPayload],
  );

  const handleDeleteRisk = useCallback(
    async (riskId: string) => {
      model.setDataMessage(null);

      try {
        await deleteRiskRecord(riskId, model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
        throw error;
      }
    },
    [model],
  );

  return {
    closeEventReportModal,
    closeQaReportModal,
    closeWorkLogModal,
    handleCreateRisk,
    handleDeleteRisk,
    handleEventReportSubmit,
    handleQaReportSubmit,
    handleUpdateRisk,
    handleWorkLogSubmit,
    openCreateEventReportModal,
    openCreateQaReportModal,
    openCreateWorkLogModal,
  };
}
