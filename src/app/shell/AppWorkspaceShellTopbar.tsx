import type { AppWorkspaceShellTopbarController } from "@/app/hooks/useAppWorkspaceController";
import {
  BASE_SECTION_LABELS,
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SUB_ITEMS,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
} from "@/lib/workspaceNavigation";

import { AppTopbar } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellTopbar({
  controller,
}: {
  controller: AppWorkspaceShellTopbarController;
}) {
  const c = controller;
  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab: c.activeTab,
    inventoryView: c.inventoryView,
    manufacturingView: c.manufacturingView,
    rosterView: c.rosterView,
    reportsView: c.reportsView,
    riskManagementView: c.riskManagementView,
    taskView: c.taskView,
    worklogsView: c.worklogsView,
  });
  const activeSection = activeSubItemId
    ? getNavigationSectionFromSubItem(activeSubItemId)
    : null;
  const activeSectionLabel = activeSection
    ? NAVIGATION_SECTION_LABELS[activeSection]
    : BASE_SECTION_LABELS[c.activeTab];
  const activeViewLabel =
    activeSubItemId
      ? NAVIGATION_SUB_ITEMS.find((subItem) => subItem.id === activeSubItemId)?.label ??
        activeSectionLabel
      : activeSectionLabel;
  const favoriteViewIds = new Set(
    (c.bootstrap.favoriteViews ?? []).map((favorite) => favorite.viewId),
  );
  const isActiveViewFavorite = activeSubItemId ? favoriteViewIds.has(activeSubItemId) : false;

  return (
    <AppTopbar
      activeViewLabel={activeViewLabel}
      isActiveViewFavorite={isActiveViewFavorite}
      onToggleActiveViewFavorite={
        activeSubItemId
          ? () => void c.toggleFavoriteView(activeSubItemId, !isActiveViewFavorite)
          : null
      }
      isDarkMode={c.isDarkMode}
      isSidebarCollapsed={c.isSidebarCollapsed}
    />
  );
}
