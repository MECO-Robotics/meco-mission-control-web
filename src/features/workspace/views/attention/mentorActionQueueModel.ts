import type { BootstrapPayload } from "@/types/bootstrap";
import { formatContextLabel, formatOwnerLabel } from "./attentionViewHelpers";
import { pickPrimaryTask, pickTaskContextLabel, type AttentionLookup } from "./attentionActionNowShared";
import type { MentorActionQueueItem } from "./attentionViewTypes";
import type { StaleTaskResult } from "./staleTaskDetector";

interface BuildMentorActionQueueItemsArgs {
  blockedTasks: BootstrapPayload["tasks"];
  lookup: AttentionLookup;
  pendingQaReports: BootstrapPayload["reports"];
  pendingQaReviews: NonNullable<BootstrapPayload["qaReviews"]>;
  purchaseLinkedTasksById: Map<string, BootstrapPayload["tasks"]>;
  riskReviewItems: BootstrapPayload["risks"];
  staleTaskResults: StaleTaskResult[];
  pendingPurchaseApprovals: BootstrapPayload["purchaseItems"];
  waitingQaTasks: BootstrapPayload["tasks"];
}

function buildTaskQueueItem({
  idPrefix,
  sourceLabel,
  sourceType,
  statusLabel,
  task,
  lookup,
}: {
  idPrefix: string;
  sourceLabel: string;
  sourceType: MentorActionQueueItem["sourceType"];
  statusLabel: string;
  task: BootstrapPayload["tasks"][number];
  lookup: AttentionLookup;
}): MentorActionQueueItem {
  return {
    actionType: "open-task",
    contextLabel: pickTaskContextLabel(task, lookup),
    id: `${idPrefix}-${task.id}`,
    openLabel: "Open task",
    ownerLabel: formatOwnerLabel(task.ownerId ? lookup.membersById[task.ownerId]?.name : null),
    priorityLabel: task.priority,
    recordId: task.id,
    sourceLabel,
    sourceType,
    statusLabel,
    title: task.title,
  };
}

function getQaReportOutcome(report: BootstrapPayload["reports"][number]) {
  return report.reportType === "QA" && report.result ? report.result : report.status;
}

function getQaReportPriority(report: BootstrapPayload["reports"][number]) {
  const outcome = getQaReportOutcome(report);
  return outcome === "pass" ? "medium" : "high";
}

export function buildMentorActionQueueItems({
  blockedTasks,
  lookup,
  pendingQaReports,
  pendingQaReviews,
  pendingPurchaseApprovals,
  purchaseLinkedTasksById,
  riskReviewItems,
  staleTaskResults,
  waitingQaTasks,
}: BuildMentorActionQueueItemsArgs): MentorActionQueueItem[] {
  const queuedTaskIds = new Set<string>();
  const queuedQaTaskIds = new Set<string>();
  const items: MentorActionQueueItem[] = [];

  for (const report of pendingQaReports) {
    const task = report.taskId ? lookup.tasksById[report.taskId] : null;
    const projectName = report.projectId ? lookup.projectsById[report.projectId]?.name : undefined;

    items.push({
      actionType: task ? "open-task" : null,
      contextLabel: task
        ? pickTaskContextLabel(task, lookup)
        : formatContextLabel({ projectName }),
      id: `mentor-qa-report-approval-${report.id}`,
      openLabel: task ? "Open task" : "Source unavailable",
      ownerLabel: formatOwnerLabel(
        report.createdByMemberId ? lookup.membersById[report.createdByMemberId]?.name : null,
      ),
      priorityLabel: getQaReportPriority(report),
      recordId: task?.id ?? report.id,
      sourceLabel: "Pending QA approval",
      sourceType: "qa",
      statusLabel: getQaReportOutcome(report),
      title: report.title || task?.title || "QA report",
    });

    if (task) {
      queuedQaTaskIds.add(task.id);
    }
  }

  for (const review of pendingQaReviews) {
    const task = review.subjectType === "task" ? lookup.tasksById[review.subjectId] : null;

    items.push({
      actionType: task ? "open-task" : null,
      contextLabel: task ? pickTaskContextLabel(task, lookup) : "Source unavailable",
      id: `mentor-qa-review-approval-${review.id}`,
      openLabel: task ? "Open task" : "Source unavailable",
      ownerLabel:
        review.participantIds.length > 0
          ? formatOwnerLabel(lookup.membersById[review.participantIds[0]]?.name)
          : "Unassigned",
      priorityLabel: review.result === "pass" ? "medium" : "high",
      recordId: task?.id ?? review.id,
      sourceLabel: "Pending QA approval",
      sourceType: "qa",
      statusLabel: review.result,
      title: review.subjectTitle,
    });

    if (task) {
      queuedQaTaskIds.add(task.id);
    }
  }

  for (const task of waitingQaTasks) {
    if (queuedQaTaskIds.has(task.id)) {
      continue;
    }

    items.push(
      buildTaskQueueItem({
        idPrefix: "mentor-qa-approval",
        lookup,
        sourceLabel: "Pending QA approval",
        sourceType: "qa",
        statusLabel: "Waiting QA",
        task,
      }),
    );
    queuedTaskIds.add(task.id);
  }

  for (const task of blockedTasks) {
    if (queuedTaskIds.has(task.id)) {
      continue;
    }

    items.push(
      buildTaskQueueItem({
        idPrefix: "mentor-blocked-student",
        lookup,
        sourceLabel: "Blocked student help",
        sourceType: "task",
        statusLabel: task.planningState ?? "blocked",
        task,
      }),
    );
    queuedTaskIds.add(task.id);
  }

  for (const purchase of pendingPurchaseApprovals) {
    const linkedTask = pickPrimaryTask(purchaseLinkedTasksById.get(purchase.id) ?? []);

    items.push({
      actionType: linkedTask ? "open-task" : null,
      contextLabel: formatContextLabel({
        projectName: lookup.projectsById[lookup.subsystemsById[purchase.subsystemId]?.projectId]?.name,
        subsystemName: lookup.subsystemsById[purchase.subsystemId]?.name,
      }),
      id: `mentor-purchase-approval-${purchase.id}`,
      openLabel: linkedTask ? "Open linked task" : "Source unavailable",
      ownerLabel: formatOwnerLabel(
        purchase.requestedById ? lookup.membersById[purchase.requestedById]?.name : null,
      ),
      priorityLabel: purchase.estimatedCost > 250 ? "high" : "medium",
      recordId: linkedTask?.id ?? purchase.id,
      sourceLabel: "Purchase approval",
      sourceType: "purchase",
      statusLabel: purchase.status,
      title: purchase.title,
    });
  }

  for (const risk of riskReviewItems) {
    const sourceTask = lookup.taskByReportId.get(risk.sourceId);
    const mitigationTask = risk.mitigationTaskId ? lookup.tasksById[risk.mitigationTaskId] : null;
    const taskContext = mitigationTask ?? sourceTask;

    items.push({
      actionType: "open-risk",
      contextLabel: taskContext ? pickTaskContextLabel(taskContext, lookup) : "Scope unknown",
      id: `mentor-risk-review-${risk.id}`,
      openLabel: "Open risk",
      ownerLabel: formatOwnerLabel(
        taskContext?.mentorId
          ? lookup.membersById[taskContext.mentorId]?.name
          : taskContext?.ownerId
            ? lookup.membersById[taskContext.ownerId]?.name
            : null,
      ),
      priorityLabel: risk.severity,
      recordId: risk.id,
      sourceLabel: "Risk review",
      sourceType: "risk",
      statusLabel: risk.mitigationTaskId ? "Mitigation review" : "Needs mitigation",
      title: risk.title,
    });
  }

  for (const staleResult of staleTaskResults) {
    const task = staleResult.task;
    if (queuedTaskIds.has(task.id) || !task.mentorId) {
      continue;
    }

    items.push(
      buildTaskQueueItem({
        idPrefix: "mentor-stale-task",
        lookup,
        sourceLabel: "Stale mentor task",
        sourceType: "task",
        statusLabel: staleResult.primaryIssue,
        task,
      }),
    );
    queuedTaskIds.add(task.id);
  }

  return items.sort((left, right) => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const leftPriority = priorityOrder[left.priorityLabel] ?? 2;
    const rightPriority = priorityOrder[right.priorityLabel] ?? 2;
    if (leftPriority === rightPriority) {
      return left.title.localeCompare(right.title);
    }

    return leftPriority - rightPriority;
  });
}
