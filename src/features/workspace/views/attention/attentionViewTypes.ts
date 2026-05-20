export type AttentionItemKind = "risk" | "task" | "manufacturing" | "purchase" | "report";
export type AttentionActionType = "open-risk" | "open-task" | null;
export type AttentionSummaryCategory = "risk" | "flow" | "supply" | "quality";
export type AttentionNowSourceType = "risk" | "task" | "qa" | "purchase" | "manufacturing";
export type AttentionReason =
  | "critical-risk"
  | "high-risk"
  | "blocked"
  | "waiting-qa"
  | "overdue"
  | "mfg-blocker"
  | "purchase-delay"
  | "failed-qa"
  | "stale"
  | "missing-owner"
  | "missing-mitigation";

export interface AttentionSummaryCard {
  category: AttentionSummaryCategory;
  helperLabel?: string;
  id: string;
  label: string;
  targetGroupId?: string;
  value: number;
}

export interface AttentionSummaryGroup {
  id: AttentionSummaryCategory;
  label: string;
  cards: AttentionSummaryCard[];
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

export interface AttentionNowItem {
  actionType: AttentionActionType;
  blockingImpact?: string;
  contextLabel?: string;
  dueDate?: string;
  id: string;
  lastUpdatedAt?: string;
  nextAction: string;
  openLabel: string;
  ownerLabel?: string;
  reasons: AttentionReason[];
  recordId: string;
  severityLabel?: string;
  sourceType: AttentionNowSourceType;
  statusLabel?: string;
  title: string;
  urgencyScore: number;
  whyNow: string;
}

export interface AttentionViewModel {
  actionNowItems: AttentionNowItem[];
  summaryGroups: AttentionSummaryGroup[];
  triageGroups: AttentionTriageGroup[];
}
