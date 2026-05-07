import { useAppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import type { AppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";
import type { TaskDependencyDraft } from "@/types/payloads";
import type { WorkspaceToastNotice } from "@/features/workspace/workspaceToastQueue";

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;

function pickFields<T extends object, const K extends readonly (keyof T)[]>(
  source: T,
  keys: K,
): Pick<T, K[number]> {
  const result = {} as Pick<T, K[number]>;

  for (const key of keys) {
    result[key] = source[key];
  }

  return result;
}

const shellFrameKeys = [
  "isDarkMode",
  "isSidebarCollapsed",
  "isSidebarOverlay",
  "pageShellStyle",
] as const;
export type AppWorkspaceShellFrameController = Pick<
  AppWorkspaceModel,
  (typeof shellFrameKeys)[number]
>;

const shellTopbarModelKeys = [
  "activeTab",
  "bootstrap",
  "handleSignOut",
  "inventoryView",
  "isDarkMode",
  "isLoadingData",
  "isMyViewActive",
  "isSidebarCollapsed",
  "loadWorkspace",
  "manufacturingView",
  "reportsView",
  "riskManagementView",
  "rosterView",
  "selectedSeasonId",
  "sessionUser",
  "setSelectedSeasonId",
  "signedInMember",
  "taskView",
  "toggleDarkMode",
  "toggleMyView",
  "worklogsView",
] as const;
const shellTopbarRosterActionKeys = ["handleCreateSeason"] as const;
export type AppWorkspaceShellTopbarController = Pick<
  AppWorkspaceModel,
  (typeof shellTopbarModelKeys)[number]
> &
  Pick<AppWorkspaceRosterActions, (typeof shellTopbarRosterActionKeys)[number]>;

const shellSidebarModelKeys = [
  "activeTab",
  "handleSidebarTabSelect",
  "inventoryView",
  "isSidebarCollapsed",
  "manufacturingView",
  "navigationItems",
  "projectsInSelectedSeason",
  "reportsView",
  "riskManagementView",
  "rosterView",
  "selectedProjectId",
  "setInventoryView",
  "setManufacturingView",
  "setReportsView",
  "setRiskManagementView",
  "setRosterView",
  "setSelectedProjectId",
  "setTaskView",
  "setWorklogsView",
  "taskView",
  "toggleSidebar",
  "worklogsView",
] as const;
const shellSidebarRosterActionKeys = ["handleCreateRobot", "handleEditSelectedRobot"] as const;
export type AppWorkspaceShellSidebarController = Pick<
  AppWorkspaceModel,
  (typeof shellSidebarModelKeys)[number]
> &
  Pick<AppWorkspaceRosterActions, (typeof shellSidebarRosterActionKeys)[number]>;

const shellContentModelKeys = [
  "activePersonFilter",
  "activeTab",
  "bootstrap",
  "clearDataMessage",
  "cncItems",
  "dataMessage",
  "disciplinesById",
  "dismissTaskEditNotice",
  "externalMembers",
  "fabricationItems",
  "interactiveTutorialChapters",
  "inventoryView",
  "isAddPersonOpen",
  "isAllProjectsView",
  "isDeletingMember",
  "isEditPersonOpen",
  "isInteractiveTutorialActive",
  "isLoadingData",
  "isNonRobotProject",
  "isSavingMember",
  "isWorkspaceModalOpen",
  "manufacturingView",
  "mechanismsById",
  "memberEditDraft",
  "memberForm",
  "membersById",
  "notifyTaskEditCanceled",
  "notifyTaskEditSaved",
  "partDefinitionsById",
  "printItems",
  "reportsView",
  "requestMemberPhotoUpload",
  "riskManagementView",
  "rosterMentors",
  "rosterView",
  "scopedArtifacts",
  "scopedBootstrap",
  "selectedMemberId",
  "selectedProject",
  "selectedSeasonId",
  "selectMember",
  "setActivePersonFilter",
  "setIsAddPersonOpen",
  "setIsEditPersonOpen",
  "setMemberEditDraft",
  "setMemberForm",
  "signedInMember",
  "startInteractiveTutorial",
  "students",
  "subsystemsById",
  "tabSwitchDirection",
  "taskEditNotices",
  "taskView",
  "timelineMilestoneCreateSignal",
  "worklogsView",
] as const;
const shellContentTaskActionKeys = [
  "handleTimelineMilestoneDelete",
  "handleTimelineMilestoneSave",
  "openCreateTaskModal",
  "openCreateTaskModalFromTimeline",
  "openTimelineTaskDetailsModal",
] as const;
const shellContentReportActionKeys = [
  "openCreateWorkLogModal",
  "handleCreateRisk",
  "handleDeleteRisk",
  "handleUpdateRisk",
  "openCreateMilestoneReportModal",
  "openCreateQaReportModal",
] as const;
const shellContentCatalogActionKeys = [
  "handleCncQuickStatusChange",
  "openCreateArtifactModal",
  "openCreateManufacturingModal",
  "openCreateMaterialModal",
  "openCreateMechanismModal",
  "openCreatePartDefinitionModal",
  "openCreatePartInstanceModal",
  "openCreatePurchaseModal",
  "openCreateSubsystemModal",
  "openCreateWorkstreamModal",
  "openEditArtifactModal",
  "openEditManufacturingModal",
  "openEditMaterialModal",
  "openEditMechanismModal",
  "openEditPartDefinitionModal",
  "openEditPartInstanceModal",
  "openEditPurchaseModal",
  "openEditSubsystemModal",
  "openEditWorkstreamModal",
] as const;
const shellContentRosterActionKeys = [
  "handleCreateMember",
  "handleDeleteMember",
  "handleReactivateMemberForSeason",
  "handleUpdateMember",
] as const;
export type AppWorkspaceShellContentController = Pick<
  AppWorkspaceModel,
  (typeof shellContentModelKeys)[number]
> &
  Pick<AppWorkspaceTaskActions, (typeof shellContentTaskActionKeys)[number]> &
  Pick<AppWorkspaceReportActions, (typeof shellContentReportActionKeys)[number]> &
  Pick<AppWorkspaceCatalogActions, (typeof shellContentCatalogActionKeys)[number]> &
  Pick<AppWorkspaceRosterActions, (typeof shellContentRosterActionKeys)[number]>;

const shellModalLayerModelKeys = [
  "activeArtifactId",
  "activeMaterialId",
  "activeMechanismId",
  "activePartDefinitionId",
  "activeSubsystemId",
  "activeTask",
  "activeTimelineTaskDetail",
  "activeWorkstreamId",
  "artifactDraft",
  "artifactModalMode",
  "disciplinesById",
  "interactiveTutorialOverlayProps",
  "isDeletingArtifact",
  "isDeletingMaterial",
  "isDeletingMechanism",
  "isDeletingPartDefinition",
  "isDeletingTask",
  "isSavingArtifact",
  "isSavingManufacturing",
  "isSavingMaterial",
  "isSavingMechanism",
  "isSavingMilestoneReport",
  "isSavingPartDefinition",
  "isSavingPartInstance",
  "isSavingPurchase",
  "isSavingQaReport",
  "isSavingSubsystem",
  "isSavingTask",
  "isSavingWorkLog",
  "isSavingWorkstream",
  "isWorkspaceModalOpen",
  "manufacturingDraft",
  "manufacturingModalMode",
  "materialDraft",
  "materialModalMode",
  "mechanismDraft",
  "mechanismModalMode",
  "mechanismsById",
  "mentors",
  "milestoneReportDraft",
  "milestoneReportFindings",
  "milestoneReportModalMode",
  "milestonesById",
  "notifyTaskEditCanceled",
  "partDefinitionDraft",
  "partDefinitionModalMode",
  "partDefinitionsById",
  "partInstanceDraft",
  "partInstanceModalMode",
  "partInstancesById",
  "purchaseDraft",
  "purchaseFinalCost",
  "purchaseModalMode",
  "qaReportDraft",
  "qaReportModalMode",
  "requestPhotoUpload",
  "scopedBootstrap",
  "setArtifactDraft",
  "setManufacturingDraft",
  "setMaterialDraft",
  "setMechanismDraft",
  "setMilestoneReportDraft",
  "setMilestoneReportFindings",
  "setPartDefinitionDraft",
  "setPartInstanceDraft",
  "setPurchaseDraft",
  "setPurchaseFinalCost",
  "setQaReportDraft",
  "setSubsystemDraft",
  "setSubsystemDraftRisks",
  "setTaskDraft",
  "setWorkLogDraft",
  "setWorkstreamDraft",
  "showTimelineCreateToggleInTaskModal",
  "students",
  "subsystemDraft",
  "subsystemDraftRisks",
  "subsystemModalMode",
  "taskDraft",
  "taskModalMode",
  "workLogDraft",
  "workLogModalMode",
  "workstreamDraft",
  "workstreamModalMode",
] as const;
const shellModalTaskActionKeys = [
  "closeTaskModal",
  "closeTimelineTaskDetailsModal",
  "handleDeleteTask",
  "handleResolveTaskBlocker",
  "handleTaskSubmit",
  "openEditTaskModal",
  "openTimelineTaskDetailsModal",
  "switchTaskCreateToMilestone",
] as const;
const shellModalReportActionKeys = [
  "closeMilestoneReportModal",
  "closeQaReportModal",
  "closeWorkLogModal",
  "handleWorkLogSubmit",
  "handleMilestoneReportSubmit",
  "handleQaReportSubmit",
] as const;
const shellModalCatalogActionKeys = [
  "closeArtifactModal",
  "closeManufacturingModal",
  "closeMaterialModal",
  "closeMechanismModal",
  "closePartDefinitionModal",
  "closePartInstanceModal",
  "closePurchaseModal",
  "closeSubsystemModal",
  "closeWorkstreamModal",
  "handleArtifactSubmit",
  "handleDeleteArtifact",
  "handleDeleteMaterial",
  "handleDeleteMechanism",
  "handleDeletePartDefinition",
  "handleManufacturingSubmit",
  "handleMaterialSubmit",
  "handleMechanismSubmit",
  "handlePartDefinitionSubmit",
  "handlePartInstanceSubmit",
  "handlePurchaseSubmit",
  "handleSubsystemSubmit",
  "handleToggleArtifactArchived",
  "handleToggleMechanismArchived",
  "handleTogglePartDefinitionArchived",
  "handleToggleSubsystemArchived",
  "handleToggleWorkstreamArchived",
  "handleWorkstreamSubmit",
] as const;
export type AppWorkspaceShellModalLayerController = Pick<
  AppWorkspaceModel,
  (typeof shellModalLayerModelKeys)[number]
> &
  Pick<AppWorkspaceTaskActions, (typeof shellModalTaskActionKeys)[number]> &
  Pick<AppWorkspaceReportActions, (typeof shellModalReportActionKeys)[number]> &
  Pick<AppWorkspaceCatalogActions, (typeof shellModalCatalogActionKeys)[number]>;

const shellOverlayLayerModelKeys = [
  "closeSidebarOverlay",
  "isAddSeasonPopupOpen",
  "isSavingRobotProject",
  "isSavingSeason",
  "isSidebarOverlay",
  "robotProjectModalMode",
  "robotProjectNameDraft",
  "seasonNameDraft",
  "setRobotProjectNameDraft",
  "setSeasonNameDraft",
] as const;
const shellOverlayRosterActionKeys = [
  "closeCreateSeasonPopup",
  "closeRobotProjectPopup",
  "handleCreateSeasonSubmit",
  "handleRobotProjectSubmit",
] as const;
export type AppWorkspaceShellOverlayLayerController = Pick<
  AppWorkspaceModel,
  (typeof shellOverlayLayerModelKeys)[number]
> &
  Pick<AppWorkspaceRosterActions, (typeof shellOverlayRosterActionKeys)[number]>;

export interface AppWorkspaceShellController {
  frame: AppWorkspaceShellFrameController;
  topbar: AppWorkspaceShellTopbarController;
  sidebar: AppWorkspaceShellSidebarController;
  content: AppWorkspaceShellContentController;
  modalLayer: AppWorkspaceShellModalLayerController;
  overlayLayer: AppWorkspaceShellOverlayLayerController;
}

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
  "isSigningIn",
  "pageShellStyle",
  "sessionUser",
  "toggleDarkMode",
] as const;
export type AppWorkspaceAuthController = Pick<
  AppWorkspaceModel,
  (typeof authControllerKeys)[number]
>;

const navigationControllerKeys = [
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

const workspaceControllerKeys = [
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

const tutorialControllerKeys = [
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
