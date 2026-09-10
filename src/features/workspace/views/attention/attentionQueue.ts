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
}

// Multiple signals about one record belong to one row, with all reasons retained.
export function buildAttentionQueue(model: AttentionViewModel): AttentionQueueRow[] {
  const rows = new Map<string, AttentionQueueRow>();
  const add = (row: Omit<AttentionQueueRow, "key">) => {
    const key = `${row.action ?? row.source}:${row.recordId}`;
    const existing = rows.get(key);
    if (existing) {
      existing.reasons = [...new Set([...existing.reasons, ...row.reasons].filter(Boolean))];
      existing.needsReview ||= row.needsReview;
      if (row.source === "qa") existing.source = "qa";
    } else rows.set(key, { ...row, key });
  };
  for (const item of model.actionNowItems) add({ recordId: item.recordId, source: item.sourceType, action: item.actionType, title: item.title, context: [item.ownerLabel, item.contextLabel].filter(Boolean).join(" · "), reasons: [item.whyNow, item.nextAction], needsReview: item.sourceType === "qa" });
  for (const item of model.mentorQueueItems) add({ recordId: item.recordId, source: item.sourceType, action: item.actionType, title: item.title, context: [item.ownerLabel, item.contextLabel].filter(Boolean).join(" · "), reasons: [item.sourceLabel], needsReview: true });
  for (const group of model.triageGroups) for (const item of group.items) add({ recordId: item.recordId, source: item.kind === "report" ? "qa" : item.kind, action: item.actionType, title: item.title, context: [item.ownerLabel, item.contextLabel].filter(Boolean).join(" · "), reasons: [group.title, item.subtitle], needsReview: item.kind === "report" });
  return [...rows.values()];
}
