import type { NavigationSection, NavigationSubItem, ViewTab } from "./types";

export const NAVIGATION_SECTION_ORDER: readonly NavigationSection[] = ["home", "work", "resources", "team"];
export const NAVIGATION_SECTION_LABELS: Record<NavigationSection, string> = {
  home: "Home", work: "Work", resources: "Resources", team: "Team",
};
export const NAVIGATION_SUB_ITEMS: readonly NavigationSubItem[] = [
  { id: "home", label: "Home", section: "home", target: { tab: "home" } },
  { id: "work-tasks", label: "Tasks", section: "work", target: { tab: "tasks", taskView: "queue" } },
  { id: "work-schedule", label: "Schedule", section: "work", target: { tab: "tasks", taskView: "calendar" } },
  { id: "work-risks", label: "Risks", section: "work", target: { tab: "risk-management", riskManagementView: "kanban" } },
  { id: "work-activity", label: "Activity", section: "work", target: { tab: "worklogs", worklogsView: "logs" } },
  { id: "resources-materials", label: "Materials", section: "resources", target: { tab: "inventory", inventoryView: "materials" } },
  { id: "resources-documents", label: "Documents", section: "resources", target: { tab: "inventory", inventoryView: "materials" } },
  { id: "resources-parts", label: "Parts", section: "resources", target: { tab: "inventory", inventoryView: "parts" } },
  { id: "resources-purchases", label: "Purchases", section: "resources", target: { tab: "inventory", inventoryView: "purchases" } },
  { id: "resources-manufacturing", label: "Manufacturing", section: "resources", target: { tab: "manufacturing", manufacturingView: "all" } },
  { id: "resources-structure", label: "Structure", section: "resources", target: { tab: "tasks", taskView: "robot-map" } },
  { id: "team-people", label: "People", section: "team", target: { tab: "roster", rosterView: "directory" } },
  { id: "team-attendance", label: "Attendance", section: "team", target: { tab: "roster", rosterView: "attendance" } },
];
export const NAVIGATION_SUB_ITEMS_BY_SECTION: Record<NavigationSection, readonly NavigationSubItem[]> = {
  home: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "home"),
  work: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "work"),
  resources: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "resources"),
  team: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "team"),
};
export const BASE_SECTION_LABELS: Record<ViewTab, string> = {
  home: "Home", tasks: "Work", "risk-management": "Risks", worklogs: "Activity",
  manufacturing: "Manufacturing", inventory: "Resources", cad: "Import CAD", subsystems: "Structure", roster: "People", help: "Help",
};
