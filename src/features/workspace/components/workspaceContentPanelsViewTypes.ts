import type { InventoryViewTab } from "@/lib/workspaceNavigation";
import type { WorkspaceContentPanelsProps } from "../WorkspaceContentPanelsCoreImpl";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";

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
  openEditMechanismModal: WorkspaceContentPanelsViewProps["openEditMechanismModal"];
  openEditSubsystemModal: WorkspaceContentPanelsViewProps["openEditSubsystemModal"];
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

export function groupWorkspaceContentPanelProps(
  props: WorkspaceContentPanelsViewProps,
): WorkspaceContentProps {
  return {
    shell: {
      activeTab: props.activeTab,
      tabSwitchDirection: props.tabSwitchDirection,
      disablePanelAnimations: props.disablePanelAnimations,
      isLoadingData: props.isLoadingData,
      dataMessage: props.dataMessage,
      taskEditNotices: props.taskEditNotices,
      onDismissDataMessage: props.onDismissDataMessage,
      onDismissTaskEditNotice: props.onDismissTaskEditNotice,
      onTaskEditCanceled: props.onTaskEditCanceled,
      onTaskEditSaved: props.onTaskEditSaved,
    },
    tasks: {
      activePersonFilter: props.activePersonFilter,
      bootstrap: props.bootstrap,
      disciplinesById: props.disciplinesById,
      isAllProjectsView: props.isAllProjectsView,
      isNonRobotProject: props.isNonRobotProject,
      membersById: props.membersById,
      openCreateTaskModal: props.openCreateTaskModal,
      openCreateTaskModalFromTimeline: props.openCreateTaskModalFromTimeline,
      openCreateMechanismModal: props.openCreateMechanismModal,
      openCreatePartInstanceModal: props.openCreatePartInstanceModal,
      openCreateSubsystemModal: props.openCreateSubsystemModal,
      openEditMechanismModal: props.openEditMechanismModal,
      openEditSubsystemModal: props.openEditSubsystemModal,
      openTimelineTaskDetailsModal: props.openTimelineTaskDetailsModal,
      setActivePersonFilter: props.setActivePersonFilter,
      subsystemsById: props.subsystemsById,
      taskSwipeDirection: props.taskSwipeDirection,
      taskView: props.taskView,
      timelineMilestoneCreateSignal: props.timelineMilestoneCreateSignal,
      handleTimelineMilestoneDelete: props.handleTimelineMilestoneDelete,
      handleTimelineMilestoneSave: props.handleTimelineMilestoneSave,
    },
    risks: {
      activePersonFilter: props.activePersonFilter,
      bootstrap: props.bootstrap,
      isAllProjectsView: props.isAllProjectsView,
      onCreateRisk: props.onCreateRisk,
      onDeleteRisk: props.onDeleteRisk,
      onUpdateRisk: props.onUpdateRisk,
      riskManagementView: props.riskManagementView,
    },
    worklogs: {
      activePersonFilter: props.activePersonFilter,
      bootstrap: props.bootstrap,
      membersById: props.membersById,
      openCreateWorkLogModal: props.openCreateWorkLogModal,
      openTimelineTaskDetailsModal: props.openTimelineTaskDetailsModal,
      subsystemsById: props.subsystemsById,
      worklogsView: props.worklogsView,
    },
    reports: {
      bootstrap: props.bootstrap,
      openCreateMilestoneReportModal: props.openCreateMilestoneReportModal,
      openCreateQaReportModal: props.openCreateQaReportModal,
      openTimelineTaskDetailsModal: props.openTimelineTaskDetailsModal,
      reportsSwipeDirection: props.reportsSwipeDirection,
      reportsView: props.reportsView,
    },
    manufacturing: {
      activePersonFilter: props.activePersonFilter,
      bootstrap: props.bootstrap,
      cncItems: props.cncItems,
      fabricationItems: props.fabricationItems,
      printItems: props.printItems,
      membersById: props.membersById,
      subsystemsById: props.subsystemsById,
      showCncMentorQuickActions: props.showCncMentorQuickActions,
      manufacturingView: props.manufacturingView,
      manufacturingSwipeDirection: props.manufacturingSwipeDirection,
      onCncQuickStatusChange: props.onCncQuickStatusChange,
      openCreateManufacturingModal: props.openCreateManufacturingModal,
      openEditManufacturingModal: props.openEditManufacturingModal,
    },
    inventory: {
      activePersonFilter: props.activePersonFilter,
      artifacts: props.artifacts,
      bootstrap: props.bootstrap,
      effectiveInventoryView: props.effectiveInventoryView,
      inventorySwipeDirection: props.inventorySwipeDirection,
      isNonRobotProject: props.isNonRobotProject,
      mechanismsById: props.mechanismsById,
      membersById: props.membersById,
      partDefinitionsById: props.partDefinitionsById,
      subsystemsById: props.subsystemsById,
      openCreateArtifactModal: props.openCreateArtifactModal,
      openCreateMaterialModal: props.openCreateMaterialModal,
      openCreatePartDefinitionModal: props.openCreatePartDefinitionModal,
      openCreatePurchaseModal: props.openCreatePurchaseModal,
      openEditArtifactModal: props.openEditArtifactModal,
      openEditMaterialModal: props.openEditMaterialModal,
      openEditPartDefinitionModal: props.openEditPartDefinitionModal,
      openEditPurchaseModal: props.openEditPurchaseModal,
    },
    roster: {
      allMembers: props.allMembers,
      bootstrap: props.bootstrap,
      externalMembers: props.externalMembers,
      handleCreateMember: props.handleCreateMember,
      handleDeleteMember: props.handleDeleteMember,
      handleReactivateMemberForSeason: props.handleReactivateMemberForSeason,
      handleUpdateMember: props.handleUpdateMember,
      isAddPersonOpen: props.isAddPersonOpen,
      isDeletingMember: props.isDeletingMember,
      isEditPersonOpen: props.isEditPersonOpen,
      isSavingMember: props.isSavingMember,
      memberEditDraft: props.memberEditDraft,
      memberForm: props.memberForm,
      requestMemberPhotoUpload: props.requestMemberPhotoUpload,
      rosterMentors: props.rosterMentors,
      rosterView: props.rosterView,
      selectMember: props.selectMember,
      selectedMemberId: props.selectedMemberId,
      selectedProject: props.selectedProject,
      selectedSeasonId: props.selectedSeasonId,
      setIsAddPersonOpen: props.setIsAddPersonOpen,
      setIsEditPersonOpen: props.setIsEditPersonOpen,
      setMemberEditDraft: props.setMemberEditDraft,
      setMemberForm: props.setMemberForm,
      students: props.students,
    },
    tutorial: {
      interactiveTutorialChapters: props.interactiveTutorialChapters,
      isInteractiveTutorialActive: props.isInteractiveTutorialActive,
      onStartInteractiveTutorial: props.onStartInteractiveTutorial,
      onStartInteractiveTutorialChapter: props.onStartInteractiveTutorialChapter,
    },
  };
}
