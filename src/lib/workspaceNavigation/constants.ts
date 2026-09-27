import type { NavigationSection, NavigationSubItem, ViewTab } from "./types";
import sidebarCatalog from "@/components/layout/sidebar/sidebarItems.json";

export const NAVIGATION_SECTION_ORDER: readonly NavigationSection[] = ["work", "resources"];
export const NAVIGATION_SECTION_LABELS: Record<NavigationSection, string> = {
  home: "Home", work: "Work", resources: "Resources", team: "Team",
};
/* Generated from the editable sidebar catalog. */
export const NAVIGATION_SUB_ITEMS: readonly NavigationSubItem[] = sidebarCatalog
  .filter((item) => item.id !== "scope-panels") as NavigationSubItem[];
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
