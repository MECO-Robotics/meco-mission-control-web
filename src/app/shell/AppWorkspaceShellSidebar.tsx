import type { AppWorkspaceShellSidebarController } from "@/app/hooks/useAppWorkspaceController";

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

  return (
    <AppSidebar
      activeTab={c.activeTab}
      items={c.navigationItems}
      onSelectTarget={handleSelectNavigationTarget}
      isCollapsed={c.isSidebarCollapsed}
      toggleSidebar={c.toggleSidebar}
      projects={c.projectsInSelectedSeason}
      selectedProjectId={c.selectedProjectId}
      inventoryView={c.inventoryView}
      rosterView={c.rosterView}
      reportsView={c.reportsView}
      riskManagementView={c.riskManagementView}
      taskView={c.taskView}
      worklogsView={c.worklogsView}
      onSelectProject={c.setSelectedProjectId}
      onCreateRobot={c.handleCreateRobot}
      onEditSelectedRobot={c.handleEditSelectedRobot}
    />
  );
}
