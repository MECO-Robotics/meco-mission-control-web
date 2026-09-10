import { useCallback, useMemo } from "react";

import {
  NAVIGATION_SECTION_ORDER,
  NAVIGATION_SUB_ITEMS,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  getActiveNavigationSubItemId,
  getNavigationTarget,
  getNavigationSectionFromSubItem,
  isNavigationSubItemAvailable,
  type InventoryViewTab,
  type ManufacturingViewTab,
  type NavigationSection,
  type NavigationSubItemId,
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
  rosterView,
  riskManagementView,
  taskView,
  viewAvailabilityContext,
  worklogsView,
}: UseAppSidebarNavigationModelsArgs) {
  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab,
    inventoryView,
    manufacturingView,
    rosterView,
    riskManagementView,
    taskView,
    worklogsView,
  }, viewAvailabilityContext);
  const activeSection = activeSubItemId
    ? getNavigationSectionFromSubItem(activeSubItemId)
    : null;
  const isSubItemEnabled = useCallback(
    (subItemId: NavigationSubItemId) =>
      isNavigationSubItemAvailable(subItemId, {
        context: viewAvailabilityContext,
      }),
    [viewAvailabilityContext],
  );
  const getSectionSubItems = useCallback(
    (section: NavigationSection): SidebarSubItemModel[] =>
      NAVIGATION_SUB_ITEMS_BY_SECTION[section].map((subItem) => ({
        ...subItem,
        target: getNavigationTarget(subItem.id, viewAvailabilityContext),
        isEnabled: isSubItemEnabled(subItem.id),
      })),
    [isSubItemEnabled, viewAvailabilityContext],
  );
  const sectionModels = useMemo(
    () =>
      NAVIGATION_SECTION_ORDER.filter(section => section !== "home").map((section) => {
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
        target: getNavigationTarget(subItem.id, viewAvailabilityContext),
        isEnabled: isSubItemEnabled(subItem.id),
      }));
  }, [favoriteViewIds, isSubItemEnabled, viewAvailabilityContext]);

  return {
    activeSection,
    activeSubItemId,
    favoriteSubItems,
    getSectionSubItems,
    sectionModels,
  };
}
