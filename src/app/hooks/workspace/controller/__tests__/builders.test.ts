/// <reference types="jest" />

import {
  buildRosterController,
  buildShellController,
  buildTaskController,
} from "@/app/hooks/workspace/controller/builders";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import type { AppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";

describe("workspace controller builders", () => {
  it("normalizes dependency strings in task controller", () => {
    const model = {
      activeTask: null,
      activeTaskId: null,
      activeTimelineTaskDetail: null,
      showTimelineCreateToggleInTaskModal: false,
      taskDraft: null,
      taskModalMode: null,
      timelineMilestoneCreateSignal: 0,
    } as unknown as AppWorkspaceModel;
    const taskActions = {} as AppWorkspaceTaskActions;

    const controller = buildTaskController(model, taskActions);
    const normalized = controller.normalizeDependencies([
      {
        kind: "task",
        refId: "  TASK-123  ",
        requiredState: "  waiting-for-qa  ",
        dependencyType: "hard",
      },
      {
        kind: "task",
        refId: "TASK-456",
        requiredState: undefined,
        dependencyType: "soft",
      },
    ]);

    expect(normalized).toEqual([
      {
        kind: "task",
        refId: "TASK-123",
        requiredState: "waiting-for-qa",
        dependencyType: "hard",
      },
      {
        kind: "task",
        refId: "TASK-456",
        requiredState: undefined,
        dependencyType: "soft",
      },
    ]);
  });

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
    expect(shell.topbar.handleCreateSeason).toBe(rosterActions.handleCreateSeason);
    expect(shell.overlayLayer.handleRobotProjectSubmit).toBe(
      rosterActions.handleRobotProjectSubmit,
    );
  });

  it("builds roster slice from model and roster actions", () => {
    const rosterActions = {
      handleCreateMember: jest.fn(),
    } as unknown as AppWorkspaceRosterActions;
    const model = {
      isSavingMember: false,
      isSavingRobotProject: false,
      isSavingSeason: true,
      robotProjectNameDraft: "Robot",
      seasonNameDraft: "2026",
      selectedProject: null,
      selectedProjectId: null,
      selectedSeasonId: "season-1",
    } as unknown as AppWorkspaceModel;

    const roster = buildRosterController(model, rosterActions);

    expect(roster.isSavingSeason).toBe(true);
    expect(roster.seasonNameDraft).toBe("2026");
    expect(roster.handleCreateMember).toBe(rosterActions.handleCreateMember);
  });
});
