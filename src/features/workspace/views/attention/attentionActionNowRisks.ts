import type { BootstrapPayload } from "@/types/bootstrap";
import {
  addReason,
  formatBlockedImpact,
  pickTaskContextLabel,
  scoreAttentionItem,
  type AttentionLookup,
} from "./attentionActionNowShared";
import { formatOwnerLabel, isDateOverdue, mergeLatestTimestamp } from "./attentionViewHelpers";
import type { AttentionNowItem, AttentionReason } from "./attentionViewTypes";

interface BuildRiskActionItemsArgs {
  criticalRisks: BootstrapPayload["risks"];
  downstreamByTaskId: Map<string, number>;
  highRisks: BootstrapPayload["risks"];
  lookup: AttentionLookup;
  reportsById: Record<string, BootstrapPayload["reports"][number]>;
  taskLastUpdatedAtById: Map<string, string>;
}

export function buildRiskActionItems({
  criticalRisks,
  downstreamByTaskId,
  highRisks,
  lookup,
  reportsById,
  taskLastUpdatedAtById,
}: BuildRiskActionItemsArgs) {
  const items: AttentionNowItem[] = [];

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

  return items;
}
