import type { AppWorkspaceCatalogActions } from "@/app/hooks/useAppWorkspaceCatalogActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { AppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import type { AppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import type { AppWorkspaceTaskActions } from "@/app/hooks/useAppWorkspaceTaskActions";

export const shellFrameKeys = [
  "isDarkMode",
  "isSidebarCollapsed",
  "isSidebarOverlay",
  "pageShellStyle",
] as const;
export type AppWorkspaceShellFrameController = Pick<
  AppWorkspaceModel,
  (typeof shellFrameKeys)[number]
>;

export const shellTopbarModelKeys = [
  "activeTab",
  "bootstrap",
  "inventoryView",
  "isDarkMode",
  "isSidebarCollapsed",
  "manufacturingView",
  "reportsView",
  "riskManagementView",
  "rosterView",
  "taskView",
  "toggleFavoriteView",
  "worklogsView",
] as const;
export const shellTopbarRosterActionKeys = [] as const;
export type AppWorkspaceShellTopbarController = Pick<
  AppWorkspaceModel,
  (typeof shellTopbarModelKeys)[number]
> &
  Pick<AppWorkspaceRosterActions, (typeof shellTopbarRosterActionKeys)[number]>;

export const shellSidebarModelKeys = [
  "activeTab",
  "bootstrap",
  "handleSignOut",
  "handleSidebarTabSelect",
  "inventoryView",
  "isDarkMode",
  "isMyViewActive",
  "isSidebarCollapsed",
  "manufacturingView",
  "navigationItems",
  "projectsInSelectedSeason",
  "reportsView",
  "riskManagementView",
  "rosterView",
  "selectedProjectId",
  "selectedSeasonId",
  "setInventoryView",
  "setManufacturingView",
  "setReportsView",
  "setRiskManagementView",
  "setRosterView",
  "setSelectedProjectId",
  "setSelectedSeasonId",
  "setTaskView",
  "setWorklogsView",
  "sessionUser",
  "signedInMember",
  "taskView",
  "toggleDarkMode",
  "toggleMyView",
  "toggleSidebar",
  "worklogsView",
] as const;
export const shellSidebarRosterActionKeys = [
  "handleCreateSeason",
  "handleCreateRobot",
  "handleEditSelectedRobot",
] as const;
export type AppWorkspaceShellSidebarController = Pick<
  AppWorkspaceModel,
  (typeof shellSidebarModelKeys)[number]
> &
  Pick<AppWorkspaceRosterActions, (typeof shellSidebarRosterActionKeys)[number]>;

export const shellContentModelKeys = [
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
export const shellContentTaskActionKeys = [
  "handleTimelineMilestoneDelete",
  "handleTimelineMilestoneSave",
  "openCreateTaskModal",
  "openCreateTaskModalFromTimeline",
  "openTimelineTaskDetailsModal",
] as const;
export const shellContentReportActionKeys = [
  "openCreateWorkLogModal",
  "handleCreateRisk",
  "handleDeleteRisk",
  "handleUpdateRisk",
  "openCreateMilestoneReportModal",
  "openCreateQaReportModal",
] as const;
export const shellContentCatalogActionKeys = [
  "handleDeleteMechanism",
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
  "removePartInstanceFromMechanism",
  "saveSubsystemLayout",
  "updateSubsystemConfiguration",
] as const;
export const shellContentRosterActionKeys = [
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
