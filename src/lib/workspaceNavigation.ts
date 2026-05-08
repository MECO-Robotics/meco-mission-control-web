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

export const TASK_VIEW_ORDER: readonly TaskViewTab[] = [
  "calendar",
  "timeline",
  "robot-map",
  "queue",
  "milestones",
];
export const RISK_MANAGEMENT_VIEW_ORDER: readonly RiskManagementViewTab[] = [
  "attention",
  "kanban",
  "metrics",
];
export const WORKLOG_VIEW_ORDER: readonly WorklogsViewTab[] = [
  "logs",
  "summary",
];
export const REPORTS_VIEW_ORDER: readonly ReportsViewTab[] = ["qa", "milestone-results"];
export const MANUFACTURING_VIEW_ORDER: readonly ManufacturingViewTab[] = [
  "cnc",
  "prints",
  "fabrication",
];
export const INVENTORY_VIEW_ORDER: readonly InventoryViewTab[] = [
  "materials",
  "parts",
  "part-mappings",
  "purchases",
];

export const NAVIGATION_SECTION_ORDER: readonly NavigationSection[] = [
  "dashboard",
  "readiness",
  "tasks",
  "inventory",
  "roster",
  "reports",
  "config",
];

export const NAVIGATION_SECTION_LABELS: Record<NavigationSection, string> = {
  dashboard: "Dashboard",
  readiness: "Readiness",
  config: "Config",
  tasks: "Work",
  inventory: "Inventory",
  roster: "Roster",
  reports: "Reports",
};

export const TASK_VIEW_OPTIONS: readonly ViewOption<TaskViewTab>[] = [
  { value: "calendar", label: "Calendar" },
  { value: "timeline", label: "Timeline" },
  { value: "robot-map", label: "Robot map" },
  { value: "queue", label: "Tasks" },
  { value: "milestones", label: "Milestones" },
];

export const RISK_MANAGEMENT_VIEW_OPTIONS: readonly ViewOption<RiskManagementViewTab>[] = [
  { value: "attention", label: "Attention" },
  { value: "kanban", label: "Risks" },
  { value: "metrics", label: "Metrics" },
];

export const WORKLOG_VIEW_OPTIONS: readonly ViewOption<WorklogsViewTab>[] = [
  { value: "logs", label: "Logs" },
  { value: "summary", label: "Summary" },
];

export const REPORTS_VIEW_OPTIONS: readonly ViewOption<ReportsViewTab>[] = [
  { value: "qa", label: "QA" },
  { value: "milestone-results", label: "Milestone Results" },
];

export const MANUFACTURING_VIEW_OPTIONS: readonly ViewOption<ManufacturingViewTab>[] = [
  { value: "cnc", label: "CNC" },
  { value: "prints", label: "3D print" },
  { value: "fabrication", label: "Fabrication" },
];

export const ROBOT_INVENTORY_VIEW_OPTIONS: readonly ViewOption<InventoryViewTab>[] = [
  { value: "materials", label: "Materials" },
  { value: "parts", label: "Parts" },
  { value: "purchases", label: "Purchases" },
];

export const NON_ROBOT_INVENTORY_VIEW_OPTIONS: readonly ViewOption<InventoryViewTab>[] = [
  { value: "materials", label: "Documents" },
  { value: "purchases", label: "Purchases" },
];

export const NAVIGATION_SUB_ITEMS: readonly NavigationSubItem[] = [
  {
    id: "dashboard-calendar",
    label: "Calendar",
    section: "dashboard",
    target: { tab: "tasks", taskView: "calendar" },
  },
  {
    id: "dashboard-activity",
    label: "Activity",
    section: "dashboard",
    target: { tab: "worklogs", worklogsView: "activity" },
  },
  {
    id: "dashboard-metrics",
    label: "Metrics",
    section: "dashboard",
    target: { tab: "risk-management", riskManagementView: "metrics" },
  },
  {
    id: "readiness-attention",
    label: "Attention",
    section: "readiness",
    target: { tab: "risk-management", riskManagementView: "attention" },
  },
  {
    id: "readiness-milestones",
    label: "Milestones",
    section: "readiness",
    target: { tab: "tasks", taskView: "milestones" },
  },
  {
    id: "readiness-subsystems",
    label: "Subsystems",
    section: "readiness",
    target: { tab: "subsystems" },
  },
  {
    id: "readiness-risks",
    label: "Risks",
    section: "readiness",
    target: { tab: "risk-management", riskManagementView: "kanban" },
  },
  {
    id: "config-robot-model",
    label: "Robot model",
    section: "config",
    target: { tab: "tasks", taskView: "robot-map" },
  },
  {
    id: "config-part-mappings",
    label: "Part mappings",
    section: "config",
    target: { tab: "inventory", inventoryView: "part-mappings" },
  },
  {
    id: "config-directory",
    label: "Directory",
    section: "config",
    target: { tab: "roster", rosterView: "directory" },
  },
  {
    id: "tasks-timeline",
    label: "Timeline",
    section: "tasks",
    target: { tab: "tasks", taskView: "timeline" },
  },
  {
    id: "tasks-board",
    label: "Tasks",
    section: "tasks",
    target: { tab: "tasks", taskView: "queue" },
  },
  {
    id: "tasks-manufacturing",
    label: "Manufacturing",
    section: "tasks",
    target: { tab: "manufacturing", manufacturingView: "cnc" },
  },
  {
    id: "inventory-materials",
    label: "Materials",
    section: "inventory",
    target: { tab: "inventory", inventoryView: "materials" },
  },
  {
    id: "inventory-parts",
    label: "Parts",
    section: "inventory",
    target: { tab: "inventory", inventoryView: "parts" },
  },
  {
    id: "inventory-purchases",
    label: "Purchases",
    section: "inventory",
    target: { tab: "inventory", inventoryView: "purchases" },
  },
  {
    id: "roster-workload",
    label: "Workload",
    section: "roster",
    target: { tab: "roster", rosterView: "workload" },
  },
  {
    id: "roster-attendance",
    label: "Attendance",
    section: "roster",
    target: { tab: "roster", rosterView: "attendance" },
  },
  {
    id: "reports-work-logs",
    label: "Work logs",
    section: "reports",
    target: { tab: "worklogs", worklogsView: "logs" },
  },
  {
    id: "reports-qa-forms",
    label: "QA forms",
    section: "reports",
    target: { tab: "reports", reportsView: "qa" },
  },
  {
    id: "reports-milestone-results",
    label: "Milestone results",
    section: "reports",
    target: { tab: "reports", reportsView: "milestone-results" },
  },
];

export const NAVIGATION_SUB_ITEMS_BY_SECTION: Record<
  NavigationSection,
  readonly NavigationSubItem[]
> = {
  dashboard: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "dashboard"),
  readiness: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "readiness"),
  config: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "config"),
  tasks: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "tasks"),
  inventory: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "inventory"),
  roster: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "roster"),
  reports: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "reports"),
};

function normalizeNavigationState(state: NavigationState): NavigationState {
  if (state.activeTab === "manufacturing") {
    return {
      ...state,
      manufacturingView: "cnc",
    };
  }

  if (state.activeTab === "worklogs" && state.worklogsView === "summary") {
    return {
      ...state,
      worklogsView: "logs",
    };
  }

  return state;
}

export function targetMatchesNavigationState(
  target: NavigationTarget,
  state: NavigationState,
): boolean {
  if (target.tab !== state.activeTab) {
    return false;
  }

  if (target.taskView && target.taskView !== state.taskView) {
    return false;
  }

  if (target.riskManagementView && target.riskManagementView !== state.riskManagementView) {
    return false;
  }

  if (target.worklogsView && target.worklogsView !== state.worklogsView) {
    return false;
  }

  if (target.reportsView && target.reportsView !== state.reportsView) {
    return false;
  }

  if (target.inventoryView && target.inventoryView !== state.inventoryView) {
    return false;
  }

  if (target.manufacturingView && target.manufacturingView !== state.manufacturingView) {
    return false;
  }

  if (target.rosterView && target.rosterView !== state.rosterView) {
    return false;
  }

  return true;
}

export function getActiveNavigationSubItemId(state: NavigationState): NavigationSubItemId | null {
  const normalizedState = normalizeNavigationState(state);
  const matchedSubItem = NAVIGATION_SUB_ITEMS.find((item) =>
    targetMatchesNavigationState(item.target, normalizedState),
  );

  return matchedSubItem?.id ?? null;
}

export function getNavigationSectionFromSubItem(
  subItemId: NavigationSubItemId,
): NavigationSection {
  return NAVIGATION_SUB_ITEMS.find((item) => item.id === subItemId)?.section ?? "dashboard";
}

export const BASE_SECTION_LABELS: Record<ViewTab, string> = {
  tasks: "Work",
  "risk-management": "Risk Management",
  worklogs: "Worklogs",
  reports: "Reports",
  manufacturing: "Manufacturing",
  inventory: "Inventory",
  subsystems: "Subsystems",
  roster: "Roster",
  help: "Help",
};
