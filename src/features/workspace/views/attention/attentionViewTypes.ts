export type AttentionItemKind = "risk" | "task" | "manufacturing" | "purchase" | "report";
export type AttentionActionType = "open-risk" | "open-task" | null;

export interface AttentionSummaryCard {
  id: string;
  label: string;
  value: number;
}

export interface AttentionTriageItem {
  actionType: AttentionActionType;
  contextLabel: string;
  id: string;
  kind: AttentionItemKind;
  ownerLabel: string;
  recordId: string;
  severityLabel: string;
  statusLabel: string;
  subtitle: string;
  title: string;
}

export interface AttentionTriageGroup {
  emptyLabel: string;
  id: string;
  items: AttentionTriageItem[];
  title: string;
}

export interface AttentionViewModel {
  summaryCards: AttentionSummaryCard[];
  triageGroups: AttentionTriageGroup[];
}
