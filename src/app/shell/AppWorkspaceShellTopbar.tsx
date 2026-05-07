import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import {
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SUB_ITEMS,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
} from "@/lib/workspaceNavigation";

import { AppTopbar } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellTopbar({ controller }: { controller: AppWorkspaceController }) {
  const c = controller;
  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab: c.activeTab,
    inventoryView: c.inventoryView,
    rosterView: c.rosterView,
    reportsView: c.reportsView,
    riskManagementView: c.riskManagementView,
    taskView: c.taskView,
    worklogsView: c.worklogsView,
  });
  const activeSection = getNavigationSectionFromSubItem(activeSubItemId);
  const activeSectionLabel = NAVIGATION_SECTION_LABELS[activeSection];
  const activeViewLabel =
    NAVIGATION_SUB_ITEMS.find((subItem) => subItem.id === activeSubItemId)?.label ??
    activeSectionLabel;

  return (
    <AppTopbar
      activeViewLabel={activeViewLabel}
      handleSignOut={c.handleSignOut}
      isLoadingData={c.isLoadingData}
      isMyViewActive={c.isMyViewActive}
      loadWorkspace={c.loadWorkspace}
      myViewMemberName={c.signedInMember?.name ?? null}
      sessionUser={c.sessionUser}
      seasons={c.bootstrap.seasons}
      selectedSeasonId={c.selectedSeasonId}
      onCreateSeason={c.handleCreateSeason}
      onSelectSeason={c.setSelectedSeasonId}
      onToggleMyView={c.toggleMyView}
      isDarkMode={c.isDarkMode}
      toggleDarkMode={c.toggleDarkMode}
      isSidebarCollapsed={c.isSidebarCollapsed}
    />
  );
}
