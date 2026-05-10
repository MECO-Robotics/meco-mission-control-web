import type { InventoryViewTab } from "@/lib/workspaceNavigation";
import type { WorkspaceContentPanelsProps } from "../WorkspaceContentPanelsCoreImpl";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

export type SwipeDirection = "left" | "right" | null;

export type WorkspaceContentPanelsViewProps = WorkspaceContentPanelsProps & {
  effectiveInventoryView: InventoryViewTab;
  taskSwipeDirection: SwipeDirection;
  reportsSwipeDirection: SwipeDirection;
  manufacturingSwipeDirection: SwipeDirection;
  inventorySwipeDirection: SwipeDirection;
};

export interface WorkspaceShellPanelProps {
  activeTab: WorkspaceContentPanelsViewProps["activeTab"];
  tabSwitchDirection: WorkspaceContentPanelsViewProps["tabSwitchDirection"];
  disablePanelAnimations?: WorkspaceContentPanelsViewProps["disablePanelAnimations"];
  isLoadingData: WorkspaceContentPanelsViewProps["isLoadingData"];
  dataMessage: WorkspaceContentPanelsViewProps["dataMessage"];
  taskEditNotices: WorkspaceContentPanelsViewProps["taskEditNotices"];
  onDismissDataMessage: WorkspaceContentPanelsViewProps["onDismissDataMessage"];
  onDismissTaskEditNotice: WorkspaceContentPanelsViewProps["onDismissTaskEditNotice"];
  onTaskEditCanceled: WorkspaceContentPanelsViewProps["onTaskEditCanceled"];
  onTaskEditSaved: WorkspaceContentPanelsViewProps["onTaskEditSaved"];
}

export interface WorkspaceTaskPanelProps {
  activePersonFilter: WorkspaceContentPanelsViewProps["activePersonFilter"];
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  disciplinesById: WorkspaceContentPanelsViewProps["disciplinesById"];
  isAllProjectsView: WorkspaceContentPanelsViewProps["isAllProjectsView"];
  isNonRobotProject: WorkspaceContentPanelsViewProps["isNonRobotProject"];
  membersById: WorkspaceContentPanelsViewProps["membersById"];
  openCreateTaskModal: WorkspaceContentPanelsViewProps["openCreateTaskModal"];
  openCreateTaskModalFromTimeline: WorkspaceContentPanelsViewProps["openCreateTaskModalFromTimeline"];
  openCreateMechanismModal: WorkspaceContentPanelsViewProps["openCreateMechanismModal"];
  openCreatePartInstanceModal: WorkspaceContentPanelsViewProps["openCreatePartInstanceModal"];
  openCreateSubsystemModal: WorkspaceContentPanelsViewProps["openCreateSubsystemModal"];
  handleDeleteMechanism: WorkspaceContentPanelsViewProps["handleDeleteMechanism"];
  openEditMechanismModal: WorkspaceContentPanelsViewProps["openEditMechanismModal"];
  openEditPartInstanceModal: WorkspaceContentPanelsViewProps["openEditPartInstanceModal"];
  openEditSubsystemModal: WorkspaceContentPanelsViewProps["openEditSubsystemModal"];
  removePartInstanceFromMechanism: WorkspaceContentPanelsViewProps["removePartInstanceFromMechanism"];
  saveSubsystemLayout: (
    subsystemId: string,
    layout: SubsystemLayoutFields,
  ) => Promise<boolean>;
  updateSubsystemConfiguration: WorkspaceContentPanelsViewProps["updateSubsystemConfiguration"];
  openTimelineTaskDetailsModal: WorkspaceContentPanelsViewProps["openTimelineTaskDetailsModal"];
  setActivePersonFilter: WorkspaceContentPanelsViewProps["setActivePersonFilter"];
  subsystemsById: WorkspaceContentPanelsViewProps["subsystemsById"];
  taskSwipeDirection: WorkspaceContentPanelsViewProps["taskSwipeDirection"];
  taskView: WorkspaceContentPanelsViewProps["taskView"];
  timelineMilestoneCreateSignal: WorkspaceContentPanelsViewProps["timelineMilestoneCreateSignal"];
  handleTimelineMilestoneDelete: WorkspaceContentPanelsViewProps["handleTimelineMilestoneDelete"];
  handleTimelineMilestoneSave: WorkspaceContentPanelsViewProps["handleTimelineMilestoneSave"];
}

export interface WorkspaceRiskPanelProps {
  activePersonFilter: WorkspaceContentPanelsViewProps["activePersonFilter"];
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  isAllProjectsView: WorkspaceContentPanelsViewProps["isAllProjectsView"];
  onCreateRisk: WorkspaceContentPanelsViewProps["onCreateRisk"];
  onDeleteRisk: WorkspaceContentPanelsViewProps["onDeleteRisk"];
  onUpdateRisk: WorkspaceContentPanelsViewProps["onUpdateRisk"];
  riskManagementView: WorkspaceContentPanelsViewProps["riskManagementView"];
}

export interface WorkspaceWorklogsPanelProps {
  activePersonFilter: WorkspaceContentPanelsViewProps["activePersonFilter"];
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  membersById: WorkspaceContentPanelsViewProps["membersById"];
  openCreateWorkLogModal: WorkspaceContentPanelsViewProps["openCreateWorkLogModal"];
  openTimelineTaskDetailsModal: WorkspaceContentPanelsViewProps["openTimelineTaskDetailsModal"];
  subsystemsById: WorkspaceContentPanelsViewProps["subsystemsById"];
  worklogsView: WorkspaceContentPanelsViewProps["worklogsView"];
}

export interface WorkspaceReportsPanelProps {
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  openCreateMilestoneReportModal: WorkspaceContentPanelsViewProps["openCreateMilestoneReportModal"];
  openCreateQaReportModal: WorkspaceContentPanelsViewProps["openCreateQaReportModal"];
  openTimelineTaskDetailsModal: WorkspaceContentPanelsViewProps["openTimelineTaskDetailsModal"];
  reportsSwipeDirection: WorkspaceContentPanelsViewProps["reportsSwipeDirection"];
  reportsView: WorkspaceContentPanelsViewProps["reportsView"];
}

export interface WorkspaceManufacturingPanelProps {
  activePersonFilter: WorkspaceContentPanelsViewProps["activePersonFilter"];
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  cncItems: WorkspaceContentPanelsViewProps["cncItems"];
  fabricationItems: WorkspaceContentPanelsViewProps["fabricationItems"];
  printItems: WorkspaceContentPanelsViewProps["printItems"];
  membersById: WorkspaceContentPanelsViewProps["membersById"];
  subsystemsById: WorkspaceContentPanelsViewProps["subsystemsById"];
  showCncMentorQuickActions: WorkspaceContentPanelsViewProps["showCncMentorQuickActions"];
  manufacturingView: WorkspaceContentPanelsViewProps["manufacturingView"];
  manufacturingSwipeDirection: WorkspaceContentPanelsViewProps["manufacturingSwipeDirection"];
  onCncQuickStatusChange: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  openCreateManufacturingModal: WorkspaceContentPanelsViewProps["openCreateManufacturingModal"];
  openEditManufacturingModal: WorkspaceContentPanelsViewProps["openEditManufacturingModal"];
}

export interface WorkspaceInventoryPanelProps {
  activePersonFilter: WorkspaceContentPanelsViewProps["activePersonFilter"];
  artifacts: WorkspaceContentPanelsViewProps["artifacts"];
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  effectiveInventoryView: WorkspaceContentPanelsViewProps["effectiveInventoryView"];
  inventorySwipeDirection: WorkspaceContentPanelsViewProps["inventorySwipeDirection"];
  isNonRobotProject: WorkspaceContentPanelsViewProps["isNonRobotProject"];
  mechanismsById: WorkspaceContentPanelsViewProps["mechanismsById"];
  membersById: WorkspaceContentPanelsViewProps["membersById"];
  partDefinitionsById: WorkspaceContentPanelsViewProps["partDefinitionsById"];
  subsystemsById: WorkspaceContentPanelsViewProps["subsystemsById"];
  openCreateArtifactModal: WorkspaceContentPanelsViewProps["openCreateArtifactModal"];
  openCreateMaterialModal: WorkspaceContentPanelsViewProps["openCreateMaterialModal"];
  openCreatePartDefinitionModal: WorkspaceContentPanelsViewProps["openCreatePartDefinitionModal"];
  openCreatePurchaseModal: WorkspaceContentPanelsViewProps["openCreatePurchaseModal"];
  openEditArtifactModal: WorkspaceContentPanelsViewProps["openEditArtifactModal"];
  openEditMaterialModal: WorkspaceContentPanelsViewProps["openEditMaterialModal"];
  openEditPartDefinitionModal: WorkspaceContentPanelsViewProps["openEditPartDefinitionModal"];
  openEditPurchaseModal: WorkspaceContentPanelsViewProps["openEditPurchaseModal"];
}

export interface WorkspaceRosterPanelProps {
  allMembers: WorkspaceContentPanelsViewProps["allMembers"];
  bootstrap: WorkspaceContentPanelsViewProps["bootstrap"];
  externalMembers: WorkspaceContentPanelsViewProps["externalMembers"];
  handleCreateMember: WorkspaceContentPanelsViewProps["handleCreateMember"];
  handleDeleteMember: WorkspaceContentPanelsViewProps["handleDeleteMember"];
  handleReactivateMemberForSeason: WorkspaceContentPanelsViewProps["handleReactivateMemberForSeason"];
  handleUpdateMember: WorkspaceContentPanelsViewProps["handleUpdateMember"];
  isAddPersonOpen: WorkspaceContentPanelsViewProps["isAddPersonOpen"];
  isDeletingMember: WorkspaceContentPanelsViewProps["isDeletingMember"];
  isEditPersonOpen: WorkspaceContentPanelsViewProps["isEditPersonOpen"];
  isSavingMember: WorkspaceContentPanelsViewProps["isSavingMember"];
  memberEditDraft: WorkspaceContentPanelsViewProps["memberEditDraft"];
  memberForm: WorkspaceContentPanelsViewProps["memberForm"];
  requestMemberPhotoUpload: WorkspaceContentPanelsViewProps["requestMemberPhotoUpload"];
  rosterMentors: WorkspaceContentPanelsViewProps["rosterMentors"];
  rosterView: WorkspaceContentPanelsViewProps["rosterView"];
  openTimelineTaskDetailsModal: WorkspaceContentPanelsViewProps["openTimelineTaskDetailsModal"];
  selectMember: WorkspaceContentPanelsViewProps["selectMember"];
  selectedMemberId: WorkspaceContentPanelsViewProps["selectedMemberId"];
  selectedProject: WorkspaceContentPanelsViewProps["selectedProject"];
  selectedSeasonId: WorkspaceContentPanelsViewProps["selectedSeasonId"];
  setIsAddPersonOpen: WorkspaceContentPanelsViewProps["setIsAddPersonOpen"];
  setIsEditPersonOpen: WorkspaceContentPanelsViewProps["setIsEditPersonOpen"];
  setMemberEditDraft: WorkspaceContentPanelsViewProps["setMemberEditDraft"];
  setMemberForm: WorkspaceContentPanelsViewProps["setMemberForm"];
  students: WorkspaceContentPanelsViewProps["students"];
}

export interface WorkspaceTutorialPanelProps {
  interactiveTutorialChapters: WorkspaceContentPanelsViewProps["interactiveTutorialChapters"];
  isInteractiveTutorialActive: WorkspaceContentPanelsViewProps["isInteractiveTutorialActive"];
  onStartInteractiveTutorial: WorkspaceContentPanelsViewProps["onStartInteractiveTutorial"];
  onStartInteractiveTutorialChapter: WorkspaceContentPanelsViewProps["onStartInteractiveTutorialChapter"];
}

export interface WorkspaceContentProps {
  shell: WorkspaceShellPanelProps;
  tasks: WorkspaceTaskPanelProps;
  risks: WorkspaceRiskPanelProps;
  worklogs: WorkspaceWorklogsPanelProps;
  reports: WorkspaceReportsPanelProps;
  manufacturing: WorkspaceManufacturingPanelProps;
  inventory: WorkspaceInventoryPanelProps;
  roster: WorkspaceRosterPanelProps;
  tutorial: WorkspaceTutorialPanelProps;
}
