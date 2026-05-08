import { useAppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import {
  authControllerKeys,
  navigationControllerKeys,
  tutorialControllerKeys,
  workspaceControllerKeys,
  type AppWorkspaceAuthController,
  type AppWorkspaceNavigationController,
  type AppWorkspaceRosterController,
  type AppWorkspaceTaskController,
  type AppWorkspaceTutorialController,
  type AppWorkspaceWorkspaceController,
} from "@/app/hooks/workspace/controller/domainSlices";
import {
  buildRosterController,
  buildShellController,
  buildTaskController,
  type AppWorkspaceShellController,
} from "@/app/hooks/workspace/controller/builders";
import { pickFields } from "@/app/hooks/workspace/controller/pickFields";
import type {
  AppWorkspaceShellContentController,
  AppWorkspaceShellFrameController,
  AppWorkspaceShellSidebarController,
  AppWorkspaceShellTopbarController,
} from "@/app/hooks/workspace/controller/shellSlices";
import type {
  AppWorkspaceShellModalLayerController,
  AppWorkspaceShellOverlayLayerController,
} from "@/app/hooks/workspace/controller/shellLayerSlices";
import type { WorkspaceToastNotice } from "@/features/workspace/workspaceToastQueue";

export type { AppWorkspaceShellController };
export type {
  AppWorkspaceAuthController,
  AppWorkspaceNavigationController,
  AppWorkspaceRosterController,
  AppWorkspaceTaskController,
  AppWorkspaceTutorialController,
  AppWorkspaceWorkspaceController,
};
export type {
  AppWorkspaceShellContentController,
  AppWorkspaceShellFrameController,
  AppWorkspaceShellSidebarController,
  AppWorkspaceShellTopbarController,
};
export type {
  AppWorkspaceShellModalLayerController,
  AppWorkspaceShellOverlayLayerController,
};
export { buildRosterController, buildShellController, buildTaskController };

export function useAppWorkspaceController() {
  const state = useAppWorkspaceState();
  const model = useAppWorkspaceModel(state);
  const taskActions = useAppWorkspaceTaskActions(model);
  const reportActions = useAppWorkspaceReportActions(model);
  const catalogActions = useAppWorkspaceCatalogActions(model);
  const rosterActions = useAppWorkspaceRosterActions(model);
  const shell = buildShellController(
    model,
    taskActions,
    reportActions,
    catalogActions,
    rosterActions,
  );

  return {
    auth: pickFields(model, authControllerKeys),
    shell,
    navigation: pickFields(model, navigationControllerKeys),
    workspace: pickFields(model, workspaceControllerKeys),
    tasks: buildTaskController(model, taskActions),
    reports: reportActions,
    catalog: catalogActions,
    roster: buildRosterController(model, rosterActions),
    modals: {
      ...shell.modalLayer,
      ...shell.overlayLayer,
    },
    tutorial: pickFields(model, tutorialControllerKeys),
    notifications: {
      dataMessage: model.dataMessage,
      taskEditNotices: model.taskEditNotices as WorkspaceToastNotice[],
      clearDataMessage: model.clearDataMessage,
      dismissTaskEditNotice: model.dismissTaskEditNotice,
      notifyTaskEditCanceled: model.notifyTaskEditCanceled,
      notifyTaskEditSaved: model.notifyTaskEditSaved,
    },
  };
}

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;
