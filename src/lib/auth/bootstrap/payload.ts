import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingRecord } from "@/types/recordsExecution";
import { normalizePlanningRecords } from "./planning";
import { normalizeBootstrapCatalogRecords } from "./payload-catalog";
import { normalizeBootstrapReports } from "./payload-reports";
import { normalizeBootstrapTaskBlockers } from "./task-blockers";
import { normalizeBootstrapTaskDependencies } from "./task-dependencies";
import type { LegacyBootstrapPayload } from "./shared";

function normalizeMeetingRecords(source: BootstrapPayload["meetings"]): MeetingRecord[] {
  return (source ?? []).map((meeting, index) => {
    const date = meeting.date || meeting.startDateTime?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const time = meeting.time || (meeting.startDateTime?.includes("T") ? meeting.startDateTime.slice(11, 16) : "");

    return {
      ...meeting,
      id: meeting.id || `meeting-${index + 1}`,
      title: meeting.title || `Meeting ${index + 1}`,
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

export function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  const source = payload as LegacyBootstrapPayload;
  const planning = normalizePlanningRecords(source);
  const catalog = normalizeBootstrapCatalogRecords(source, planning);
  const reports = normalizeBootstrapReports(source, planning);

  return {
    seasons: planning.seasons,
    projects: planning.projects,
    workstreams: planning.workstreams,
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
    taskDependencies: normalizeBootstrapTaskDependencies(source),
    taskBlockers: normalizeBootstrapTaskBlockers(source),
    reports: reports.reports,
    reportFindings: reports.reportFindings,
    qaReports: reports.qaReports,
    testResults: reports.testResults,
    qaFindings: reports.qaFindings,
    testFindings: reports.testFindings,
    designIterations: source.designIterations ?? [],
    risks: source.risks ?? [],
    tasks: planning.tasks,
    workLogs: catalog.workLogs,
    meetings: normalizeMeetingRecords(source.meetings),
    attendanceRecords: source.attendanceRecords ?? [],
    purchaseItems: catalog.purchaseItems,
    manufacturingItems: catalog.manufacturingItems,
    qaReviews: source.qaReviews ?? [],
    escalations: source.escalations ?? [],
    actions: source.actions ?? [],
    favoriteViews: source.favoriteViews ?? [],
  };
}
