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
    targetRefs?: ReportPayload["targetRefs"];
    projectId?: string;
    createdByMemberId?: string | null;
    requestedById?: string | null;
    result?: string | null;
    summary?: string;
    notes?: string;
    photoUrl?: string;
    participantIds?: string[];
    mentorId?: string | null;
    reviewedAt?: string;
    status?: ReportPayload["status"];
    evidenceNotes?: string;
  } = {},
): ReportPayload {
  const today = localTodayDate();
  const task = bootstrap.tasks[0] ?? null;
  const milestone = bootstrap.milestones[0] ?? null;
  const resolvedProjectId =
    defaults.projectId ??
    task?.projectId ??
    milestone?.projectIds[0] ??
    bootstrap.projects[0]?.id ??
    "";
  const defaultTarget = reportType === "qa" && task
    ? [{ kind: "task" as const, id: task.id }]
    : (reportType === "practice" || reportType === "competition") && milestone
      ? [{ kind: "milestone" as const, id: milestone.id }]
      : [];

  return {
    reportType,
    projectId: resolvedProjectId,
    targetRefs: defaults.targetRefs ?? defaultTarget,
    createdByMemberId: defaults.createdByMemberId ?? bootstrap.members[0]?.id ?? null,
    result: defaults.result ?? "pass",
    summary: defaults.summary ?? "",
    notes: defaults.notes ?? "",
    photoUrl: defaults.photoUrl ?? "",
    createdAt: today,
    participantIds: defaults.participantIds ?? [],
    mentorId: defaults.mentorId ?? null,
    requestedById: defaults.requestedById ?? null,
    reviewedAt: defaults.reviewedAt ?? null,
    evidenceNotes: defaults.evidenceNotes ?? "",
    status: defaults.status ?? "draft",
  };
}

export function buildEmptyQaReportPayload(
  bootstrap: BootstrapPayload,
  defaultParticipantId: string | null = null,
): QaReportPayload {
  const participantId =
    defaultParticipantId &&
    bootstrap.members.some((member) => member.id === defaultParticipantId)
      ? defaultParticipantId
      : bootstrap.members[0]?.id ?? null;

  return buildEmptyReportPayload(bootstrap, "qa", {
    targetRefs: bootstrap.tasks[0] ? [{ kind: "task", id: bootstrap.tasks[0].id }] : [],
    projectId: bootstrap.tasks[0]?.projectId ?? bootstrap.projects[0]?.id ?? "",
    participantIds: participantId ? [participantId] : [],
    result: "pass",
    notes: "",
    reviewedAt: localTodayDate(),
    photoUrl: "",
  });
}

export function buildEmptyTestResultPayload(bootstrap: BootstrapPayload): TestResultPayload {
  const milestone = bootstrap.milestones[0] ?? null;

  return buildEmptyReportPayload(bootstrap, "practice", {
    targetRefs: milestone ? [{ kind: "milestone", id: milestone.id }] : [],
    projectId: milestone?.projectIds?.[0] ?? bootstrap.projects[0]?.id ?? "",
    result: null,
    summary: "",
    notes: "",
    status: "draft",
    photoUrl: "",
  });
}
