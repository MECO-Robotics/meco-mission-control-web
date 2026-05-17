import type { BootstrapPayload } from "@/types/bootstrap";
import { formatContextLabel, formatOwnerLabel, isDateOverdue, mergeLatestTimestamp, normalizeDateOnly } from "./attentionViewHelpers";
import {
  addReason,
  pickPrimaryTask,
  scoreAttentionItem,
  type AttentionLookup,
} from "./attentionActionNowShared";
import type { AttentionNowItem, AttentionReason } from "./attentionViewTypes";

interface BuildSupplyAndQualityActionItemsArgs {
  failedQaReviews: NonNullable<BootstrapPayload["qaReviews"]>;
  failedReports: BootstrapPayload["reports"];
  lookup: AttentionLookup;
  manufacturingBlockers: BootstrapPayload["manufacturingItems"];
  manufacturingLinkedTasksById: Map<string, BootstrapPayload["tasks"]>;
  purchaseDelays: BootstrapPayload["purchaseItems"];
  purchaseLinkedTasksById: Map<string, BootstrapPayload["tasks"]>;
  taskLastUpdatedAtById: Map<string, string>;
}

export function buildSupplyAndQualityActionItems({
  failedQaReviews,
  failedReports,
  lookup,
  manufacturingBlockers,
  manufacturingLinkedTasksById,
  purchaseDelays,
  purchaseLinkedTasksById,
  taskLastUpdatedAtById,
}: BuildSupplyAndQualityActionItemsArgs) {
  const items: AttentionNowItem[] = [];

  for (const report of failedReports) {
    const task = report.taskId ? lookup.tasksById[report.taskId] : null;
    if (task) {
      continue;
    }

    const ownerLabel = formatOwnerLabel(
      report.createdByMemberId ? lookup.membersById[report.createdByMemberId]?.name : null,
    );
    const reasons: AttentionReason[] = ["failed-qa"];
    addReason(reasons, "missing-owner", !report.createdByMemberId);

    items.push({
      actionType: null,
      contextLabel: formatContextLabel({
        projectName: report.projectId ? lookup.projectsById[report.projectId]?.name : undefined,
      }),
      id: `report-followup-missing-${report.id}`,
      lastUpdatedAt: mergeLatestTimestamp(report.createdAt, report.reviewedAt ?? null),
      nextAction: "Create a follow-up task and assign an owner before the next review cycle.",
      openLabel: "Open source item",
      ownerLabel,
      reasons,
      recordId: report.id,
      severityLabel: report.reportType,
      sourceType: "qa",
      statusLabel: report.status ?? report.result,
      title: report.title || "Failed report",
      urgencyScore: scoreAttentionItem({
        isOwnerMissing: !report.createdByMemberId,
        reasons,
      }),
      whyNow: "Failed QA/report signal has no linked follow-up task.",
    });
  }

  for (const review of failedQaReviews) {
    const sourceTask = review.subjectType === "task" ? lookup.tasksById[review.subjectId] : null;
    if (sourceTask) {
      continue;
    }

    const ownerName = review.participantIds[0] ? lookup.membersById[review.participantIds[0]]?.name : null;
    const reasons: AttentionReason[] = ["failed-qa"];
    addReason(reasons, "missing-owner", !ownerName);

    items.push({
      actionType: null,
      id: `qa-review-followup-missing-${review.id}`,
      lastUpdatedAt: review.reviewedAt,
      nextAction: "Create a follow-up task to capture correction scope and ownership.",
      openLabel: "Open source item",
      ownerLabel: formatOwnerLabel(ownerName),
      reasons,
      recordId: review.id,
      severityLabel: "QA",
      sourceType: "qa",
      statusLabel: review.result,
      title: review.subjectTitle,
      urgencyScore: scoreAttentionItem({
        isOwnerMissing: !ownerName,
        reasons,
      }),
      whyNow: "QA review needs follow-up work but has no linked task.",
    });
  }

  for (const item of purchaseDelays) {
    const linkedTasks = purchaseLinkedTasksById.get(item.id) ?? [];
    if (linkedTasks.length === 0) {
      continue;
    }

    const primaryTask = pickPrimaryTask(linkedTasks);
    if (!primaryTask) {
      continue;
    }

    const reasons: AttentionReason[] = ["purchase-delay"];
    addReason(reasons, "overdue", isDateOverdue(primaryTask.dueDate));
    addReason(reasons, "missing-owner", !item.requestedById);

    items.push({
      actionType: "open-task",
      blockingImpact:
        linkedTasks.length === 1
          ? "Purchase delay blocks 1 task"
          : `Purchase delay blocks ${linkedTasks.length} tasks`,
      contextLabel: formatContextLabel({
        projectName: lookup.projectsById[lookup.subsystemsById[item.subsystemId]?.projectId]?.name,
        subsystemName: lookup.subsystemsById[item.subsystemId]?.name,
      }),
      dueDate: primaryTask.dueDate,
      id: `purchase-delay-${item.id}`,
      lastUpdatedAt: taskLastUpdatedAtById.get(primaryTask.id),
      nextAction: "Confirm vendor ETA and update blocked task owners with an unblock plan.",
      openLabel: "Open blocked task",
      ownerLabel: formatOwnerLabel(
        item.requestedById ? lookup.membersById[item.requestedById]?.name : null,
      ),
      reasons,
      recordId: primaryTask.id,
      severityLabel: "supply",
      sourceType: "purchase",
      statusLabel: item.status,
      title: item.title,
      urgencyScore: scoreAttentionItem({
        downstreamBlockedCount: linkedTasks.length,
        dueDate: primaryTask.dueDate,
        isOwnerMissing: !item.requestedById,
        reasons,
      }),
      whyNow:
        linkedTasks.length === 1
          ? "Purchase delay blocks an active task."
          : `Purchase delay blocks ${linkedTasks.length} active tasks.`,
    });
  }

  for (const item of manufacturingBlockers) {
    const linkedTasks = manufacturingLinkedTasksById.get(item.id) ?? [];
    const primaryTask = pickPrimaryTask(linkedTasks);
    const reasons: AttentionReason[] = ["mfg-blocker"];
    addReason(reasons, "overdue", isDateOverdue(item.dueDate));
    addReason(reasons, "missing-owner", !item.requestedById);

    items.push({
      actionType: primaryTask ? "open-task" : null,
      blockingImpact:
        linkedTasks.length === 0
          ? undefined
          : linkedTasks.length === 1
            ? "Manufacturing blocker blocks 1 task"
            : `Manufacturing blocker blocks ${linkedTasks.length} tasks`,
      contextLabel: formatContextLabel({
        projectName: lookup.projectsById[lookup.subsystemsById[item.subsystemId]?.projectId]?.name,
        subsystemName: lookup.subsystemsById[item.subsystemId]?.name,
      }),
      dueDate: item.dueDate,
      id: `manufacturing-blocker-${item.id}`,
      lastUpdatedAt: primaryTask ? taskLastUpdatedAtById.get(primaryTask.id) : undefined,
      nextAction: !item.mentorReviewed
        ? "Get mentor review approval and release the item to execution."
        : "Escalate fabrication bottleneck and update linked task plan.",
      openLabel: primaryTask ? "Open blocked task" : "Open source item",
      ownerLabel: formatOwnerLabel(
        item.requestedById ? lookup.membersById[item.requestedById]?.name : null,
      ),
      reasons,
      recordId: primaryTask?.id ?? item.id,
      severityLabel: item.mentorReviewed ? "watch" : "needs-review",
      sourceType: "manufacturing",
      statusLabel: item.status,
      title: item.title,
      urgencyScore: scoreAttentionItem({
        downstreamBlockedCount: linkedTasks.length,
        dueDate: item.dueDate,
        isOwnerMissing: !item.requestedById,
        reasons,
      }),
      whyNow:
        linkedTasks.length > 0
          ? `Manufacturing blocker is holding up ${linkedTasks.length} active task(s).`
          : `Manufacturing item is at risk of slipping past ${normalizeDateOnly(item.dueDate)}.`,
    });
  }

  return items;
}
