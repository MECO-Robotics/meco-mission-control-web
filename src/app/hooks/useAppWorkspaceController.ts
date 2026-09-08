import { useAppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import { buildShellController, type AppWorkspaceShellController } from "@/app/hooks/workspace/controller/builders";
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

export type { AppWorkspaceShellController };
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

const authControllerKeys = [
  "authBooting",
  "authConfig",
  "authMessage",
  "clearAuthMessage",
  "enforcedAuthConfig",
  "googleButtonRef",
  "handleDevBypassSignIn",
  "handleRequestEmailCode",
  "handleVerifyEmailCode",
  "isDarkMode",
  "isEmailAuthAvailable",
  "isGoogleAuthAvailable",
  "isPublicDemoSession",
  "isSignInScreenRequested",
  "isSigningIn",
  "pageShellStyle",
  "returnToPublicDemo",
  "sessionUser",
  "toggleDarkMode",
] as const;

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
  };
}
