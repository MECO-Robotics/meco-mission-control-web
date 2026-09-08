/// <reference types="jest" />

import {
  buildShellController,
} from "@/app/hooks/workspace/controller/builders";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import type { AppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";

describe("workspace controller builders", () => {
  it("builds shell slices with shared model/action fields", () => {
    const model = {
      isDarkMode: true,
      isSidebarCollapsed: false,
      isSidebarOverlay: false,
      pageShellStyle: { width: 1 },
      activeTab: "tasks",
      navigationItems: [],
      selectedProjectId: null,
      selectedSeasonId: null,
      taskView: "queue",
      inventoryView: "materials",
      manufacturingView: "cnc",
      reportsView: "qa",
      riskManagementView: "kanban",
      rosterView: "directory",
      worklogsView: "logs",
    } as unknown as AppWorkspaceModel;
    const taskActions = {} as AppWorkspaceTaskActions;
    const reportActions = {} as AppWorkspaceReportActions;
    const catalogActions = {} as AppWorkspaceCatalogActions;
    const rosterActions = {
      handleCreateSeason: jest.fn(),
      handleCreateRobot: jest.fn(),
      handleEditSelectedRobot: jest.fn(),
      closeCreateSeasonPopup: jest.fn(),
      closeRobotProjectPopup: jest.fn(),
      handleCreateSeasonSubmit: jest.fn(),
      handleRobotProjectSubmit: jest.fn(),
    } as unknown as AppWorkspaceRosterActions;

    const shell = buildShellController(
      model,
      taskActions,
      reportActions,
      catalogActions,
      rosterActions,
    );

    expect(shell.frame.isDarkMode).toBe(true);
    expect(shell.sidebar.taskView).toBe("queue");
    expect(shell.sidebar.handleCreateSeason).toBe(rosterActions.handleCreateSeason);
    expect(shell.overlayLayer.handleRobotProjectSubmit).toBe(
      rosterActions.handleRobotProjectSubmit,
    );
  });

});
