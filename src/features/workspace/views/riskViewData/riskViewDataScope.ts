import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { buildScopeMetrics } from "../RiskMetrics";
import {
  DEFAULT_STALE_TASK_DAYS,
  buildExpectedProgressRate,
  buildHealthActions,
  buildHealthReasons,
  buildPlanStatus,
  classifyBlocker,
  deriveBuildHealthStatus,
  latestReportByTaskId,
  parseTimestamp,
  startOfWeekTimestamp,
  toAgeDays,
  type BlockerBreakdown,
} from "./riskViewMetricsUtils";
import {
  buildScopeMetricInputs,
  buildLastActivityByTaskId,
  buildOpenBlockersByTaskId,
  buildScopedRiskViewPools,
} from "./riskViewScopeSelectors";
import type { RiskViewScopeData } from "./riskViewScopeTypes";

export type { BlockerBreakdown, HealthStatus } from "./riskViewMetricsUtils";

interface BuildRiskViewScopeDataArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
}

export function buildRiskViewScopeData({
  activePersonFilter,
  bootstrap,
}: BuildRiskViewScopeDataArgs): RiskViewScopeData {
  const now = new Date();
  const nowTimestamp = now.getTime();
  const weekStart = startOfWeekTimestamp(now);
  const {
    scopedReportIds,
    scopedReports,
    scopedRisks,
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
  } = buildScopedRiskViewPools({ activePersonFilter, bootstrap });

  const plannedHours = scopedTasks.reduce(
    (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
    0,
  );
  const loggedHours = scopedWorkLogs.reduce(
    (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
    0,
  );
  const remainingPlannedHours = Math.max(0, plannedHours - loggedHours);
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const hoursLoggedRate = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, hoursLoggedRate * 100))}%`;
  const totalTaskCount = scopedTasks.length;
  const completedTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
  const openTaskCount = Math.max(0, totalTaskCount - completedTaskCount);
  const taskCompletionRate = totalTaskCount > 0 ? completedTaskCount / totalTaskCount : 0;
  const taskCompletionWidth = `${Math.max(0, Math.min(100, taskCompletionRate * 100))}%`;
  const waitingForQaTasks = scopedTasks.filter((task) => task.status === "waiting-for-qa");
  const qaWaitingCount = waitingForQaTasks.length;
  const { openBlockers, openBlockersByTaskId } = buildOpenBlockersByTaskId(
    scopedTaskIds,
    bootstrap,
  );

  const blockerBreakdown: BlockerBreakdown = {
    designIssue: 0,
    lostBrokenPart: 0,
    lostBrokenTool: 0,
    supplyMaterial: 0,
    other: 0,
  };
  openBlockers.forEach((blocker) => {
    blockerBreakdown[classifyBlocker(blocker)] += 1;
  });
  const oldestBlockerAgeDays = openBlockers.reduce<number | null>((oldest, blocker) => {
    const timestamp = parseTimestamp(blocker.createdAt);
    if (timestamp === null) {
      return oldest;
    }

    const ageDays = toAgeDays(timestamp, nowTimestamp);
    if (oldest === null || ageDays > oldest) {
      return ageDays;
    }

    return oldest;
  }, null);

  const lastActivityByTaskId = buildLastActivityByTaskId({
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
    scopedReports,
    openBlockers,
  });

  const qaLatestByTaskId = latestReportByTaskId(scopedReports);
  let mentorActionRequiredCount = 0;
  let studentRevisionRequiredCount = 0;
  const waitingTaskAges = waitingForQaTasks
    .map((task) => {
      const latestQaReport = qaLatestByTaskId.get(task.id);
      if (latestQaReport) {
        if (latestQaReport.mentorApproved !== true) {
          mentorActionRequiredCount += 1;
        }

        if ((latestQaReport.result ?? "").toLowerCase() !== "pass") {
          studentRevisionRequiredCount += 1;
        }
      }

      const timestamp = lastActivityByTaskId.get(task.id);
      return typeof timestamp === "number" ? toAgeDays(timestamp, nowTimestamp) : null;
    })
    .filter((age): age is number => age !== null);
  const oldestQaWaitingAgeDays = waitingTaskAges.length > 0 ? Math.max(...waitingTaskAges) : null;

  const staleTaskThresholdDays = DEFAULT_STALE_TASK_DAYS;
  // TODO: Task records do not currently expose updatedAt. This uses best-effort activity timestamps and should switch to task.updatedAt when available.
  let staleTaskCount = 0;
  let staleTaskUnavailableCount = 0;
  scopedTasks
    .filter((task) => task.status !== "complete")
    .forEach((task) => {
      const activityTimestamp = lastActivityByTaskId.get(task.id);
      if (typeof activityTimestamp !== "number") {
        staleTaskUnavailableCount += 1;
        return;
      }

      if (toAgeDays(activityTimestamp, nowTimestamp) >= staleTaskThresholdDays) {
        staleTaskCount += 1;
      }
    });

  const ownerlessTaskCount = scopedTasks.filter(
    (task) => task.status !== "complete" && !task.ownerId && (task.assigneeIds ?? []).length === 0,
  ).length;
  const {
    membersById,
    projectsById,
    qaPassTaskIds,
    subsystemsById,
    workHoursByTaskId,
  } = buildScopeMetricInputs({
    bootstrap,
    scopedReports,
    scopedWorkLogs,
  });

  const subsystemMetrics = buildScopeMetrics(
    bootstrap.subsystems,
    scopedTasks,
    workHoursByTaskId,
    qaPassTaskIds,
    openBlockersByTaskId,
    lastActivityByTaskId,
    (subsystem) => `Project: ${projectsById[subsystem.projectId]?.name ?? "Unknown project"}`,
    (subsystem) => {
      const mechanismCount = bootstrap.mechanisms.filter(
        (mechanism) => mechanism.subsystemId === subsystem.id,
      ).length;
      return `${mechanismCount} mechanism${mechanismCount === 1 ? "" : "s"}`;
    },
    (subsystem) => {
      const leadId = subsystem.responsibleEngineerId ?? subsystem.mentorIds[0] ?? null;
      return leadId ? membersById[leadId]?.name ?? "Unknown lead" : null;
    },
    (task, subsystem) =>
      task.subsystemId === subsystem.id || (task.subsystemIds ?? []).includes(subsystem.id),
    nowTimestamp,
  );

  const mechanismMetrics = buildScopeMetrics(
    bootstrap.mechanisms,
    scopedTasks,
    workHoursByTaskId,
    qaPassTaskIds,
    openBlockersByTaskId,
    lastActivityByTaskId,
    (mechanism) => `Subsystem: ${subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem"}`,
    (mechanism) => {
      const partInstanceCount = bootstrap.partInstances.filter(
        (partInstance) => partInstance.mechanismId === mechanism.id,
      ).length;
      return `${partInstanceCount} part instance${partInstanceCount === 1 ? "" : "s"}`;
    },
    (mechanism) => {
      const parentSubsystem = subsystemsById[mechanism.subsystemId];
      const leadId = parentSubsystem?.responsibleEngineerId ?? parentSubsystem?.mentorIds[0] ?? null;
      return leadId ? membersById[leadId]?.name ?? "Unknown lead" : null;
    },
    (task, mechanism) =>
      task.mechanismId === mechanism.id || (task.mechanismIds ?? []).includes(mechanism.id),
    nowTimestamp,
  );

  const qaPassCount = scopedReports.filter(
    (report) => report.result === "pass" && report.mentorApproved,
  ).length;

  const scopedPurchaseIds = new Set(scopedTasks.flatMap((task) => task.linkedPurchaseIds ?? []));
  const purchasePool =
    activePersonFilter.length > 0 && scopedPurchaseIds.size > 0
      ? bootstrap.purchaseItems.filter((purchase) => scopedPurchaseIds.has(purchase.id))
      : bootstrap.purchaseItems;
  const deliveredPurchases = purchasePool.filter((purchase) => purchase.status === "delivered").length;
  const pendingPurchaseCount = purchasePool.filter((purchase) => purchase.status !== "delivered").length;
  const lowStockMaterials = bootstrap.materials.filter(
    (material) => material.onHandQuantity <= material.reorderPoint,
  ).length;
  const attendanceHours = (bootstrap.attendanceRecords ?? []).reduce(
    (sum, record) => sum + record.totalHours,
    0,
  );
  const activeSubsystemCount = subsystemMetrics.filter((metric) => metric.taskCount > 0).length;
  const activeMechanismCount = mechanismMetrics.filter((metric) => metric.taskCount > 0).length;
  const untouchedMechanismCount = Math.max(0, bootstrap.mechanisms.length - activeMechanismCount);
  const staleSubsystemCount = subsystemMetrics.filter(
    (metric) =>
      metric.taskCount > 0 &&
      metric.lastActivityAgeDays !== null &&
      metric.lastActivityAgeDays >= staleTaskThresholdDays,
  ).length;
  const supplySignals = pendingPurchaseCount + lowStockMaterials;
  const logsThisWeekHours = scopedWorkLogs.reduce((sum, workLog) => {
    const timestamp = parseTimestamp(workLog.date);
    if (timestamp === null || timestamp < weekStart) {
      return sum;
    }

    return sum + Math.max(0, Number(workLog.hours) || 0);
  }, 0);

  const expectedProgressRate = buildExpectedProgressRate(scopedTasks, nowTimestamp);
  const unresolvedBlockerCount = openBlockers.length;
  const planStatus = buildPlanStatus({
    expectedProgressRate,
    hoursLoggedRate,
    plannedHours,
    qaWaitingCount,
    totalTaskCount,
    unresolvedBlockerCount,
  });
  const buildHealthStatus = deriveBuildHealthStatus({
    planStatus,
    qaWaitingCount,
    staleTaskCount,
    taskCompletionRate,
    totalTaskCount,
    unresolvedBlockerCount,
  });
  const healthReasons = buildHealthReasons({
    completedTaskCount,
    ownerlessTaskCount,
    qaWaitingCount,
    staleTaskCount,
    totalTaskCount,
    unresolvedBlockerCount,
  });
  const healthActions = buildHealthActions({
    ownerlessTaskCount,
    qaWaitingCount,
    staleTaskCount,
    staleTaskThresholdDays,
    supplySignals,
    unresolvedBlockerCount,
  });

  return {
    activeMechanismCount,
    activeSubsystemCount,
    attendanceHours,
    blockerBreakdown,
    blockerCount: unresolvedBlockerCount,
    buildHealthActions: healthActions,
    buildHealthReasons: healthReasons,
    buildHealthStatus,
    clampedCompletionWidth,
    completionRate: taskCompletionRate,
    completedTaskCount,
    deliveredPurchases,
    expectedProgressRate,
    filteredRowsBase: scopedRisks,
    hoursLoggedRate,
    loggedHours,
    logsThisWeekHours,
    lowStockMaterials,
    maxMetricHours,
    mechanismMetrics,
    mentorActionRequiredCount,
    oldestBlockerAgeDays,
    oldestQaWaitingAgeDays,
    openTaskCount,
    ownerlessTaskCount,
    pendingPurchaseCount,
    planStatus,
    plannedHours,
    qaPassCount,
    qaWaitingCount,
    remainingPlannedHours,
    scopedReportIds,
    scopedReports,
    scopedRisks,
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
    staleSubsystemCount,
    staleTaskCount,
    staleTaskThresholdDays,
    staleTaskUnavailableCount,
    studentRevisionRequiredCount,
    subsystemMetrics,
    supplySignals,
    taskCompletionRate,
    taskCompletionWidth,
    totalTaskCount,
    untouchedMechanismCount,
    unresolvedBlockerCount,
    waitingForQaCount: qaWaitingCount,
  };
}
