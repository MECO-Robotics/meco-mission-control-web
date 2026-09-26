import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingRecord } from "@/types/recordsExecution";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";
import { normalizeBootstrapCatalogRecords } from "./payload-catalog";
import { normalizeBootstrapReports } from "./payload-reports";
import { normalizeBootstrapTaskBlockers } from "./task-blockers";

function normalizeMeetingRecords(source: BootstrapPayload["meetings"]): MeetingRecord[] {
  return (source ?? []).map((meeting) => {
    const { date, time } = meeting;

    return {
      ...meeting,
      meetingType: meeting.meetingType ?? "general",
      projectIds: meeting.projectIds ?? [],
      date,
      time,
      startDateTime: meeting.startDateTime ?? (time ? `${date}T${time}` : date),
      endDateTime: meeting.endDateTime ?? null,
      location: meeting.location ?? "",
      description: meeting.description ?? "",
      rsvpsYes: meeting.rsvpsYes ?? 0,
      rsvpsMaybe: meeting.rsvpsMaybe ?? 0,
      openSignIns: meeting.openSignIns ?? 0,
    };
  });
}

export function normalizeBootstrapPayload(source: BootstrapPayload): BootstrapPayload {
  const catalog = normalizeBootstrapCatalogRecords(source);
  const reports = normalizeBootstrapReports(source);

  return {
    seasons: source.seasons,
    projects: source.projects,
    workstreams: source.workstreams.map((workstream, index) => ({
      ...workstream,
      color: resolveWorkspaceColor(workstream.color, `${workstream.projectId}:${workstream.id}`, index),
      description: workstream.description ?? "",
      isArchived: workstream.isArchived ?? false,
    })),
    members: catalog.members,
    subsystems: catalog.subsystems,
    disciplines: source.disciplines ?? [],
    mechanisms: catalog.mechanisms,
    materials: catalog.materials,
    artifacts: catalog.artifacts,
    partDefinitions: catalog.partDefinitions,
    partInstances: catalog.partInstances,
    milestones: catalog.milestones,
    milestoneRequirements: source.milestoneRequirements ?? [],
    taskDependencies: source.taskDependencies ?? [],
    taskBlockers: normalizeBootstrapTaskBlockers(source),
    reports: reports.reports,
    reportFindings: reports.reportFindings,
    qaRequests: source.qaRequests ?? [],
    designIterations: source.designIterations ?? [],
    risks: source.risks ?? [],
    tasks: source.tasks.map((task) => ({
      ...task,
      targetRiskId: source.risks.find((risk) => risk.mitigationTaskId === task.id)?.id ?? null,
      checklistItems: task.checklistItems ?? [],
      isBlocked: task.isBlocked ?? false,
      isWaitingOnDependency: task.isWaitingOnDependency ?? false,
    })),
    workLogs: catalog.workLogs,
    meetings: normalizeMeetingRecords(source.meetings),
    attendanceRecords: source.attendanceRecords ?? [],
    purchaseItems: catalog.purchaseItems,
    manufacturingItems: catalog.manufacturingItems,
    qaReviews: source.qaReviews ?? [],
    escalations: source.escalations ?? [],
    actions: source.actions ?? [],
  };
}
