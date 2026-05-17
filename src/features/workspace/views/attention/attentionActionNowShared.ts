import type { BootstrapPayload } from "@/types/bootstrap";
import {
  ATTENTION_DUE_SOON_DAYS,
  daysUntilDate,
  formatContextLabel,
  mergeLatestTimestamp,
} from "./attentionViewHelpers";
import type { AttentionNowItem, AttentionReason } from "./attentionViewTypes";

export interface AttentionLookup {
  membersById: Record<string, BootstrapPayload["members"][number]>;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  tasksById: Record<string, BootstrapPayload["tasks"][number]>;
  taskByReportId: Map<string, BootstrapPayload["tasks"][number]>;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

export interface ItemScoringSignals {
  blockedAgeDays?: number | null;
  downstreamBlockedCount?: number;
  dueDate?: string;
  isOwnerMissing?: boolean;
  reasons: AttentionReason[];
  waitingQaAgeDays?: number | null;
}

export const WAITING_QA_STALE_DAYS = 3;
export const BLOCKED_STALE_DAYS = 4;
export const STALE_UPDATE_DAYS = 5;

const REASON_WEIGHTS: Record<AttentionReason, number> = {
  blocked: 18,
  "critical-risk": 40,
  "failed-qa": 16,
  "high-risk": 26,
  "mfg-blocker": 15,
  "missing-mitigation": 20,
  "missing-owner": 8,
  overdue: 22,
  "purchase-delay": 14,
  stale: 10,
  "waiting-qa": 14,
};

export function addReason(reasons: AttentionReason[], reason: AttentionReason, enabled = true) {
  if (enabled && !reasons.includes(reason)) {
    reasons.push(reason);
  }
}

export function scoreAttentionItem(signals: ItemScoringSignals, today = new Date()) {
  let score = signals.reasons.reduce((total, reason) => total + REASON_WEIGHTS[reason], 0);
  const dueInDays = daysUntilDate(signals.dueDate, today);

  if (dueInDays !== null) {
    if (dueInDays < 0) {
      score += Math.min(12, Math.abs(dueInDays));
    } else if (dueInDays <= 2) {
      score += 9;
    } else if (dueInDays <= ATTENTION_DUE_SOON_DAYS) {
      score += 4;
    }
  }

  if ((signals.downstreamBlockedCount ?? 0) > 0) {
    score += Math.min(12, (signals.downstreamBlockedCount ?? 0) * 3);
  }

  if ((signals.blockedAgeDays ?? 0) > 2) {
    score += Math.min(10, Math.floor((signals.blockedAgeDays ?? 0) / 2));
  }

  if ((signals.waitingQaAgeDays ?? 0) > 2) {
    score += Math.min(10, Math.floor((signals.waitingQaAgeDays ?? 0) / 2));
  }

  if (signals.isOwnerMissing) {
    score += 4;
  }

  return score;
}

export function buildTaskDownstreamCount(tasks: BootstrapPayload["tasks"]) {
  const counts = new Map<string, number>();

  for (const task of tasks) {
    if (task.status === "complete") {
      continue;
    }

    for (const dependencyId of task.dependencyIds) {
      counts.set(dependencyId, (counts.get(dependencyId) ?? 0) + 1);
    }
  }

  return counts;
}

export function indexLinkedTasksBySupplyId({
  key,
  tasks,
}: {
  key: "linkedManufacturingIds" | "linkedPurchaseIds";
  tasks: BootstrapPayload["tasks"];
}) {
  const index = new Map<string, BootstrapPayload["tasks"]>();

  for (const task of tasks) {
    if (task.status === "complete") {
      continue;
    }

    for (const linkedId of task[key]) {
      const linkedTasks = index.get(linkedId) ?? [];
      linkedTasks.push(task);
      index.set(linkedId, linkedTasks);
    }
  }

  return index;
}

export function buildTaskLastUpdatedAtById(bootstrap: BootstrapPayload) {
  const latestByTaskId = new Map<string, string>();

  for (const task of bootstrap.tasks) {
    latestByTaskId.set(task.id, task.startDate);
  }

  for (const worklog of bootstrap.workLogs) {
    const current = latestByTaskId.get(worklog.taskId);
    latestByTaskId.set(worklog.taskId, mergeLatestTimestamp(current, worklog.date) ?? worklog.date);
  }

  for (const report of bootstrap.reports) {
    if (!report.taskId) {
      continue;
    }

    const current = latestByTaskId.get(report.taskId);
    const latestFromReport = mergeLatestTimestamp(report.createdAt, report.reviewedAt ?? null);
    latestByTaskId.set(
      report.taskId,
      mergeLatestTimestamp(current, latestFromReport) ?? report.createdAt,
    );
  }

  for (const review of bootstrap.qaReviews ?? []) {
    if (review.subjectType !== "task") {
      continue;
    }

    const current = latestByTaskId.get(review.subjectId);
    latestByTaskId.set(
      review.subjectId,
      mergeLatestTimestamp(current, review.reviewedAt) ?? review.reviewedAt,
    );
  }

  return latestByTaskId;
}

export function pickTaskContextLabel(task: BootstrapPayload["tasks"][number], lookup: AttentionLookup) {
  const workstreamId = task.workstreamId ?? task.workstreamIds[0] ?? null;

  return formatContextLabel({
    projectName: lookup.projectsById[task.projectId]?.name,
    subsystemName: lookup.subsystemsById[task.subsystemId]?.name,
    workstreamName: workstreamId ? lookup.workstreamsById[workstreamId]?.name : undefined,
  });
}

export function pickPrimaryTask(tasks: BootstrapPayload["tasks"]) {
  return [...tasks].sort((left, right) => {
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return leftDue - rightDue;
  })[0];
}

export function formatBlockedImpact(downstreamBlockedCount: number) {
  if (downstreamBlockedCount <= 0) {
    return undefined;
  }

  return downstreamBlockedCount === 1
    ? "Blocks 1 downstream task"
    : `Blocks ${downstreamBlockedCount} downstream tasks`;
}

export function sortAttentionItemsByUrgency(items: AttentionNowItem[]) {
  return items.sort((left, right) => {
    if (left.urgencyScore === right.urgencyScore) {
      return left.title.localeCompare(right.title);
    }

    return right.urgencyScore - left.urgencyScore;
  });
}
