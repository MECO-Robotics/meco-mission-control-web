import type { AttentionActionType, AttentionViewModel } from "./attentionViewTypes";

export interface AttentionQueueRow {
  key: string;
  recordId: string;
  source: string;
  action: AttentionActionType;
  title: string;
  context: string;
  reasons: string[];
  needsReview: boolean;
  urgency: number;
}

// Multiple signals about one record belong to one row, with all reasons retained.
export function buildAttentionQueue(model: AttentionViewModel): AttentionQueueRow[] {
  const rows = new Map<string, AttentionQueueRow>();
  const add = (row: Omit<AttentionQueueRow, "key" | "urgency"> & { urgency?: number }) => {
    const key = `${row.action ?? row.source}:${row.recordId}`;
    const existing = rows.get(key);
    if (existing) {
      existing.reasons = [...new Set([...existing.reasons, ...row.reasons].filter(Boolean))];
      existing.needsReview ||= row.needsReview;
      existing.urgency = Math.max(existing.urgency, row.urgency ?? 0);
      if (row.source === "qa") existing.source = "qa";
    } else rows.set(key, { ...row, urgency: row.urgency ?? 0, key });
  };
  for (const item of model.actionNowItems) add({ recordId: item.recordId, source: item.sourceType, action: item.actionType, title: item.title, context: [item.ownerLabel, item.contextLabel].filter(Boolean).join(" · "), reasons: [item.whyNow, item.nextAction], needsReview: item.sourceType === "qa", urgency: item.urgencyScore });
  for (const item of model.mentorQueueItems) add({ recordId: item.recordId, source: item.sourceType, action: item.actionType, title: item.title, context: [item.ownerLabel, item.contextLabel].filter(Boolean).join(" · "), reasons: [item.sourceLabel], needsReview: true, urgency: item.priorityLabel === "critical" ? 100 : item.priorityLabel === "high" ? 75 : 0 });
  for (const group of model.triageGroups) for (const item of group.items) add({ recordId: item.recordId, source: item.kind === "report" ? "qa" : item.kind, action: item.actionType, title: item.title, context: [item.ownerLabel, item.contextLabel].filter(Boolean).join(" · "), reasons: [group.title, item.subtitle], needsReview: item.kind === "report", urgency: triageUrgency(group.id, item.severityLabel) });
  return [...rows.values()].sort((left, right) => right.urgency - left.urgency);
}

function triageUrgency(groupId: string, severity: string) {
  if (groupId === "blocked-tasks") return 90;
  if (groupId === "overdue") return 80;
  if (groupId === "waiting-qa") return 60;
  if (groupId === "due-soon") return 40;
  if (groupId === "open-risks") return severity === "critical" ? 100 : severity === "high" ? 75 : severity === "medium" ? 50 : 25;
  return 0;
}
