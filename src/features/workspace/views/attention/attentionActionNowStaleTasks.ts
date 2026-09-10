import {
  addReason,
  formatBlockedImpact,
  pickTaskContextLabel,
  scoreAttentionItem,
  type AttentionLookup,
} from "./attentionActionNowShared";
import type { StaleTaskResult } from "./staleTaskDetector";
import { formatOwnerLabel, isDateOverdue } from "./attentionViewHelpers";
import type { AttentionNowItem, AttentionReason } from "./attentionViewTypes";

interface BuildStaleTaskActionItemsArgs {
  downstreamByTaskId: Map<string, number>;
  includedTaskIds: Set<string>;
  lookup: AttentionLookup;
  staleTaskResults: StaleTaskResult[];
}

const STALE_TASK_ISSUE_LABELS: Record<StaleTaskResult["primaryIssue"], string> = {
  "blocked-too-long": "blocked-too-long",
  "in-progress-too-long": "in-progress-too-long",
  "no-update": "stale-no-update",
  "waiting-qa-too-long": "waiting-qa-too-long",
};

function formatStaleTaskWhyNow(staleResult: StaleTaskResult) {
  switch (staleResult.primaryIssue) {
    case "blocked-too-long":
      return staleResult.blockedAgeDays === null
        ? `Task is blocked and crossed the ${staleResult.thresholdDays}-day stale threshold.`
        : `Task has been blocked for ${staleResult.blockedAgeDays} days, crossing the ${staleResult.thresholdDays}-day threshold.`;
    case "in-progress-too-long":
      return staleResult.inProgressAgeDays === null
        ? `Task is in progress and crossed the ${staleResult.thresholdDays}-day stale threshold.`
        : `Task has been in progress for ${staleResult.inProgressAgeDays} days, crossing the ${staleResult.thresholdDays}-day threshold.`;
    case "waiting-qa-too-long":
      return staleResult.waitingQaAgeDays === null
        ? `Task is waiting for QA and crossed the ${staleResult.thresholdDays}-day stale threshold.`
        : `Task has waited for QA for ${staleResult.waitingQaAgeDays} days, crossing the ${staleResult.thresholdDays}-day threshold.`;
    case "no-update":
      return staleResult.lastUpdatedAgeDays === null
        ? `Task crossed the ${staleResult.thresholdDays}-day no-update threshold with no recent activity signal.`
        : `Task has gone ${staleResult.lastUpdatedAgeDays} days without an update, crossing the ${staleResult.thresholdDays}-day threshold.`;
  }
}

export function buildStaleTaskActionItems({
  downstreamByTaskId,
  includedTaskIds,
  lookup,
  staleTaskResults,
}: BuildStaleTaskActionItemsArgs) {
  const items: AttentionNowItem[] = [];

  for (const staleResult of staleTaskResults) {
    const task = staleResult.task;
    if (includedTaskIds.has(task.id)) {
      continue;
    }

    const reasons: AttentionReason[] = ["stale"];
    addReason(reasons, "missing-owner", !task.ownerId);
    addReason(reasons, "overdue", isDateOverdue(task.dueDate));
    const downstreamBlockedCount = downstreamByTaskId.get(task.id) ?? 0;

    items.push({
      actionType: "open-task",
      blockingImpact: formatBlockedImpact(downstreamBlockedCount),
      contextLabel: pickTaskContextLabel(task, lookup),
      dueDate: task.dueDate,
      id: `task-stale-${task.id}`,
      lastUpdatedAt: staleResult.lastUpdatedAt,
      nextAction: "Confirm current owner, update status, and either rebaseline or close the task.",
      openLabel: "Open task",
      ownerLabel: formatOwnerLabel(task.ownerId ? lookup.membersById[task.ownerId]?.name : null),
      reasons,
      recordId: task.id,
      severityLabel: task.priority,
      sourceType: "task",
      statusLabel: STALE_TASK_ISSUE_LABELS[staleResult.primaryIssue],
      title: task.title,
      urgencyScore: scoreAttentionItem({
        downstreamBlockedCount,
        dueDate: task.dueDate,
        isOwnerMissing: !task.ownerId,
        reasons,
      }),
      whyNow: formatStaleTaskWhyNow(staleResult),
    });
    includedTaskIds.add(task.id);
  }

  return items;
}
