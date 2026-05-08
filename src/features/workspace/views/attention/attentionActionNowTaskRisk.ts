import type { BootstrapPayload } from "@/types/bootstrap";
import { daysSinceDate, formatOwnerLabel, isDateOverdue, mergeLatestTimestamp } from "./attentionViewHelpers";
import {
  addReason,
  BLOCKED_STALE_DAYS,
  formatBlockedImpact,
  pickTaskContextLabel,
  scoreAttentionItem,
  STALE_UPDATE_DAYS,
  WAITING_QA_STALE_DAYS,
  type AttentionLookup,
} from "./attentionActionNowShared";
import type { AttentionNowItem, AttentionReason } from "./attentionViewTypes";

interface BuildTaskAndRiskActionItemsArgs {
  blockedTasks: BootstrapPayload["tasks"];
  criticalRisks: BootstrapPayload["risks"];
  downstreamByTaskId: Map<string, number>;
  highRisks: BootstrapPayload["risks"];
  lookup: AttentionLookup;
  overdueTasks: BootstrapPayload["tasks"];
  reportsById: Record<string, BootstrapPayload["reports"][number]>;
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
  taskLastUpdatedAtById,
  waitingQaTasks,
}: BuildTaskAndRiskActionItemsArgs) {
  const items: AttentionNowItem[] = [];
  const includedTaskIds = new Set<string>();

  for (const task of blockedTasks) {
    const lastUpdatedAt = taskLastUpdatedAtById.get(task.id);
    const lastUpdatedDays = daysSinceDate(lastUpdatedAt);
    const isStale = lastUpdatedDays === null || lastUpdatedDays >= BLOCKED_STALE_DAYS;
    if (!isStale) {
      continue;
    }

    const reasons: AttentionReason[] = ["blocked"];
    addReason(reasons, "stale", lastUpdatedDays === null || lastUpdatedDays >= STALE_UPDATE_DAYS);
    addReason(reasons, "missing-owner", !task.ownerId);
    addReason(reasons, "overdue", isDateOverdue(task.dueDate));

    const downstreamBlockedCount = downstreamByTaskId.get(task.id) ?? 0;
    const ownerLabel = formatOwnerLabel(task.ownerId ? lookup.membersById[task.ownerId]?.name : null);
    const whyNow =
      lastUpdatedDays === null
        ? "Task is blocked and has no recent activity signal."
        : `Task has been blocked with no meaningful update for ${lastUpdatedDays} days.`;

    items.push({
      actionType: "open-task",
      blockingImpact: formatBlockedImpact(downstreamBlockedCount),
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
    const waitingAgeDays = daysSinceDate(lastUpdatedAt);
    if (waitingAgeDays !== null && waitingAgeDays < WAITING_QA_STALE_DAYS) {
      continue;
    }

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

  for (const risk of criticalRisks) {
    const sourceTask = lookup.taskByReportId.get(risk.sourceId);
    const sourceReport = reportsById[risk.sourceId];
    const reasons: AttentionReason[] = ["critical-risk", "missing-mitigation"];
    addReason(reasons, "missing-owner", !sourceTask?.ownerId);
    const lastUpdatedAt = mergeLatestTimestamp(sourceReport?.createdAt, sourceReport?.reviewedAt ?? null);

    items.push({
      actionType: "open-risk",
      contextLabel: sourceTask ? pickTaskContextLabel(sourceTask, lookup) : "Scope unknown",
      id: `risk-missing-mitigation-${risk.id}`,
      lastUpdatedAt,
      nextAction: "Create a mitigation task, assign an owner, and set a near-term due date.",
      openLabel: "Open risk",
      ownerLabel: formatOwnerLabel(
        sourceTask?.ownerId ? lookup.membersById[sourceTask.ownerId]?.name : null,
      ),
      reasons,
      recordId: risk.id,
      severityLabel: "high",
      sourceType: "risk",
      statusLabel: "needs-mitigation",
      title: risk.title,
      urgencyScore: scoreAttentionItem({
        isOwnerMissing: !sourceTask?.ownerId,
        reasons,
      }),
      whyNow: "High-severity risk has no linked mitigation task.",
    });
  }

  for (const risk of highRisks) {
    if (!risk.mitigationTaskId) {
      continue;
    }

    const mitigationTask = lookup.tasksById[risk.mitigationTaskId];
    if (!mitigationTask) {
      continue;
    }

    const mitigationBlocked =
      mitigationTask.isBlocked ||
      mitigationTask.blockers.length > 0 ||
      mitigationTask.planningState === "blocked" ||
      mitigationTask.planningState === "waiting-on-dependency";
    if (!mitigationBlocked) {
      continue;
    }

    const reasons: AttentionReason[] = ["high-risk", "blocked"];
    addReason(reasons, "overdue", isDateOverdue(mitigationTask.dueDate));
    addReason(reasons, "missing-owner", !mitigationTask.ownerId);
    const downstreamBlockedCount = downstreamByTaskId.get(mitigationTask.id) ?? 0;

    items.push({
      actionType: "open-risk",
      blockingImpact: formatBlockedImpact(downstreamBlockedCount),
      contextLabel: pickTaskContextLabel(mitigationTask, lookup),
      dueDate: mitigationTask.dueDate,
      id: `risk-mitigation-blocked-${risk.id}`,
      lastUpdatedAt: taskLastUpdatedAtById.get(mitigationTask.id),
      nextAction: "Unblock mitigation work or define an alternate mitigation path today.",
      openLabel: "Open risk",
      ownerLabel: formatOwnerLabel(
        mitigationTask.ownerId ? lookup.membersById[mitigationTask.ownerId]?.name : null,
      ),
      reasons,
      recordId: risk.id,
      severityLabel: "high",
      sourceType: "risk",
      statusLabel: "mitigation-blocked",
      title: risk.title,
      urgencyScore: scoreAttentionItem({
        downstreamBlockedCount,
        dueDate: mitigationTask.dueDate,
        isOwnerMissing: !mitigationTask.ownerId,
        reasons,
      }),
      whyNow: "Risk mitigation task is blocked, increasing exposure.",
    });
  }

  return {
    includedTaskIds,
    items,
  };
}
