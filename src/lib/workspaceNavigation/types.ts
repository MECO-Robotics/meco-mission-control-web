import type { ReactNode } from "react";

export type ViewTab =
  | "home"
  | "tasks"
  | "worklogs"
  | "risks"
  | "documents"
  | "inventory"
  | "cad"
  | "subsystems"
  | "roster"
  | "teams"
  | "help";

export type NavigationSection = "home" | "work" | "resources" | "team";

export type ViewAvailabilityContext =
  | "all-project"
  | "robot-project"
  | "non-robot-project"
  | "no-project"
  | "no-season";

export type TaskViewTab = "calendar" | "timeline" | "robot-map" | "kanban" | "agenda";
export type WorklogsViewTab = "logs" | "activity" | "qa" | "results";
export type InventoryViewTab = "materials" | "documents" | "parts" | "part-mappings" | "purchases";
export type NavigationSubItemId =
  | "home" | "work-tasks" | "work-schedule" | "work-activity" | "work-risks"
  | "resources-materials" | "resources-documents" | "resources-qa-reports" | "resources-parts"
  | "resources-purchases" | "resources-structure"
  | "team-people" | "team-teams";

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
  worklogsView?: WorklogsViewTab;
  inventoryView?: InventoryViewTab;
}

export interface NavigationState {
  activeTab: ViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
  inventoryView: InventoryViewTab;
}

export interface NavigationSubItem {
  id: NavigationSubItemId;
  label: string;
  section: NavigationSection;
  target: NavigationTarget;
  icon: string;
}

export interface ViewAvailabilityScope {
  context: ViewAvailabilityContext;
  visibleTabs?: ReadonlySet<ViewTab>;
}
