import type { ReactNode } from "react";

export type ViewTab =
  | "tasks"
  | "risk-management"
  | "worklogs"
  | "reports"
  | "manufacturing"
  | "inventory"
  | "subsystems"
  | "roster"
  | "help";

export type NavigationSection =
  | "dashboard"
  | "readiness"
  | "config"
  | "tasks"
  | "inventory"
  | "roster"
  | "reports";

export type TaskViewTab = "calendar" | "timeline" | "robot-map" | "queue" | "milestones";
export type RiskManagementViewTab = "attention" | "kanban" | "metrics";
export type WorklogsViewTab = "logs" | "summary" | "activity";
export type ReportsViewTab = "qa" | "milestone-results";
export type ManufacturingViewTab = "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "part-mappings" | "purchases";
export type RosterViewTab = "workload" | "directory" | "attendance";

export type NavigationSubItemId =
  | "dashboard-calendar"
  | "dashboard-activity"
  | "dashboard-metrics"
  | "readiness-attention"
  | "readiness-milestones"
  | "readiness-subsystems"
  | "readiness-risks"
  | "config-robot-model"
  | "config-part-mappings"
  | "config-directory"
  | "tasks-timeline"
  | "tasks-board"
  | "tasks-manufacturing"
  | "inventory-materials"
  | "inventory-parts"
  | "inventory-purchases"
  | "roster-workload"
  | "roster-attendance"
  | "reports-work-logs"
  | "reports-qa-forms"
  | "reports-milestone-results";

export interface NavigationItem {
  value: ViewTab;
  label: string;
  icon: ReactNode;
  count: number;
}

export interface ViewOption<T extends string> {
  value: T;
  label: string;
}

export interface NavigationTarget {
  tab: ViewTab;
  taskView?: TaskViewTab;
  riskManagementView?: RiskManagementViewTab;
  worklogsView?: WorklogsViewTab;
  reportsView?: ReportsViewTab;
  inventoryView?: InventoryViewTab;
  manufacturingView?: ManufacturingViewTab;
  rosterView?: RosterViewTab;
}

export interface NavigationState {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  riskManagementView: RiskManagementViewTab;
  worklogsView: WorklogsViewTab;
  reportsView: ReportsViewTab;
  inventoryView: InventoryViewTab;
  manufacturingView: ManufacturingViewTab;
  rosterView: RosterViewTab;
}

export interface NavigationSubItem {
  id: NavigationSubItemId;
  label: string;
  section: NavigationSection;
  target: NavigationTarget;
}
