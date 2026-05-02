import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";

import { AppTopbar } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellTopbar({ controller }: { controller: AppWorkspaceController }) {
  const c = controller;

  return (
    <AppTopbar
      activeTab={c.activeTab}
      handleSignOut={c.handleSignOut}
      inventoryView={c.inventoryView}
      isLoadingData={c.isLoadingData}
      isMyViewActive={c.isMyViewActive}
      isNonRobotProject={c.isNonRobotProject}
      loadWorkspace={c.loadWorkspace}
      manufacturingView={c.manufacturingView}
      riskManagementView={c.riskManagementView}
      reportsView={c.reportsView}
      myViewMemberName={c.signedInMember?.name ?? null}
      sessionUser={c.sessionUser}
      setInventoryView={c.setInventoryView}
      setManufacturingView={c.setManufacturingView}
      setRiskManagementView={c.setRiskManagementView}
      setReportsView={c.setReportsView}
      setTaskView={c.setTaskView}
      setWorklogsView={c.setWorklogsView}
      taskView={c.taskView}
      worklogsView={c.worklogsView}
      seasons={c.bootstrap.seasons}
      selectedSeasonId={c.selectedSeasonId}
      subsystemsLabel={c.subsystemsLabel}
      onCreateSeason={c.handleCreateSeason}
      onSelectSeason={c.setSelectedSeasonId}
      onToggleMyView={c.toggleMyView}
      isDarkMode={c.isDarkMode}
      toggleDarkMode={c.toggleDarkMode}
      isSidebarCollapsed={c.isSidebarCollapsed}
    />
  );
}
