import { useCallback, useMemo } from "react";

import {
  NAVIGATION_SECTION_ORDER,
  NAVIGATION_SUB_ITEMS,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  type InventoryViewTab,
  type ManufacturingViewTab,
  type NavigationItem,
  type NavigationSection,
  type NavigationSubItemId,
  type ReportsViewTab,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
} from "@/lib/workspaceNavigation";

import type { SidebarSubItemModel } from "../AppSidebarSections";

interface UseAppSidebarNavigationModelsArgs {
  activeTab: ViewTab;
  favoriteViewIds: readonly NavigationSubItemId[];
  inventoryView: InventoryViewTab;
  manufacturingView: ManufacturingViewTab;
  isRobotProject: boolean;
  items: NavigationItem[];
  reportsView: ReportsViewTab;
  rosterView: RosterViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
}

export function useAppSidebarNavigationModels({
  activeTab,
  favoriteViewIds,
  inventoryView,
  manufacturingView,
  isRobotProject,
  items,
  reportsView,
  rosterView,
  riskManagementView,
  taskView,
  worklogsView,
}: UseAppSidebarNavigationModelsArgs) {
  const visibleTabs = useMemo(() => new Set(items.map((item) => item.value)), [items]);
  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab,
    inventoryView,
    manufacturingView,
    rosterView,
    reportsView,
    riskManagementView,
    taskView,
    worklogsView,
  });
  const activeSection = activeSubItemId
    ? getNavigationSectionFromSubItem(activeSubItemId)
    : null;
  const isSubItemEnabled = useCallback(
    (subItemId: NavigationSubItemId) => {
      const subItem = NAVIGATION_SUB_ITEMS.find((item) => item.id === subItemId);
      if (subItem && !visibleTabs.has(subItem.target.tab)) {
        return false;
      }

      return subItemId === "config-robot-model" ||
        subItemId === "config-cad" ||
        subItemId === "config-part-mappings" ||
        subItemId === "inventory-parts"
        ? isRobotProject
        : true;
    },
    [isRobotProject, visibleTabs],
  );
  const getSectionSubItems = useCallback(
    (section: NavigationSection): SidebarSubItemModel[] =>
      NAVIGATION_SUB_ITEMS_BY_SECTION[section].map((subItem) => ({
        ...subItem,
        isEnabled: isSubItemEnabled(subItem.id),
      })),
    [isSubItemEnabled],
  );
  const sectionModels = useMemo(
    () =>
      NAVIGATION_SECTION_ORDER.map((section) => {
        const subItems = getSectionSubItems(section);
        return {
          section,
          subItems,
          isEnabled: subItems.some((subItem) => subItem.isEnabled),
        };
      }),
    [getSectionSubItems],
  );
  const favoriteSubItems = useMemo(() => {
    const requestedFavoriteIds = new Set(favoriteViewIds);
    return NAVIGATION_SUB_ITEMS
      .filter((subItem) => requestedFavoriteIds.has(subItem.id))
      .map((subItem) => ({
        ...subItem,
        isEnabled: isSubItemEnabled(subItem.id),
      }));
  }, [favoriteViewIds, isSubItemEnabled]);

  return {
    activeSection,
    activeSubItemId,
    favoriteSubItems,
    getSectionSubItems,
    sectionModels,
  };
}
