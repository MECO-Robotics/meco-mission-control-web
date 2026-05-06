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

export type TaskViewTab = "timeline" | "queue" | "milestones";
export type RiskManagementViewTab = "kanban" | "metrics";
export type WorklogsViewTab = "logs" | "summary";
export type ReportsViewTab = "qa" | "milestone-results";
export type ManufacturingViewTab = "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "purchases";

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

export const TASK_VIEW_ORDER: readonly TaskViewTab[] = [
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

export const TASK_VIEW_OPTIONS: readonly ViewOption<TaskViewTab>[] = [
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

export const BASE_SECTION_LABELS: Record<ViewTab, string> = {
  tasks: "Tasks",
  "risk-management": "Risk Management",
  worklogs: "Worklogs",
  reports: "Reports",
  manufacturing: "Manufacturing",
  inventory: "Inventory",
  subsystems: "Subsystems",
  roster: "Roster",
  help: "Help",
};
