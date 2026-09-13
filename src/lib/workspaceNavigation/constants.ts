import type { NavigationSection, NavigationSubItem, ViewTab } from "./types";
import sidebarItems from "@/components/layout/sidebar/sidebarItems.json";

export const NAVIGATION_SECTION_ORDER: readonly NavigationSection[] = ["work", "resources"];
export const NAVIGATION_SECTION_LABELS: Record<NavigationSection, string> = {
  home: "Home", work: "Work", resources: "Resources", team: "Team",
};
/* Generated from the editable sidebar catalog. */
export const NAVIGATION_SUB_ITEMS: readonly NavigationSubItem[] = sidebarItems as NavigationSubItem[];
/* Legacy inline catalog retained below only as a reference during migration. */
/*
  { id: "home", label: "Dashboard", section: "work", target: { tab: "home" } },
  { id: "work-tasks", label: "Tasks", section: "work", target: { tab: "tasks", taskView: "queue" } },
  { id: "work-schedule", label: "Schedule", section: "work", target: { tab: "tasks", taskView: "calendar" } },
  { id: "resources-materials", label: "Materials", section: "resources", target: { tab: "inventory", inventoryView: "materials" } },
  { id: "resources-documents", label: "Documents", section: "resources", target: { tab: "inventory", inventoryView: "documents" } },
  { id: "resources-parts", label: "Parts", section: "resources", target: { tab: "inventory", inventoryView: "parts" } },
  { id: "resources-purchases", label: "Purchases", section: "resources", target: { tab: "inventory", inventoryView: "purchases" } },
  { id: "work-manufacturing", label: "Manufacturing", section: "work", target: { tab: "manufacturing", manufacturingView: "all" } },
  { id: "resources-structure", label: "Robot", section: "work", target: { tab: "tasks", taskView: "robot-map" } },
  { id: "team-people", label: "People", section: "resources", target: { tab: "roster", rosterView: "directory" } },
]; */
export const NAVIGATION_SUB_ITEMS_BY_SECTION: Record<NavigationSection, readonly NavigationSubItem[]> = {
  home: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "home"),
  work: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "work"),
  resources: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "resources"),
  team: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "team"),
};
export const BASE_SECTION_LABELS: Record<ViewTab, string> = {
  home: "Home", tasks: "Work", worklogs: "History",
  manufacturing: "Manufacturing", inventory: "Resources", cad: "Import CAD", subsystems: "Structure", roster: "People", help: "Help",
};
