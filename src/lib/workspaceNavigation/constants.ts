import type { NavigationSection, NavigationSubItem, ViewTab } from "./types";
import sidebarItems from "@/components/layout/sidebar/sidebarItems.json";
import { validateSidebarCatalog } from "@/components/layout/sidebar/catalog";

export const NAVIGATION_SECTION_ORDER: readonly NavigationSection[] = ["work", "resources"];
export const NAVIGATION_SECTION_LABELS: Record<NavigationSection, string> = {
  home: "Home", work: "Work", resources: "Resources", team: "Team",
};
/* Generated from the editable sidebar catalog. */
export const NAVIGATION_SUB_ITEMS: readonly NavigationSubItem[] = validateSidebarCatalog(
  sidebarItems.filter((item) => item.id !== "scope-panels"),
);
export const NAVIGATION_SUB_ITEMS_BY_SECTION: Record<NavigationSection, readonly NavigationSubItem[]> = {
  home: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "home"),
  work: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "work"),
  resources: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "resources"),
  team: NAVIGATION_SUB_ITEMS.filter((item) => item.section === "team"),
};
export const BASE_SECTION_LABELS: Record<ViewTab, string> = {
  home: "Home", tasks: "Kanban", worklogs: "History", risks: "Risks", documents: "Documents",
  inventory: "Resources", cad: "Import CAD", subsystems: "Structure", roster: "People", help: "Help",
};
