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
  | "tasks"
  | "inventory"
  | "roster"
  | "reports";

export type TaskViewTab = "calendar" | "timeline" | "queue" | "milestones";
export type RiskManagementViewTab = "kanban" | "metrics";
export type WorklogsViewTab = "logs" | "summary";
export type ReportsViewTab = "qa" | "milestone-results";
export type ManufacturingViewTab = "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "purchases";
export type RosterViewTab = "workload" | "directory" | "attendance";

export type NavigationSubItemId =
  | "dashboard-calendar"
  | "dashboard-metrics"
  | "readiness-attention"
  | "readiness-milestones"
  | "readiness-subsystems"
  | "tasks-timeline"
  | "tasks-board"
  | "tasks-manufacturing"
  | "inventory-materials"
  | "inventory-parts"
  | "inventory-purchases"
  | "roster-workload"
  | "roster-directory"
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

export interface NavigationSubItem {
  id: NavigationSubItemId;
  label: string;
  section: NavigationSection;
  target: NavigationTarget;
}

export const TASK_VIEW_ORDER: readonly TaskViewTab[] = [
  "calendar",
  "timeline",
  "queue",
  "milestones",
];
export const RISK_MANAGEMENT_VIEW_ORDER: readonly RiskManagementViewTab[] = [
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
  "purchases",
];

export const NAVIGATION_SECTION_ORDER: readonly NavigationSection[] = [
  "dashboard",
  "readiness",
  "tasks",
  "inventory",
  "roster",
  "reports",
];

export const NAVIGATION_SECTION_LABELS: Record<NavigationSection, string> = {
  dashboard: "Dashboard",
  readiness: "Readiness",
  tasks: "Work",
  inventory: "Inventory",
  roster: "Roster",
  reports: "Reports",
};

export const TASK_VIEW_OPTIONS: readonly ViewOption<TaskViewTab>[] = [
  { value: "calendar", label: "Calendar" },
  { value: "timeline", label: "Timeline" },
  { value: "queue", label: "Tasks" },
  { value: "milestones", label: "Milestones" },
];

export const RISK_MANAGEMENT_VIEW_OPTIONS: readonly ViewOption<RiskManagementViewTab>[] = [
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
    id: "dashboard-metrics",
    label: "Metrics",
    section: "dashboard",
    target: { tab: "risk-management", riskManagementView: "metrics" },
  },
  {
    id: "readiness-attention",
    label: "Risks",
    section: "readiness",
    target: { tab: "risk-management", riskManagementView: "kanban" },
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
    id: "roster-directory",
    label: "Directory",
    section: "roster",
    target: { tab: "roster", rosterView: "directory" },
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
  tasks: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "tasks"),
  inventory: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "inventory"),
  roster: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "roster"),
  reports: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "reports"),
};

export function getActiveNavigationSubItemId({
  activeTab,
  inventoryView,
  rosterView,
  reportsView,
  riskManagementView,
  taskView,
  worklogsView,
}: {
  activeTab: ViewTab;
  inventoryView: InventoryViewTab;
  rosterView: RosterViewTab;
  reportsView: ReportsViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
}): NavigationSubItemId {
  if (activeTab === "tasks") {
    if (taskView === "calendar") {
      return "dashboard-calendar";
    }

    if (taskView === "timeline") {
      return "tasks-timeline";
    }

    if (taskView === "queue") {
      return "tasks-board";
    }

    return "readiness-milestones";
  }

  if (activeTab === "risk-management") {
    return riskManagementView === "metrics"
      ? "dashboard-metrics"
      : "readiness-attention";
  }

  if (activeTab === "manufacturing") {
    return "tasks-manufacturing";
  }

  if (activeTab === "inventory") {
    if (inventoryView === "parts") {
      return "inventory-parts";
    }

    if (inventoryView === "purchases") {
      return "inventory-purchases";
    }

    return "inventory-materials";
  }

  if (activeTab === "roster") {
    if (rosterView === "workload") {
      return "roster-workload";
    }

    if (rosterView === "attendance") {
      return "roster-attendance";
    }

    return "roster-directory";
  }

  if (activeTab === "subsystems") {
    return "readiness-subsystems";
  }

  if (activeTab === "worklogs") {
    return worklogsView === "summary"
      ? "reports-work-logs"
      : "reports-work-logs";
  }

  if (activeTab === "reports") {
    return reportsView === "milestone-results"
      ? "reports-milestone-results"
      : "reports-qa-forms";
  }

  return "readiness-attention";
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
