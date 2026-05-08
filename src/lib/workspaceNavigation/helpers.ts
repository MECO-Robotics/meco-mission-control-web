import { NAVIGATION_SUB_ITEMS } from "./constants";
import type {
  NavigationSection,
  NavigationState,
  NavigationSubItemId,
  NavigationTarget,
} from "./types";

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
