import type { BootstrapPayload } from "@/types/bootstrap";
import { daysSinceDate, mergeLatestTimestamp, parseAttentionDate } from "./attentionViewHelpers";

export type StaleTaskIssueType =
  | "no-update"
  | "in-progress-too-long"
  | "waiting-qa-too-long"
  | "blocked-too-long";

export interface StaleTaskThresholds {
  noUpdateDays: number;
  inProgressDays: number;
  waitingQaDays: number;
  blockedDays: number;
}

export interface StaleTaskResult {
  blockedAgeDays: number | null;
  inProgressAgeDays: number | null;
  issueTypes: StaleTaskIssueType[];
  lastUpdatedAgeDays: number | null;
  lastUpdatedAt?: string;
  primaryIssue: StaleTaskIssueType;
  task: BootstrapPayload["tasks"][number];
  thresholdDays: number;
  waitingQaAgeDays: number | null;
}

interface DetectStaleTasksArgs {
  taskBlockers?: BootstrapPayload["taskBlockers"];
  taskLastUpdatedAtById: Map<string, string>;
  tasks: BootstrapPayload["tasks"];
  thresholds?: Partial<StaleTaskThresholds>;
  today?: Date;
}

const ISSUE_PRIORITY: StaleTaskIssueType[] = [
  "blocked-too-long",
  "waiting-qa-too-long",
  "in-progress-too-long",
  "no-update",
];

export const DEFAULT_STALE_TASK_THRESHOLDS: StaleTaskThresholds = {
  blockedDays: 4,
  inProgressDays: 10,
  noUpdateDays: 5,
  waitingQaDays: 3,
};

function getThresholds(overrides: Partial<StaleTaskThresholds> | undefined): StaleTaskThresholds {
  return {
    ...DEFAULT_STALE_TASK_THRESHOLDS,
    ...overrides,
  };
}

function buildOldestOpenBlockerCreatedAtByTaskId(taskBlockers: BootstrapPayload["taskBlockers"] = []) {
  const oldestByTaskId = new Map<string, string>();

  for (const blocker of taskBlockers) {
    if (blocker.status !== "open") {
      continue;
    }

    const current = oldestByTaskId.get(blocker.blockedTaskId);
    const currentTimestamp = parseAttentionDate(current);
    const blockerTimestamp = parseAttentionDate(blocker.createdAt);
    if (currentTimestamp === null || (blockerTimestamp !== null && blockerTimestamp < currentTimestamp)) {
      oldestByTaskId.set(blocker.blockedTaskId, blocker.createdAt);
    }
  }

  return oldestByTaskId;
}

function buildLatestOpenBlockerCreatedAtByTaskId(taskBlockers: BootstrapPayload["taskBlockers"] = []) {
  const latestByTaskId = new Map<string, string>();

  for (const blocker of taskBlockers) {
    if (blocker.status !== "open") {
      continue;
    }

    const current = latestByTaskId.get(blocker.blockedTaskId);
    latestByTaskId.set(
      blocker.blockedTaskId,
      mergeLatestTimestamp(current, blocker.createdAt) ?? blocker.createdAt,
    );
  }

  return latestByTaskId;
}

function pickPrimaryIssue(issueTypes: StaleTaskIssueType[]) {
  return ISSUE_PRIORITY.find((issueType) => issueTypes.includes(issueType)) ?? "no-update";
}

function getIssueThreshold(issueType: StaleTaskIssueType, thresholds: StaleTaskThresholds) {
  switch (issueType) {
    case "blocked-too-long":
      return thresholds.blockedDays;
    case "in-progress-too-long":
      return thresholds.inProgressDays;
    case "waiting-qa-too-long":
      return thresholds.waitingQaDays;
    case "no-update":
      return thresholds.noUpdateDays;
  }
}

export function detectStaleTasks({
  taskBlockers,
  taskLastUpdatedAtById,
  tasks,
  thresholds: thresholdOverrides,
  today = new Date(),
}: DetectStaleTasksArgs): StaleTaskResult[] {
  const thresholds = getThresholds(thresholdOverrides);
  const oldestOpenBlockerCreatedAtByTaskId = buildOldestOpenBlockerCreatedAtByTaskId(taskBlockers);
  const latestOpenBlockerCreatedAtByTaskId = buildLatestOpenBlockerCreatedAtByTaskId(taskBlockers);

  return tasks
    .filter((task) => task.status !== "complete")
    .map((task): StaleTaskResult | null => {
      const issueTypes: StaleTaskIssueType[] = [];
      const lastUpdatedAt =
        mergeLatestTimestamp(taskLastUpdatedAtById.get(task.id), latestOpenBlockerCreatedAtByTaskId.get(task.id)) ??
        taskLastUpdatedAtById.get(task.id);
      const lastUpdatedAgeDays = daysSinceDate(lastUpdatedAt, today);
      const inProgressAgeDays = daysSinceDate(task.startDate, today);
      const waitingQaAgeDays = task.status === "waiting-for-qa" ? lastUpdatedAgeDays : null;
      const isBlocked =
        task.isBlocked ||
        task.blockers.length > 0 ||
        task.planningState === "blocked" ||
        task.planningState === "waiting-on-dependency";
      const blockerCreatedAt = oldestOpenBlockerCreatedAtByTaskId.get(task.id);
      const blockedAgeDays = isBlocked
        ? daysSinceDate(blockerCreatedAt ?? taskLastUpdatedAtById.get(task.id) ?? task.startDate, today)
        : null;

      if (lastUpdatedAgeDays === null || lastUpdatedAgeDays >= thresholds.noUpdateDays) {
        issueTypes.push("no-update");
      }

      if (
        task.status === "in-progress" &&
        inProgressAgeDays !== null &&
        inProgressAgeDays >= thresholds.inProgressDays
      ) {
        issueTypes.push("in-progress-too-long");
      }

      if (
        task.status === "waiting-for-qa" &&
        (waitingQaAgeDays === null || waitingQaAgeDays >= thresholds.waitingQaDays)
      ) {
        issueTypes.push("waiting-qa-too-long");
      }

      if (isBlocked && (blockedAgeDays === null || blockedAgeDays >= thresholds.blockedDays)) {
        issueTypes.push("blocked-too-long");
      }

      if (issueTypes.length === 0) {
        return null;
      }

      const primaryIssue = pickPrimaryIssue(issueTypes);
      return {
        blockedAgeDays,
        inProgressAgeDays,
        issueTypes,
        lastUpdatedAgeDays,
        lastUpdatedAt,
        primaryIssue,
        task,
        thresholdDays: getIssueThreshold(primaryIssue, thresholds),
        waitingQaAgeDays,
      };
    })
    .filter((result): result is StaleTaskResult => Boolean(result));
}
