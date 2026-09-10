import type { ReactNode } from "react";

export type ViewTab =
  | "home"
  | "tasks"
  | "risk-management"
  | "worklogs"
  | "manufacturing"
  | "inventory"
  | "cad"
  | "subsystems"
  | "roster"
  | "help";

export type NavigationSection = "home" | "work" | "resources" | "team";

export type ViewAvailabilityContext =
  | "all-project"
  | "robot-project"
  | "non-robot-project"
  | "no-project"
  | "no-season";

export type TaskViewTab = "calendar" | "timeline" | "robot-map" | "queue" | "milestones";
export type RiskManagementViewTab = "attention" | "kanban" | "metrics";
export type WorklogsViewTab = "logs" | "activity" | "qa" | "results";
export type ManufacturingViewTab = "all" | "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "part-mappings" | "purchases";
export type RosterViewTab = "available" | "workload" | "directory" | "attendance";

export type NavigationSubItemId =
  | "home" | "work-tasks" | "work-schedule" | "work-risks" | "work-activity"
  | "resources-materials" | "resources-documents" | "resources-parts"
  | "resources-purchases" | "resources-manufacturing" | "resources-structure"
  | "team-people" | "team-attendance";

export interface NavigationItem {
  value: ViewTab;
  label: string;
  icon: ReactNode;
  count: number;
}

export interface NavigationTarget {
  milestoneId?: string;
  tab: ViewTab;
  taskView?: TaskViewTab;
  riskManagementView?: RiskManagementViewTab;
  worklogsView?: WorklogsViewTab;
  inventoryView?: InventoryViewTab;
  manufacturingView?: ManufacturingViewTab;
  rosterView?: RosterViewTab;
}

export interface NavigationState {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  riskManagementView: RiskManagementViewTab;
  worklogsView: WorklogsViewTab;
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
