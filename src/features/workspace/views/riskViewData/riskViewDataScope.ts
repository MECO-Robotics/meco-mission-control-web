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
import { buildRiskViewSupplySignals } from "./riskViewSupplySignals";
import { countStaleTasks } from "./riskViewTaskFreshness";

export type { BlockerBreakdown, HealthStatus } from "./riskViewMetricsUtils";

interface BuildRiskViewScopeDataArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
}

export function buildRiskViewScopeData({
  activePersonFilter,
  bootstrap,
}: BuildRiskViewScopeDataArgs) {
  const now = new Date();
  const nowTimestamp = now.getTime();
  const weekStart = startOfWeekTimestamp(now);
  const pools = buildScopedRiskViewPools({ activePersonFilter, bootstrap });
  const {
    scopedReports,
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
  } = pools;

  const plannedHours = scopedTasks.reduce(
    (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
    0,
  );
  const loggedHours = scopedWorkLogs.reduce(
    (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
    0,
  );
  const remainingPlannedHours = Math.max(0, plannedHours - loggedHours);
  const hoursLoggedRate = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, hoursLoggedRate * 100))}%`;
  const totalTaskCount = scopedTasks.length;
  const completedTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
  const taskCompletionRate = totalTaskCount > 0 ? completedTaskCount / totalTaskCount : 0;
  const taskCompletionWidth = `${Math.max(0, Math.min(100, taskCompletionRate * 100))}%`;
  const waitingForQaTasks = scopedTasks.filter((task) => task.status === "waiting-for-qa");
  const qaWaitingCount = waitingForQaTasks.length;
  const openBlockersByTaskId = buildOpenBlockersByTaskId(
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
  let unresolvedBlockerCount = 0;
  let oldestBlockerAgeDays: number | null = null;
  openBlockersByTaskId.forEach((blockers) => {
    unresolvedBlockerCount += blockers.length;
    blockers.forEach((blocker) => {
      blockerBreakdown[classifyBlocker(blocker)] += 1;
      const timestamp = parseTimestamp(blocker.createdAt);
      if (timestamp !== null) {
        const ageDays = toAgeDays(timestamp, nowTimestamp);
        oldestBlockerAgeDays = Math.max(oldestBlockerAgeDays ?? ageDays, ageDays);
      }
    });
  });

  const lastActivityByTaskId = buildLastActivityByTaskId({
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
    scopedReports,
    openBlockersByTaskId,
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
  const { staleCount: staleTaskCount, unavailableCount: staleTaskUnavailableCount } = countStaleTasks({
    lastActivityByTaskId,
    nowTimestamp,
    tasks: scopedTasks,
    thresholdDays: staleTaskThresholdDays,
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
      task.subsystemIds.includes(subsystem.id),
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
      task.mechanismIds.includes(mechanism.id),
    nowTimestamp,
  );

  const qaPassCount = scopedReports.filter(
    (report) => report.result === "pass" && report.mentorApproved,
  ).length;

  const supply = buildRiskViewSupplySignals({ activePersonFilter, bootstrap, scopedTasks });
  const activeSubsystemCount = subsystemMetrics.filter((metric) => metric.taskCount > 0).length;
  const activeMechanismCount = mechanismMetrics.filter((metric) => metric.taskCount > 0).length;
  const untouchedMechanismCount = Math.max(0, bootstrap.mechanisms.length - activeMechanismCount);
  const staleSubsystemCount = subsystemMetrics.filter(
    (metric) =>
      metric.taskCount > 0 &&
      metric.lastActivityAgeDays !== null &&
      metric.lastActivityAgeDays >= staleTaskThresholdDays,
  ).length;
  const logsThisWeekHours = scopedWorkLogs.reduce((sum, workLog) => {
    const timestamp = parseTimestamp(workLog.date);
    if (timestamp === null || timestamp < weekStart) {
      return sum;
    }

    return sum + Math.max(0, Number(workLog.hours) || 0);
  }, 0);

  const expectedProgressRate = buildExpectedProgressRate(scopedTasks, nowTimestamp);
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
    supplySignals: supply.supplySignals,
    unresolvedBlockerCount,
  });

  const metrics = {
    activeMechanismCount,
    activeSubsystemCount,
    blockerBreakdown,
    buildHealthActions: healthActions,
    buildHealthReasons: healthReasons,
    buildHealthStatus,
    clampedCompletionWidth,
    completedTaskCount,
    expectedProgressRate,
    hoursLoggedRate,
    loggedHours,
    logsThisWeekHours,
    lowStockMaterials: supply.lowStockMaterials,
    mechanismMetrics,
    mentorActionRequiredCount,
    oldestBlockerAgeDays,
    oldestQaWaitingAgeDays,
    ownerlessTaskCount,
    pendingPurchaseCount: supply.pendingPurchaseCount,
    planStatus,
    plannedHours,
    qaPassCount,
    qaWaitingCount,
    remainingPlannedHours,
    staleSubsystemCount,
    staleTaskCount,
    staleTaskThresholdDays,
    staleTaskUnavailableCount,
    studentRevisionRequiredCount,
    subsystemMetrics,
    supplySignals: supply.supplySignals,
    taskCompletionRate,
    taskCompletionWidth,
    scopedTaskCount: totalTaskCount,
    totalMechanismCount: bootstrap.mechanisms.length,
    totalSubsystemCount: bootstrap.subsystems.length,
    untouchedMechanismCount,
    unresolvedBlockerCount,
  };

  return { pools, metrics };
}

export type RiskMetricsData = ReturnType<typeof buildRiskViewScopeData>["metrics"];
