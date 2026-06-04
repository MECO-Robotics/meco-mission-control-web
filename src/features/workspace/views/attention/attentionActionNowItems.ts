import type { BootstrapPayload } from "@/types/bootstrap";
import { buildSupplyAndQualityActionItems } from "./attentionActionNowSupplyQuality";
import {
  buildTaskDownstreamCount,
  buildTaskLastUpdatedAtById,
  indexLinkedTasksBySupplyId,
  sortAttentionItemsByUrgency,
  type AttentionLookup,
} from "./attentionActionNowShared";
import { buildTaskAndRiskActionItems } from "./attentionActionNowTaskRisk";
import type { StaleTaskResult } from "./staleTaskDetector";
import type { AttentionNowItem } from "./attentionViewTypes";

interface BuildAttentionActionNowItemsArgs {
  blockedTasks: BootstrapPayload["tasks"];
  bootstrap: BootstrapPayload;
  criticalRisks: BootstrapPayload["risks"];
  failedQaReviews: NonNullable<BootstrapPayload["qaReviews"]>;
  failedReports: BootstrapPayload["reports"];
  highRisks: BootstrapPayload["risks"];
  lookup: AttentionLookup;
  manufacturingBlockers: BootstrapPayload["manufacturingItems"];
  overdueTasks: BootstrapPayload["tasks"];
  purchaseDelays: BootstrapPayload["purchaseItems"];
  staleTaskResults: StaleTaskResult[];
  waitingQaTasks: BootstrapPayload["tasks"];
}

export function buildAttentionActionNowItems({
  blockedTasks,
  bootstrap,
  criticalRisks,
  failedQaReviews,
  failedReports,
  highRisks,
  lookup,
  manufacturingBlockers,
  overdueTasks,
  purchaseDelays,
  staleTaskResults,
  waitingQaTasks,
}: BuildAttentionActionNowItemsArgs): AttentionNowItem[] {
  const taskLastUpdatedAtById = buildTaskLastUpdatedAtById(bootstrap);
  const downstreamByTaskId = buildTaskDownstreamCount(bootstrap.tasks);
  const purchaseLinkedTasksById = indexLinkedTasksBySupplyId({
    key: "linkedPurchaseIds",
    tasks: bootstrap.tasks,
  });
  const manufacturingLinkedTasksById = indexLinkedTasksBySupplyId({
    key: "linkedManufacturingIds",
    tasks: bootstrap.tasks,
  });
  const reportsById = Object.fromEntries(
    bootstrap.reports.map((report) => [report.id, report] as const),
  );
  const taskBlockersByTaskId = new Map<string, NonNullable<BootstrapPayload["taskBlockers"]>>();
  for (const blocker of bootstrap.taskBlockers ?? []) {
    if (blocker.status !== "open") {
      continue;
    }

    const taskBlockers = taskBlockersByTaskId.get(blocker.blockedTaskId) ?? [];
    taskBlockers.push(blocker);
    taskBlockersByTaskId.set(blocker.blockedTaskId, taskBlockers);
  }

  const { items: taskAndRiskItems } = buildTaskAndRiskActionItems({
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
  });
  const supplyAndQualityItems = buildSupplyAndQualityActionItems({
    failedQaReviews,
    failedReports,
    lookup,
    manufacturingBlockers,
    manufacturingLinkedTasksById,
    purchaseDelays,
    purchaseLinkedTasksById,
    taskLastUpdatedAtById,
  });

  return sortAttentionItemsByUrgency([...taskAndRiskItems, ...supplyAndQualityItems]);
}
