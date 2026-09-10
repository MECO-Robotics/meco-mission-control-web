import { NAVIGATION_SUB_ITEMS } from "./constants";
import { NAVIGATION_SUB_ITEM_AVAILABILITY_MATRIX } from "./availability";
import type {
  NavigationSection,
  NavigationState,
  NavigationSubItemId,
  NavigationTarget,
  ViewAvailabilityContext,
  ViewAvailabilityScope,
} from "./types";

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

export function getActiveNavigationSubItemId(state: NavigationState, context?: ViewAvailabilityContext): NavigationSubItemId | null {
  switch (state.activeTab) {
    case "home": return "home";
    case "tasks": return state.taskView === "robot-map" ? "resources-structure" : state.taskView === "queue" ? "work-tasks" : "work-schedule";
    case "risk-management": return state.riskManagementView === "kanban" ? "work-risks" : "home";
    case "worklogs": return "work-activity";
    case "manufacturing": return "resources-manufacturing";
    case "cad": case "subsystems": return "resources-structure";
    case "roster": return state.rosterView === "attendance" ? "team-attendance" : "team-people";
    case "inventory": return state.inventoryView === "purchases" ? "resources-purchases" : state.inventoryView === "materials" ? context === "non-robot-project" ? "resources-documents" : "resources-materials" : "resources-parts";
    default: return null;
  }
}

export function getNavigationTarget(id: NavigationSubItemId, context: ViewAvailabilityContext): NavigationTarget {
  if (id === "resources-structure" && context === "non-robot-project") return { tab: "subsystems" };
  return NAVIGATION_SUB_ITEMS.find((item) => item.id === id)!.target;
}

export function getNavigationSectionFromSubItem(
  subItemId: NavigationSubItemId,
): NavigationSection {
  return NAVIGATION_SUB_ITEMS.find((item) => item.id === subItemId)?.section ?? "home";
}

const NAVIGATION_SUB_ITEM_ID_SET = new Set<string>(
  NAVIGATION_SUB_ITEMS.map((item) => item.id),
);

export function isNavigationSubItemId(value: string): value is NavigationSubItemId {
  return NAVIGATION_SUB_ITEM_ID_SET.has(value);
}

export function normalizeNavigationSubItemId(value: string): NavigationSubItemId | null {
  return isNavigationSubItemId(value) ? value : null;
}

export function resolveViewAvailabilityContext({
  hasProjects,
  hasSeasons,
  selectedProjectType,
}: {
  hasProjects: boolean;
  hasSeasons: boolean;
  selectedProjectType: "robot" | string | null;
}): ViewAvailabilityContext {
  if (!hasSeasons) {
    return "no-season";
  }

  if (selectedProjectType === "robot") {
    return "robot-project";
  }

  if (selectedProjectType !== null) {
    return "non-robot-project";
  }

  return hasProjects ? "all-project" : "no-project";
}

export function isNavigationSubItemAvailable(
  subItemId: NavigationSubItemId,
  scope: ViewAvailabilityScope,
): boolean {
  const subItem = NAVIGATION_SUB_ITEMS.find((item) => item.id === subItemId);
  if (!subItem) {
    return false;
  }

  if (scope.visibleTabs && !scope.visibleTabs.has(getNavigationTarget(subItemId, scope.context).tab)) {
    return false;
  }

  return NAVIGATION_SUB_ITEM_AVAILABILITY_MATRIX[subItemId][scope.context];
}

export function getAvailableNavigationSubItems(
  subItems: readonly { id: NavigationSubItemId }[],
  scope: ViewAvailabilityScope,
) {
  return subItems.filter((subItem) => isNavigationSubItemAvailable(subItem.id, scope));
}
