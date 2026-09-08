import type { AppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import {
  shellContentCatalogActionKeys,
  shellContentModelKeys,
  shellContentReportActionKeys,
  shellContentRosterActionKeys,
  shellContentTaskActionKeys,
  shellFrameKeys,
  shellSidebarModelKeys,
  shellSidebarCatalogActionKeys,
  shellSidebarReportActionKeys,
  shellSidebarRosterActionKeys,
  shellSidebarTaskActionKeys,
  shellTopbarModelKeys,
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

export interface AppWorkspaceShellController {
  frame: AppWorkspaceShellFrameController;
  topbar: AppWorkspaceShellTopbarController;
  sidebar: AppWorkspaceShellSidebarController;
  content: AppWorkspaceShellContentController;
  modalLayer: AppWorkspaceShellModalLayerController;
  overlayLayer: AppWorkspaceShellOverlayLayerController;
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
    topbar: pickFields(model, shellTopbarModelKeys),
    sidebar: {
      ...pickFields(model, shellSidebarModelKeys),
      ...pickFields(taskActions, shellSidebarTaskActionKeys),
      ...pickFields(reportActions, shellSidebarReportActionKeys),
      ...pickFields(catalogActions, shellSidebarCatalogActionKeys),
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
