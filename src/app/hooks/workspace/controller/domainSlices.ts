import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import type { TaskDependencyDraft } from "@/types/payloads";

export const authControllerKeys = [
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
  "isSigningIn",
  "pageShellStyle",
  "sessionUser",
  "toggleDarkMode",
] as const;
export type AppWorkspaceAuthController = Pick<
  AppWorkspaceModel,
  (typeof authControllerKeys)[number]
>;

export const navigationControllerKeys = [
  "activeTab",
  "handleSidebarTabSelect",
  "inventoryView",
  "manufacturingView",
  "navigationItems",
  "reportsView",
  "riskManagementView",
  "rosterView",
  "setActiveTab",
  "setInventoryView",
  "setManufacturingView",
  "setReportsView",
  "setRiskManagementView",
  "setRosterView",
  "setTaskView",
  "setWorklogsView",
  "taskView",
  "worklogsView",
] as const;
export type AppWorkspaceNavigationController = Pick<
  AppWorkspaceModel,
  (typeof navigationControllerKeys)[number]
>;

export const workspaceControllerKeys = [
  "bootstrap",
  "dataMessage",
  "isLoadingData",
  "isNonRobotProject",
  "loadWorkspace",
  "scopedBootstrap",
  "selectedProject",
  "selectedProjectId",
  "selectedSeasonId",
] as const;
export type AppWorkspaceWorkspaceController = Pick<
  AppWorkspaceModel,
  (typeof workspaceControllerKeys)[number]
>;

export const tutorialControllerKeys = [
  "interactiveTutorialChapters",
  "interactiveTutorialOverlayProps",
  "isInteractiveTutorialActive",
  "startInteractiveTutorial",
] as const;
export type AppWorkspaceTutorialController = Pick<
  AppWorkspaceModel,
  (typeof tutorialControllerKeys)[number]
>;

export type AppWorkspaceTaskController = AppWorkspaceTaskActions &
  Pick<
    AppWorkspaceModel,
    | "activeTask"
    | "activeTaskId"
    | "activeTimelineTaskDetail"
    | "showTimelineCreateToggleInTaskModal"
    | "taskDraft"
    | "taskModalMode"
    | "timelineMilestoneCreateSignal"
  > & {
    normalizeDependencies: (dependencies: TaskDependencyDraft[]) => TaskDependencyDraft[];
  };

export type AppWorkspaceRosterController = AppWorkspaceRosterActions &
  Pick<
    AppWorkspaceModel,
    | "isSavingMember"
    | "isSavingRobotProject"
    | "isSavingSeason"
    | "robotProjectNameDraft"
    | "seasonNameDraft"
    | "selectedProject"
    | "selectedProjectId"
    | "selectedSeasonId"
  >;
