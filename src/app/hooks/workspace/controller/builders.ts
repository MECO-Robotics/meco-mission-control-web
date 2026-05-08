import type { AppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import type {
  AppWorkspaceRosterController,
  AppWorkspaceTaskController,
} from "@/app/hooks/workspace/controller/domainSlices";
import {
  shellContentCatalogActionKeys,
  shellContentModelKeys,
  shellContentReportActionKeys,
  shellContentRosterActionKeys,
  shellContentTaskActionKeys,
  shellFrameKeys,
  shellSidebarModelKeys,
  shellSidebarRosterActionKeys,
  shellTopbarModelKeys,
  shellTopbarRosterActionKeys,
  type AppWorkspaceShellContentController,
  type AppWorkspaceShellFrameController,
  type AppWorkspaceShellSidebarController,
  type AppWorkspaceShellTopbarController,
} from "@/app/hooks/workspace/controller/shellSlices";
import {
  shellModalCatalogActionKeys,
  shellModalLayerModelKeys,
  shellModalReportActionKeys,
  shellModalTaskActionKeys,
  shellOverlayLayerModelKeys,
  shellOverlayRosterActionKeys,
  type AppWorkspaceShellModalLayerController,
  type AppWorkspaceShellOverlayLayerController,
} from "@/app/hooks/workspace/controller/shellLayerSlices";
import { pickFields } from "@/app/hooks/workspace/controller/pickFields";
import type { TaskDependencyDraft } from "@/types/payloads";

export interface AppWorkspaceShellController {
  frame: AppWorkspaceShellFrameController;
  topbar: AppWorkspaceShellTopbarController;
  sidebar: AppWorkspaceShellSidebarController;
  content: AppWorkspaceShellContentController;
  modalLayer: AppWorkspaceShellModalLayerController;
  overlayLayer: AppWorkspaceShellOverlayLayerController;
}

export function buildTaskController(
  model: AppWorkspaceModel,
  taskActions: AppWorkspaceTaskActions,
): AppWorkspaceTaskController {
  return {
    ...taskActions,
    ...pickFields(model, [
      "activeTask",
      "activeTaskId",
      "activeTimelineTaskDetail",
      "showTimelineCreateToggleInTaskModal",
      "taskDraft",
      "taskModalMode",
      "timelineMilestoneCreateSignal",
    ] as const),
    normalizeDependencies: (dependencies: TaskDependencyDraft[]) =>
      dependencies.map((dependency) => ({
        ...dependency,
        refId: dependency.refId.trim(),
        requiredState: dependency.requiredState?.trim(),
      })),
  };
}

export function buildRosterController(
  model: AppWorkspaceModel,
  rosterActions: AppWorkspaceRosterActions,
): AppWorkspaceRosterController {
  return {
    ...rosterActions,
    ...pickFields(model, [
      "isSavingMember",
      "isSavingRobotProject",
      "isSavingSeason",
      "robotProjectNameDraft",
      "seasonNameDraft",
      "selectedProject",
      "selectedProjectId",
      "selectedSeasonId",
    ] as const),
  };
}

export function buildShellController(
  model: AppWorkspaceModel,
  taskActions: AppWorkspaceTaskActions,
  reportActions: AppWorkspaceReportActions,
  catalogActions: AppWorkspaceCatalogActions,
  rosterActions: AppWorkspaceRosterActions,
): AppWorkspaceShellController {
  return {
    frame: pickFields(model, shellFrameKeys),
    topbar: {
      ...pickFields(model, shellTopbarModelKeys),
      ...pickFields(rosterActions, shellTopbarRosterActionKeys),
    },
    sidebar: {
      ...pickFields(model, shellSidebarModelKeys),
      ...pickFields(rosterActions, shellSidebarRosterActionKeys),
    },
    content: {
      ...pickFields(model, shellContentModelKeys),
      ...pickFields(taskActions, shellContentTaskActionKeys),
      ...pickFields(reportActions, shellContentReportActionKeys),
      ...pickFields(catalogActions, shellContentCatalogActionKeys),
      ...pickFields(rosterActions, shellContentRosterActionKeys),
    },
    modalLayer: {
      ...pickFields(model, shellModalLayerModelKeys),
      ...pickFields(taskActions, shellModalTaskActionKeys),
      ...pickFields(reportActions, shellModalReportActionKeys),
      ...pickFields(catalogActions, shellModalCatalogActionKeys),
    },
    overlayLayer: {
      ...pickFields(model, shellOverlayLayerModelKeys),
      ...pickFields(rosterActions, shellOverlayRosterActionKeys),
    },
  };
}
