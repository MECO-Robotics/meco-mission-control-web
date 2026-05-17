export interface ScopeMetricRow {
  id: string;
  name: string;
  subtitle: string;
  taskCount: number;
  activeTaskCount: number;
  inProgressTaskCount: number;
  completeTaskCount: number;
  waitingForQaCount: number;
  blockerCount: number;
  plannedHours: number;
  loggedHours: number;
  taskCompletionRate: number;
  qaPassCount: number;
  lastActivityAgeDays: number | null;
  ownerLabel: string | null;
  mostSevereReason: string | null;
  oldestBlockerAgeDays: number | null;
}
