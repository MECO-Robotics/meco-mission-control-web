import type { ReactNode } from "react";

export type ViewTab =
  | "home"
  | "tasks"
  | "risk-management"
  | "worklogs"
  | "reports"
  | "manufacturing"
  | "inventory"
  | "cad"
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

export type ViewAvailabilityContext =
  | "all-project"
  | "robot-project"
  | "non-robot-project"
  | "no-project"
  | "no-season";

export type TaskViewTab = "calendar" | "timeline" | "robot-map" | "queue" | "milestones";
export type RiskManagementViewTab = "attention" | "kanban" | "metrics";
export type WorklogsViewTab = "logs" | "summary" | "activity" | "kanban";
export type ReportsViewTab = "qa" | "milestone-results";
export type ManufacturingViewTab = "all" | "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "part-mappings" | "purchases";
export type RosterViewTab = "available" | "workload" | "directory" | "attendance";

export type NavigationSubItemId =
  | "dashboard-calendar"
  | "dashboard-activity"
  | "dashboard-metrics"
  | "readiness-attention"
  | "readiness-milestones"
  | "readiness-subsystems"
  | "readiness-risks"
  | "config-robot-model"
  | "config-cad"
  | "config-part-mappings"
  | "config-directory"
  | "tasks-timeline"
  | "tasks-board"
  | "tasks-manufacturing"
  | "inventory-materials"
  | "inventory-parts"
  | "inventory-purchases"
  | "roster-available"
  | "roster-workload"
  | "roster-attendance"
  | "reports-worklogs-kanban"
  | "reports-worklogs"
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

export interface ViewAvailabilityScope {
  context: ViewAvailabilityContext;
  visibleTabs?: ReadonlySet<ViewTab>;
}
