import type { TaskRecord } from "@/types/recordsExecution";
import type { RiskRecord } from "@/types/recordsReporting";

import type { ScopeMetricRow } from "./riskMetricsTypes";

const CALENDAR_DAY_MS = 24 * 60 * 60 * 1000;

const RISK_SEVERITY_ORDER: Record<RiskRecord["severity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function computeAgeDays(value: string | null | undefined, now: number) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) {
    return null;
  }

  return Math.max(0, Math.floor((now - timestamp) / CALENDAR_DAY_MS));
}

function riskReasonLabel(risk: RiskRecord) {
  return risk.category.replaceAll("-", " ");
}

function selectMostSevereRisk(risks: RiskRecord[]) {
  return risks.reduce<RiskRecord | null>((selected, risk) => {
    if (!selected) {
      return risk;
    }

    const selectedOrder = RISK_SEVERITY_ORDER[selected.severity];
    const riskOrder = RISK_SEVERITY_ORDER[risk.severity];
    if (riskOrder > selectedOrder) {
      return risk;
    }

    return selected;
  }, null);
}

export function buildScopeMetrics<T extends { id: string; name: string }>(
  items: T[],
  tasks: TaskRecord[],
  workHoursByTaskId: Map<string, number>,
  qaPassTaskIds: Set<string>,
  openBlockersByTaskId: Map<string, RiskRecord[]>,
  lastActivityByTaskId: Map<string, number>,
  getSubtitle: (item: T) => string,
  getLinkedSummary: (item: T) => string,
  getOwnerLabel: (item: T) => string | null,
  matchesTask: (task: TaskRecord, item: T) => boolean,
  now = Date.now(),
) {
  return items
    .map((item) => {
      const scopedTasks = tasks.filter((task) => matchesTask(task, item));
      const completeTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
      const inProgressTaskCount = scopedTasks.filter((task) => task.status === "in-progress").length;
      const waitingForQaCount = scopedTasks.filter(
        (task) => task.status === "waiting-for-qa",
      ).length;
      const openBlockers = scopedTasks.flatMap(
        (task) => openBlockersByTaskId.get(task.id) ?? [],
      );
      const blockerCount = openBlockers.length;
      const mostSevereBlocker = selectMostSevereRisk(openBlockers);
      const oldestBlockerAgeDays = openBlockers.reduce<number | null>((oldest, risk) => {
        const ageDays = computeAgeDays(risk.createdAt, now);
        if (ageDays === null) {
          return oldest;
        }

        if (oldest === null || ageDays > oldest) {
          return ageDays;
        }

        return oldest;
      }, null);
      const plannedHours = scopedTasks.reduce(
        (sum, task) => sum + Math.max(0, Number(task.estimatedHours) || 0),
        0,
      );
      const loggedHours = scopedTasks.reduce(
        (sum, task) => sum + (workHoursByTaskId.get(task.id) ?? 0),
        0,
      );
      const qaPassCount = scopedTasks.filter((task) => qaPassTaskIds.has(task.id)).length;
      const latestActivityTimestamp = scopedTasks.reduce((latest, task) => {
        const activity = lastActivityByTaskId.get(task.id);
        if (typeof activity !== "number") {
          return latest;
        }

        return Math.max(latest, activity);
      }, Number.NEGATIVE_INFINITY);
      const lastActivityAgeDays = Number.isFinite(latestActivityTimestamp)
        ? Math.max(0, Math.floor((now - latestActivityTimestamp) / CALENDAR_DAY_MS))
        : null;
      const taskCompletionRate = completeTaskCount / Math.max(scopedTasks.length, 1);
      const mostSevereReason = mostSevereBlocker
        ? `Blocked by ${riskReasonLabel(mostSevereBlocker)}`
        : waitingForQaCount > 0
          ? "Waiting for QA"
          : scopedTasks.length > 0 && taskCompletionRate < 0.35
            ? "Low task completion"
            : null;

      return {
        id: item.id,
        name: item.name,
        subtitle: `${getSubtitle(item)} | ${getLinkedSummary(item)}`,
        taskCount: scopedTasks.length,
        activeTaskCount: scopedTasks.length - completeTaskCount,
        inProgressTaskCount,
        completeTaskCount,
        waitingForQaCount,
        blockerCount,
        plannedHours: Number(plannedHours.toFixed(1)),
        loggedHours: Number(loggedHours.toFixed(1)),
        taskCompletionRate: Number(taskCompletionRate.toFixed(2)),
        qaPassCount,
        lastActivityAgeDays,
        ownerLabel: getOwnerLabel(item),
        mostSevereReason,
        oldestBlockerAgeDays,
      } satisfies ScopeMetricRow;
    })
    .sort((left, right) => {
      const blockerOrder = right.blockerCount - left.blockerCount;
      if (blockerOrder !== 0) {
        return blockerOrder;
      }

      const qaOrder = right.waitingForQaCount - left.waitingForQaCount;
      if (qaOrder !== 0) {
        return qaOrder;
      }

      const activeOrder = right.activeTaskCount - left.activeTaskCount;
      if (activeOrder !== 0) {
        return activeOrder;
      }

      const completionOrder = left.taskCompletionRate - right.taskCompletionRate;
      if (completionOrder !== 0) {
        return completionOrder;
      }

      return left.name.localeCompare(right.name);
    });
}
