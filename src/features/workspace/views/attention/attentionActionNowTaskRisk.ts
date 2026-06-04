import type { BootstrapPayload } from "@/types/bootstrap";
import { TASK_BLOCKER_TYPE_LABELS } from "@/types/common";
import { daysSinceDate, formatOwnerLabel, isDateOverdue } from "./attentionViewHelpers";
import {
  addReason,
  formatBlockedImpact,
  pickTaskContextLabel,
  scoreAttentionItem,
  STALE_UPDATE_DAYS,
  type AttentionLookup,
} from "./attentionActionNowShared";
import { buildRiskActionItems } from "./attentionActionNowRisks";
import { buildStaleTaskActionItems } from "./attentionActionNowStaleTasks";
import type { StaleTaskResult } from "./staleTaskDetector";
import type { AttentionNowItem, AttentionReason } from "./attentionViewTypes";

interface BuildTaskAndRiskActionItemsArgs {
  blockedTasks: BootstrapPayload["tasks"];
  criticalRisks: BootstrapPayload["risks"];
  downstreamByTaskId: Map<string, number>;
  highRisks: BootstrapPayload["risks"];
  lookup: AttentionLookup;
  overdueTasks: BootstrapPayload["tasks"];
  reportsById: Record<string, BootstrapPayload["reports"][number]>;
  staleTaskResults: StaleTaskResult[];
  taskBlockersByTaskId: Map<string, NonNullable<BootstrapPayload["taskBlockers"]>>;
  taskLastUpdatedAtById: Map<string, string>;
  waitingQaTasks: BootstrapPayload["tasks"];
}

export function buildTaskAndRiskActionItems({
  blockedTasks,
  criticalRisks,
  downstreamByTaskId,
  highRisks,
  lookup,
  overdueTasks,
  reportsById,
  staleTaskResults,
  taskBlockersByTaskId,
  taskLastUpdatedAtById,
  waitingQaTasks,
}: BuildTaskAndRiskActionItemsArgs) {
  const items: AttentionNowItem[] = [];
  const includedTaskIds = new Set<string>();

  for (const task of blockedTasks) {
    const lastUpdatedAt = taskLastUpdatedAtById.get(task.id);
    const staleResult = staleTaskResults.find((result) => result.task.id === task.id);
    if (!staleResult?.issueTypes.includes("blocked-too-long")) {
      continue;
    }
    const lastUpdatedDays = staleResult.blockedAgeDays ?? daysSinceDate(lastUpdatedAt);

    const reasons: AttentionReason[] = ["blocked"];
    addReason(reasons, "stale", lastUpdatedDays === null || lastUpdatedDays >= STALE_UPDATE_DAYS);
    addReason(reasons, "missing-owner", !task.ownerId);
    addReason(reasons, "overdue", isDateOverdue(task.dueDate));

    const downstreamBlockedCount = downstreamByTaskId.get(task.id) ?? 0;
    const openBlockers = taskBlockersByTaskId.get(task.id) ?? [];
    const blockerTypes = Array.from(new Set(openBlockers.map((blocker) => blocker.blockerType)));
    const blockerTypeLabel =
      blockerTypes.length > 0
        ? blockerTypes.map((blockerType) => TASK_BLOCKER_TYPE_LABELS[blockerType]).join(", ")
        : undefined;
    const ownerLabel = formatOwnerLabel(task.ownerId ? lookup.membersById[task.ownerId]?.name : null);
    const whyNow =
      lastUpdatedDays === null
        ? "Task is blocked and has no recent activity signal."
        : `Task has been blocked with no meaningful update for ${lastUpdatedDays} days.`;

    items.push({
      actionType: "open-task",
      blockingImpact: formatBlockedImpact(downstreamBlockedCount),
      blockerTypeLabel,
      contextLabel: pickTaskContextLabel(task, lookup),
      dueDate: task.dueDate,
      id: `task-blocked-stale-${task.id}`,
      lastUpdatedAt,
      nextAction: "Assign an unblock owner and capture the unblock plan now.",
      openLabel: "Open task",
      ownerLabel,
      reasons,
      recordId: task.id,
      severityLabel: task.priority,
      sourceType: "task",
      statusLabel: task.planningState ?? "blocked",
      title: task.title,
      urgencyScore: scoreAttentionItem({
        blockedAgeDays: lastUpdatedDays,
        blockerTypes,
        downstreamBlockedCount,
        dueDate: task.dueDate,
        isOwnerMissing: !task.ownerId,
        reasons,
      }),
      whyNow,
    });
    includedTaskIds.add(task.id);
  }

  for (const task of waitingQaTasks) {
    if (includedTaskIds.has(task.id)) {
      continue;
    }

    const lastUpdatedAt = taskLastUpdatedAtById.get(task.id);
    const staleResult = staleTaskResults.find((result) => result.task.id === task.id);
    if (!staleResult?.issueTypes.includes("waiting-qa-too-long")) {
      continue;
    }
    const waitingAgeDays = staleResult.waitingQaAgeDays ?? daysSinceDate(lastUpdatedAt);

    const reasons: AttentionReason[] = ["waiting-qa"];
    addReason(reasons, "stale", waitingAgeDays === null || waitingAgeDays >= STALE_UPDATE_DAYS);
    addReason(reasons, "missing-owner", !task.ownerId);
    addReason(reasons, "overdue", isDateOverdue(task.dueDate));
    const downstreamBlockedCount = downstreamByTaskId.get(task.id) ?? 0;

    items.push({
      actionType: "open-task",
      blockingImpact: formatBlockedImpact(downstreamBlockedCount),
      contextLabel: pickTaskContextLabel(task, lookup),
      dueDate: task.dueDate,
      id: `task-waiting-qa-${task.id}`,
      lastUpdatedAt,
      nextAction: "Schedule mentor QA review and record pass/fail with follow-up.",
      openLabel: "Open task",
      ownerLabel: formatOwnerLabel(task.ownerId ? lookup.membersById[task.ownerId]?.name : null),
      reasons,
      recordId: task.id,
      severityLabel: task.priority,
      sourceType: "qa",
      statusLabel: "waiting-for-qa",
      title: task.title,
      urgencyScore: scoreAttentionItem({
        downstreamBlockedCount,
        dueDate: task.dueDate,
        isOwnerMissing: !task.ownerId,
        reasons,
        waitingQaAgeDays: waitingAgeDays,
      }),
      whyNow:
        waitingAgeDays === null
          ? "Task is waiting for QA with no recent activity signal."
          : `Task has waited for QA for ${waitingAgeDays} days.`,
    });
    includedTaskIds.add(task.id);
  }

  items.push(
    ...buildStaleTaskActionItems({
      downstreamByTaskId,
      includedTaskIds,
      lookup,
      staleTaskResults,
    }),
  );

  for (const task of overdueTasks) {
    if (includedTaskIds.has(task.id)) {
      continue;
    }

    const downstreamBlockedCount = downstreamByTaskId.get(task.id) ?? 0;
    if (downstreamBlockedCount <= 0) {
      continue;
    }

    const reasons: AttentionReason[] = ["overdue"];
    addReason(reasons, "missing-owner", !task.ownerId);

    items.push({
      actionType: "open-task",
      blockingImpact: formatBlockedImpact(downstreamBlockedCount),
      contextLabel: pickTaskContextLabel(task, lookup),
      dueDate: task.dueDate,
      id: `task-overdue-blocking-${task.id}`,
      lastUpdatedAt: taskLastUpdatedAtById.get(task.id),
      nextAction: "Rebaseline this task and clear downstream dependency risk today.",
      openLabel: "Open task",
      ownerLabel: formatOwnerLabel(task.ownerId ? lookup.membersById[task.ownerId]?.name : null),
      reasons,
      recordId: task.id,
      severityLabel: task.priority,
      sourceType: "task",
      statusLabel: task.status,
      title: task.title,
      urgencyScore: scoreAttentionItem({
        downstreamBlockedCount,
        dueDate: task.dueDate,
        isOwnerMissing: !task.ownerId,
        reasons,
      }),
      whyNow: `Task is overdue and currently blocks ${downstreamBlockedCount} downstream item(s).`,
    });
    includedTaskIds.add(task.id);
  }

  items.push(
    ...buildRiskActionItems({
      criticalRisks,
      downstreamByTaskId,
      highRisks,
      lookup,
      reportsById,
      taskLastUpdatedAtById,
    }),
  );

  return {
    includedTaskIds,
    items,
  };
}
