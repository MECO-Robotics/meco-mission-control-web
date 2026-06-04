import { useCallback, useMemo } from "react";

import {
  NAVIGATION_SECTION_ORDER,
  NAVIGATION_SUB_ITEMS,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  isNavigationSubItemAvailable,
  type InventoryViewTab,
  type ManufacturingViewTab,
  type NavigationItem,
  type NavigationSection,
  type NavigationSubItemId,
  type ReportsViewTab,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewAvailabilityContext,
  type ViewTab,
  type WorklogsViewTab,
} from "@/lib/workspaceNavigation";

import type { SidebarSubItemModel } from "../AppSidebarSections";

interface UseAppSidebarNavigationModelsArgs {
  activeTab: ViewTab;
  favoriteViewIds: readonly NavigationSubItemId[];
  inventoryView: InventoryViewTab;
  manufacturingView: ManufacturingViewTab;
  items: NavigationItem[];
  reportsView: ReportsViewTab;
  rosterView: RosterViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  viewAvailabilityContext: ViewAvailabilityContext;
  worklogsView: WorklogsViewTab;
}

export function useAppSidebarNavigationModels({
  activeTab,
  favoriteViewIds,
  inventoryView,
  manufacturingView,
  items,
  reportsView,
  rosterView,
  riskManagementView,
  taskView,
  viewAvailabilityContext,
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
    (subItemId: NavigationSubItemId) =>
      isNavigationSubItemAvailable(subItemId, {
        context: viewAvailabilityContext,
        visibleTabs,
      }),
    [viewAvailabilityContext, visibleTabs],
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
