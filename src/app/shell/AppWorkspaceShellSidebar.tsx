import type { AppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";

import { AppSidebar } from "@/app/shell/workspaceShell";

export function AppWorkspaceShellSidebar({ controller }: { controller: AppWorkspaceController }) {
  const c = controller;

  return (
    <AppSidebar
      activeTab={c.activeTab}
      items={c.navigationItems}
      onSelectTab={c.handleSidebarTabSelect}
      isCollapsed={c.isSidebarCollapsed}
      toggleSidebar={c.toggleSidebar}
      projects={c.projectsInSelectedSeason}
      selectedProjectId={c.selectedProjectId}
      onSelectProject={c.setSelectedProjectId}
      onCreateRobot={c.handleCreateRobot}
      onEditSelectedRobot={c.handleEditSelectedRobot}
    />
  );
}
