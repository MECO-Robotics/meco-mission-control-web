import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskRecord } from "@/types/recordsReporting";

import { buildScopeMetrics, type ScopeMetricRow } from "../RiskMetrics";

export interface RiskViewScopeData {
  activeMechanismCount: number;
  activeSubsystemCount: number;
  attendanceHours: number;
  blockerCount: number;
  clampedCompletionWidth: string;
  completionRate: number;
  completedTaskCount: number;
  deliveredPurchases: number;
  filteredRowsBase: RiskRecord[];
  loggedHours: number;
  lowStockMaterials: number;
  maxMetricHours: number;
  mechanismMetrics: ScopeMetricRow[];
  plannedHours: number;
  qaPassCount: number;
  scopedReportIds: Set<string>;
  scopedReports: BootstrapPayload["reports"];
  scopedRisks: RiskRecord[];
  scopedTaskIds: Set<string>;
  scopedTasks: BootstrapPayload["tasks"];
  scopedWorkLogs: BootstrapPayload["workLogs"];
  subsystemMetrics: ScopeMetricRow[];
  supplySignals: number;
  totalTaskCount: number;
  waitingForQaCount: number;
}

interface BuildRiskViewScopeDataArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
}

export function buildRiskViewScopeData({
  activePersonFilter,
  bootstrap,
}: BuildRiskViewScopeDataArgs): RiskViewScopeData {
  const scopedTasks =
    activePersonFilter.length > 0
      ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
      : bootstrap.tasks;
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedWorkLogs =
    activePersonFilter.length > 0
      ? bootstrap.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId))
      : bootstrap.workLogs;
  const scopedReports =
    activePersonFilter.length > 0
      ? bootstrap.reports.filter((report) => report.taskId && scopedTaskIds.has(report.taskId))
      : bootstrap.reports;
  const scopedReportIds = new Set(scopedReports.map((report) => report.id));
  const scopedRisks =
    activePersonFilter.length > 0
      ? bootstrap.risks.filter((risk) => {
          if (risk.mitigationTaskId && scopedTaskIds.has(risk.mitigationTaskId)) {
            return true;
          }

          return scopedReportIds.has(risk.sourceId);
        })
      : bootstrap.risks;

  const plannedHours = scopedTasks.reduce(
    (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
    0,
  );
  const loggedHours = scopedWorkLogs.reduce(
    (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
    0,
  );
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const completionRatio = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, completionRatio * 100))}%`;

  const projectsById = Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const));
  const workHoursByTaskId = new Map<string, number>();
  scopedWorkLogs.forEach((workLog) => {
    workHoursByTaskId.set(
      workLog.taskId,
      (workHoursByTaskId.get(workLog.taskId) ?? 0) + Math.max(0, Number(workLog.hours) || 0),
    );
  });

  const qaPassTaskIds = new Set<string>();
  scopedReports.forEach((report) => {
    if (report.result === "pass" && report.mentorApproved && report.taskId) {
      qaPassTaskIds.add(report.taskId);
    }
  });

  const subsystemMetrics = buildScopeMetrics(
    bootstrap.subsystems,
    scopedTasks,
    workHoursByTaskId,
    qaPassTaskIds,
    (subsystem) => `Project: ${projectsById[subsystem.projectId]?.name ?? "Unknown project"}`,
    (subsystem) => {
      const mechanismCount = bootstrap.mechanisms.filter(
        (mechanism) => mechanism.subsystemId === subsystem.id,
      ).length;
      return `${mechanismCount} mechanism${mechanismCount === 1 ? "" : "s"}`;
    },
    (task, subsystem) =>
      task.subsystemId === subsystem.id || (task.subsystemIds ?? []).includes(subsystem.id),
  );

  const mechanismMetrics = buildScopeMetrics(
    bootstrap.mechanisms,
    scopedTasks,
    workHoursByTaskId,
    qaPassTaskIds,
    (mechanism) => `Subsystem: ${bootstrap.subsystems.find((subsystem) => subsystem.id === mechanism.subsystemId)?.name ?? "Unknown subsystem"}`,
    (mechanism) => {
      const partInstanceCount = bootstrap.partInstances.filter(
        (partInstance) => partInstance.mechanismId === mechanism.id,
      ).length;
      return `${partInstanceCount} part instance${partInstanceCount === 1 ? "" : "s"}`;
    },
    (task, mechanism) =>
      task.mechanismId === mechanism.id || (task.mechanismIds ?? []).includes(mechanism.id),
  );

  const completedTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
  const waitingForQaCount = scopedTasks.filter((task) => task.status === "waiting-for-qa").length;
  const blockerCount = scopedTasks.reduce((sum, task) => sum + task.blockers.length, 0);
  const qaPassCount = scopedReports.filter(
    (report) => report.result === "pass" && report.mentorApproved,
  ).length;
  const deliveredPurchases = bootstrap.purchaseItems.filter(
    (purchase) => purchase.status === "delivered",
  ).length;
  const lowStockMaterials = bootstrap.materials.filter(
    (material) => material.onHandQuantity <= material.reorderPoint,
  ).length;
  const attendanceHours = (bootstrap.attendanceRecords ?? []).reduce(
    (sum, record) => sum + record.totalHours,
    0,
  );
  const activeSubsystemCount = subsystemMetrics.filter((metric) => metric.taskCount > 0).length;
  const activeMechanismCount = mechanismMetrics.filter((metric) => metric.taskCount > 0).length;
  const totalTaskCount = Math.max(scopedTasks.length, 1);
  const completionRate = completedTaskCount / totalTaskCount;
  const supplySignals = deliveredPurchases + lowStockMaterials;

  return {
    activeMechanismCount,
    activeSubsystemCount,
    attendanceHours,
    blockerCount,
    clampedCompletionWidth,
    completionRate,
    completedTaskCount,
    deliveredPurchases,
    filteredRowsBase: scopedRisks,
    loggedHours,
    lowStockMaterials,
    maxMetricHours,
    mechanismMetrics,
    plannedHours,
    qaPassCount,
    scopedReportIds,
    scopedReports,
    scopedRisks,
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
    subsystemMetrics,
    supplySignals,
    totalTaskCount,
    waitingForQaCount,
  };
}
