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

function buildEmptyReportBase(bootstrap: BootstrapPayload) {
  return {
    projectId: bootstrap.projects[0]?.id ?? "",
    targetRefs: [] as ReportPayload["targetRefs"],
    createdByMemberId: bootstrap.members[0]?.id ?? null,
    summary: "",
    notes: "",
    photoUrl: "",
    createdAt: new Date().toISOString(),
    participantIds: [] as string[],
    mentorId: null,
    requestedById: null,
    evidenceNotes: "",
    status: "draft" as const,
  };
}

export function buildEmptyQaReportPayload(
  bootstrap: BootstrapPayload,
  defaultParticipantId: string | null = null,
): QaReportPayload {
  const participantId = defaultParticipantId && bootstrap.members.some((member) => member.id === defaultParticipantId)
    ? defaultParticipantId : bootstrap.members[0]?.id ?? null;
  return {
    ...buildEmptyReportBase(bootstrap),
    reportType: "qa",
    targetRefs: bootstrap.tasks[0] ? [{ kind: "task", id: bootstrap.tasks[0].id }] : [],
    projectId: bootstrap.tasks[0]?.projectId ?? bootstrap.projects[0]?.id ?? "",
    participantIds: participantId ? [participantId] : [],
    result: "pass",
    reviewedById: null,
    reviewedAt: null,
  };
}

export function buildEmptyTestResultPayload(bootstrap: BootstrapPayload): TestResultPayload {
  const milestone = bootstrap.milestones[0] ?? null;
  return {
    ...buildEmptyReportBase(bootstrap),
    reportType: "practice",
    targetRefs: milestone ? [{ kind: "milestone", id: milestone.id }] : [],
    projectId: milestone?.projectIds[0] ?? bootstrap.projects[0]?.id ?? "",
    result: null,
  };
}
