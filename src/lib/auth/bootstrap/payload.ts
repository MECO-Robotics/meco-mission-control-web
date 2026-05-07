import type { BootstrapPayload } from "@/types/bootstrap";
import { normalizePlanningRecords } from "./planning";
import { normalizeBootstrapCatalogRecords } from "./payload-catalog";
import { normalizeBootstrapReports } from "./payload-reports";
import { normalizeBootstrapTaskBlockers } from "./task-blockers";
import { normalizeBootstrapTaskDependencies } from "./task-dependencies";
import type { LegacyBootstrapPayload } from "./shared";

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
    meetings: source.meetings ?? [],
    attendanceRecords: source.attendanceRecords ?? [],
    purchaseItems: catalog.purchaseItems,
    manufacturingItems: catalog.manufacturingItems,
    qaReviews: source.qaReviews ?? [],
    escalations: source.escalations ?? [],
  };
}
