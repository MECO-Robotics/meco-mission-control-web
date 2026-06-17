import type { QaReportPayload, ReportPayload, TestResultPayload, WorkLogPayload } from "@/types/payloads";
import type { BootstrapPayload } from "@/types/bootstrap";
import { localTodayDate } from "@/lib/dateUtils";

export function buildEmptyWorkLogPayload(
  bootstrap: BootstrapPayload,
  defaultParticipantId: string | null = null,
): WorkLogPayload {
  const participantId =
    defaultParticipantId &&
    bootstrap.members.some((member) => member.id === defaultParticipantId)
      ? defaultParticipantId
      : bootstrap.members[0]?.id ?? null;

  return {
    taskId: bootstrap.tasks[0]?.id ?? "",
    date: localTodayDate(),
    hours: 1,
    participantIds: participantId ? [participantId] : [],
    notes: "",
    photoUrl: "",
  };
}

export function buildEmptyReportPayload(
  bootstrap: BootstrapPayload,
  reportType: ReportPayload["reportType"],
  defaults: {
    taskId?: string | null;
    milestoneId?: string | null;
    projectId?: string;
    workstreamId?: string | null;
    createdByMemberId?: string | null;
    result?: string;
    summary?: string;
    notes?: string;
    photoUrl?: string;
    participantIds?: string[];
    mentorApproved?: boolean;
    reviewedAt?: string;
    title?: string;
    status?: ReportPayload["status"];
    findings?: string[];
    targetRiskId?: string | null;
    proposedRiskSeverity?: ReportPayload["proposedRiskSeverity"];
    proposedRiskStatus?: ReportPayload["proposedRiskStatus"];
  } = {},
): ReportPayload {
  const today = localTodayDate();
  const task = defaults.taskId
    ? bootstrap.tasks.find((candidate) => candidate.id === defaults.taskId) ?? null
    : bootstrap.tasks[0] ?? null;
  const milestone = defaults.milestoneId
    ? bootstrap.milestones.find((candidate) => candidate.id === defaults.milestoneId) ?? null
    : bootstrap.milestones[0] ?? null;
  const resolvedProjectId =
    defaults.projectId ??
    task?.projectId ??
    milestone?.projectIds?.[0] ??
    bootstrap.projects[0]?.id ??
    "";
  const resolvedWorkstreamId =
    defaults.workstreamId !== undefined ? defaults.workstreamId : task?.workstreamId ?? null;

  return {
    reportType,
    projectId: resolvedProjectId,
    taskId: defaults.taskId ?? task?.id ?? null,
    milestoneId: defaults.milestoneId ?? milestone?.id ?? null,
    workstreamId: resolvedWorkstreamId,
    createdByMemberId: defaults.createdByMemberId ?? bootstrap.members[0]?.id ?? null,
    result: defaults.result ?? "pass",
    summary: defaults.summary ?? "",
    notes: defaults.notes ?? "",
    photoUrl: defaults.photoUrl ?? "",
    createdAt: today,
    participantIds: defaults.participantIds ?? [],
    mentorApproved: defaults.mentorApproved ?? false,
    reviewedAt: defaults.reviewedAt ?? today,
    title: defaults.title ?? "",
    status: defaults.status ?? "pass",
    findings: defaults.findings ?? [],
    targetRiskId: defaults.targetRiskId ?? null,
    proposedRiskSeverity: defaults.proposedRiskSeverity ?? null,
    proposedRiskStatus: defaults.proposedRiskStatus ?? null,
  };
}

export function buildEmptyQaReportPayload(
  bootstrap: BootstrapPayload,
  defaultParticipantId: string | null = null,
): QaReportPayload {
  const task = bootstrap.tasks[0] ?? null;
  const participantId =
    defaultParticipantId &&
    bootstrap.members.some((member) => member.id === defaultParticipantId)
      ? defaultParticipantId
      : bootstrap.members[0]?.id ?? null;

  return buildEmptyReportPayload(bootstrap, "QA", {
    taskId: task?.id ?? "",
    projectId: task?.projectId ?? bootstrap.projects[0]?.id ?? "",
    workstreamId: task?.workstreamId ?? null,
    participantIds: participantId ? [participantId] : [],
    result: "pass",
    mentorApproved: false,
    notes: "",
    reviewedAt: localTodayDate(),
    photoUrl: "",
    targetRiskId: task?.targetRiskId ?? null,
    proposedRiskSeverity: null,
    proposedRiskStatus: null,
  });
}

export function buildEmptyTestResultPayload(bootstrap: BootstrapPayload): TestResultPayload {
  const milestone = bootstrap.milestones[0] ?? null;

  return buildEmptyReportPayload(bootstrap, "MilestoneTest", {
    milestoneId: milestone?.id ?? "",
    projectId: milestone?.projectIds?.[0] ?? bootstrap.projects[0]?.id ?? "",
    result: "pass",
    summary: "",
    notes: "",
    title: "",
    status: "pass",
    findings: [],
    photoUrl: "",
  });
}
