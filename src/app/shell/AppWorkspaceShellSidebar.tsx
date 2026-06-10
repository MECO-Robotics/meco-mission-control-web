import type { AppWorkspaceShellSidebarController } from "@/app/hooks/useAppWorkspaceController";
import type { NavigationSubItemId } from "@/lib/workspaceNavigation";
import { normalizeNavigationSubItemId } from "@/lib/workspaceNavigation";

import { AppSidebar } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellSidebar({
  controller,
}: {
  controller: AppWorkspaceShellSidebarController;
}) {
  const c = controller;
  const handleSelectNavigationTarget = (target: {
    tab: typeof c.activeTab;
    taskView?: typeof c.taskView;
    riskManagementView?: typeof c.riskManagementView;
    worklogsView?: typeof c.worklogsView;
    reportsView?: typeof c.reportsView;
    inventoryView?: typeof c.inventoryView;
    manufacturingView?: typeof c.manufacturingView;
    rosterView?: typeof c.rosterView;
  }, options?: { keepSidebarOpen?: boolean }) => {
    if (target.taskView) {
      c.setTaskView(target.taskView);
    }

    if (target.riskManagementView) {
      c.setRiskManagementView(target.riskManagementView);
    }

    if (target.worklogsView) {
      c.setWorklogsView(target.worklogsView);
    }

    if (target.reportsView) {
      c.setReportsView(target.reportsView);
    }

    if (target.inventoryView) {
      c.setInventoryView(target.inventoryView);
    }

    if (target.manufacturingView) {
      c.setManufacturingView(target.manufacturingView);
    }

    if (target.rosterView) {
      c.setRosterView(target.rosterView);
    }

    c.handleSidebarTabSelect(target.tab, {
      keepSidebarOpen: options?.keepSidebarOpen,
    });
  };
  const handleCreateMilestone = () => {
    handleSelectNavigationTarget({ tab: "tasks", taskView: "timeline" });
    c.switchTaskCreateToMilestone();
  };

  return (
    <AppSidebar
      activeTab={c.activeTab}
      canSignIn={c.enforcedAuthConfig !== null && c.sessionUser === null}
      favoriteViewIds={(c.bootstrap.favoriteViews ?? [])
        .map((favorite) => normalizeNavigationSubItemId(favorite.viewId))
        .filter(
          (favoriteViewId): favoriteViewId is NavigationSubItemId => favoriteViewId !== null,
        )}
      handleSignOut={c.handleSignOut}
      items={c.navigationItems}
      isDarkMode={c.isDarkMode}
      isMyViewActive={c.isMyViewActive}
      onSelectTarget={handleSelectNavigationTarget}
      isCollapsed={c.isSidebarCollapsed}
      isNotificationQueueOpen={c.isNotificationQueueOpen}
      myViewMemberName={c.signedInMember?.name ?? null}
      notificationCount={c.notificationHistory.length}
      onCreateMilestone={handleCreateMilestone}
      onCreatePart={c.openCreatePartDefinitionModal}
      onCreateQaReport={c.openCreateQaReportModal}
      onCreateSeason={c.handleCreateSeason}
      onCreateTask={c.openCreateTaskModal}
      onRefreshWorkspace={c.loadWorkspace}
      onSignIn={c.requestSignIn}
      onSelectSeason={c.setSelectedSeasonId}
      onToggleMyView={c.toggleMyView}
      onToggleNotificationQueue={c.toggleNotificationQueue}
      toggleSidebar={c.toggleSidebar}
      projects={c.projectsInSelectedSeason}
      selectedProjectId={c.selectedProjectId}
      selectedSeasonId={c.selectedSeasonId}
      inventoryView={c.inventoryView}
      manufacturingView={c.manufacturingView}
      rosterView={c.rosterView}
      reportsView={c.reportsView}
      riskManagementView={c.riskManagementView}
      seasons={c.bootstrap.seasons}
      sessionUser={c.sessionUser}
      taskView={c.taskView}
      toggleDarkMode={c.toggleDarkMode}
      worklogsView={c.worklogsView}
      onSelectProject={c.setSelectedProjectId}
      onCreateRobot={c.handleCreateRobot}
      onEditSelectedRobot={c.handleEditSelectedRobot}
    />
  );
}
