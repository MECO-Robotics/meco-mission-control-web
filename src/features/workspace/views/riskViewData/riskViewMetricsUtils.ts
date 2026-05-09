import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskBlockerRecord } from "@/types/recordsExecution";

const CALENDAR_DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const DEFAULT_STALE_TASK_DAYS = 5;

export type HealthStatus = "On Track" | "Behind" | "Ahead" | "At Risk";

export interface BlockerBreakdown {
  designIssue: number;
  lostBrokenPart: number;
  lostBrokenTool: number;
  supplyMaterial: number;
  other: number;
}

export function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(trimmedValue);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const monthIndex = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const localDate = new Date(year, monthIndex, day);

    if (
      localDate.getFullYear() !== year ||
      localDate.getMonth() !== monthIndex ||
      localDate.getDate() !== day
    ) {
      return null;
    }

    return localDate.getTime();
  }

  const timestamp = Date.parse(trimmedValue);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function toAgeDays(timestamp: number, now = Date.now()) {
  return Math.max(0, Math.floor((now - timestamp) / CALENDAR_DAY_MS));
}

export function startOfWeekTimestamp(now: Date) {
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  const day = (cursor.getDay() + 6) % 7;
  cursor.setDate(cursor.getDate() - day);
  return cursor.getTime();
}

export function classifyBlocker(blocker: TaskBlockerRecord): keyof BlockerBreakdown {
  const raw = `${blocker.blockerType} ${blocker.description}`.toLowerCase();

  if (raw.includes("tool") || blocker.blockerType === "artifact_instance") {
    return "lostBrokenTool";
  }

  if (raw.includes("part") || blocker.blockerType === "part_instance") {
    return "lostBrokenPart";
  }

  if (
    raw.includes("supply") ||
    raw.includes("material") ||
    raw.includes("vendor") ||
    raw.includes("purchase")
  ) {
    return "supplyMaterial";
  }

  if (
    raw.includes("design") ||
    blocker.blockerType === "task" ||
    blocker.blockerType === "milestone" ||
    blocker.blockerType === "workstream" ||
    blocker.blockerType === "mechanism"
  ) {
    return "designIssue";
  }

  return "other";
}

export function buildExpectedProgressRate(tasks: BootstrapPayload["tasks"], now = Date.now()) {
  const scheduleWindows = tasks
    .map((task) => {
      const start = parseTimestamp(task.startDate);
      const due = parseTimestamp(task.dueDate);
      if (start === null || due === null || due <= start) {
        return null;
      }

      return { due, start };
    })
    .filter((window): window is { due: number; start: number } => Boolean(window));

  if (scheduleWindows.length === 0) {
    return null;
  }

  const timelineStart = Math.min(...scheduleWindows.map((window) => window.start));
  const timelineEnd = Math.max(...scheduleWindows.map((window) => window.due));
  if (timelineEnd <= timelineStart) {
    return null;
  }

  const elapsedRatio = (now - timelineStart) / (timelineEnd - timelineStart);
  return Math.max(0, Math.min(1, elapsedRatio));
}

export function buildPlanStatus({
  expectedProgressRate,
  hoursLoggedRate,
  plannedHours,
  qaWaitingCount,
  totalTaskCount,
  unresolvedBlockerCount,
}: {
  expectedProgressRate: number | null;
  hoursLoggedRate: number;
  plannedHours: number;
  qaWaitingCount: number;
  totalTaskCount: number;
  unresolvedBlockerCount: number;
}): HealthStatus {
  if (unresolvedBlockerCount >= 8 || qaWaitingCount >= 5) {
    return "At Risk";
  }

  if (plannedHours <= 0 || totalTaskCount === 0) {
    return unresolvedBlockerCount === 0 && qaWaitingCount === 0 ? "On Track" : "Behind";
  }

  if (expectedProgressRate !== null) {
    const delta = hoursLoggedRate - expectedProgressRate;
    if (delta >= 0.1) {
      return "Ahead";
    }

    if (delta <= -0.2) {
      return "At Risk";
    }

    if (delta <= -0.08) {
      return "Behind";
    }
  }

  if (hoursLoggedRate >= 0.85 && unresolvedBlockerCount === 0 && qaWaitingCount === 0) {
    return "Ahead";
  }

  if (hoursLoggedRate < 0.35) {
    return "Behind";
  }

  return "On Track";
}

export function deriveBuildHealthStatus({
  planStatus,
  qaWaitingCount,
  staleTaskCount,
  taskCompletionRate,
  totalTaskCount,
  unresolvedBlockerCount,
}: {
  planStatus: HealthStatus;
  qaWaitingCount: number;
  staleTaskCount: number | null;
  taskCompletionRate: number;
  totalTaskCount: number;
  unresolvedBlockerCount: number;
}): HealthStatus {
  if (
    planStatus === "At Risk" ||
    unresolvedBlockerCount >= 8 ||
    qaWaitingCount >= 5 ||
    ((staleTaskCount ?? 0) >= 5 && totalTaskCount >= 8)
  ) {
    return "At Risk";
  }

  if (
    planStatus === "Ahead" &&
    unresolvedBlockerCount === 0 &&
    qaWaitingCount === 0 &&
    taskCompletionRate >= 0.7
  ) {
    return "Ahead";
  }

  if (
    planStatus === "Behind" ||
    unresolvedBlockerCount >= 3 ||
    qaWaitingCount >= 2 ||
    (totalTaskCount >= 8 && taskCompletionRate < 0.2)
  ) {
    return "Behind";
  }

  return "On Track";
}

export function latestReportByTaskId(reports: BootstrapPayload["reports"]) {
  const byTask = new Map<string, BootstrapPayload["reports"][number]>();

  reports
    .filter((report) => report.reportType === "QA" && report.taskId)
    .forEach((report) => {
      const taskId = report.taskId as string;
      const previous = byTask.get(taskId);
      const reportTimestamp = parseTimestamp(report.reviewedAt ?? report.createdAt) ?? Number.NEGATIVE_INFINITY;
      const previousTimestamp = previous
        ? parseTimestamp(previous.reviewedAt ?? previous.createdAt) ?? Number.NEGATIVE_INFINITY
        : Number.NEGATIVE_INFINITY;

      if (!previous || reportTimestamp > previousTimestamp) {
        byTask.set(taskId, report);
      }
    });

  return byTask;
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function buildHealthReasons({
  completedTaskCount,
  ownerlessTaskCount,
  qaWaitingCount,
  staleTaskCount,
  totalTaskCount,
  unresolvedBlockerCount,
}: {
  completedTaskCount: number;
  ownerlessTaskCount: number;
  qaWaitingCount: number;
  staleTaskCount: number | null;
  totalTaskCount: number;
  unresolvedBlockerCount: number;
}) {
  return [
    unresolvedBlockerCount > 0 ? `${pluralize(unresolvedBlockerCount, "unresolved blocker")}` : null,
    qaWaitingCount > 0 ? `${pluralize(qaWaitingCount, "QA review")} waiting` : null,
    totalTaskCount > 0 ? `${completedTaskCount} of ${totalTaskCount} tasks closed` : "No tasks in scope",
    staleTaskCount && staleTaskCount > 0 ? `${pluralize(staleTaskCount, "stale task")}` : null,
    ownerlessTaskCount > 0 ? `${pluralize(ownerlessTaskCount, "ownerless open task")}` : null,
  ].filter((reason): reason is string => Boolean(reason)).slice(0, 3);
}

export function buildHealthActions({
  ownerlessTaskCount,
  qaWaitingCount,
  staleTaskCount,
  staleTaskThresholdDays,
  supplySignals,
  unresolvedBlockerCount,
}: {
  ownerlessTaskCount: number;
  qaWaitingCount: number;
  staleTaskCount: number | null;
  staleTaskThresholdDays: number;
  supplySignals: number;
  unresolvedBlockerCount: number;
}) {
  return [
    unresolvedBlockerCount > 0 ? "Resolve oldest blockers" : null,
    qaWaitingCount > 0 ? "Review waiting QA gates" : null,
    ownerlessTaskCount > 0 ? "Assign owners to ownerless tasks" : null,
    staleTaskCount && staleTaskCount > 0 ? `Touch stale tasks (${staleTaskThresholdDays}+ days)` : null,
    supplySignals > 0 ? "Address supply risk signals" : null,
  ].filter((action): action is string => Boolean(action)).slice(0, 3);
}
