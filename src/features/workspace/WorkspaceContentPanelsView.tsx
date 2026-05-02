import { memo, type ReactNode } from "react";

import type { InventoryViewTab } from "@/lib/workspaceNavigation";
import {
  ArtifactInventoryView,
  CncView,
  FabricationView,
  HelpView,
  MaterialsView,
  MilestonesView,
  PartsView,
  PrintsView,
  PurchasesView,
  ReportsView,
  RosterView,
  RisksView,
  SubsystemsView,
  TaskQueueView,
  TimelineView,
  WorkflowView,
  WorkLogsView,
} from "@/features/workspace/views";
import type { WorkspaceContentPanelsProps } from "./WorkspaceContentPanelsCoreImpl";
import { WorkspaceErrorPopup, WorkspaceInfoToast } from "./WorkspaceStatusToast";
import { SUBVIEW_INTERACTION_GUIDANCE } from "@/features/workspace/shared/workspaceSubviewGuidance";

type SwipeDirection = "left" | "right" | null;
type TabSwitchDirection = "up" | "down";

const DOCUMENT_ARTIFACT_KINDS: readonly ["document", "nontechnical"] = [
  "document",
  "nontechnical",
];
const MemoizedTimelineView = memo(TimelineView);

type WorkspaceContentPanelsViewProps = WorkspaceContentPanelsProps & {
  effectiveInventoryView: InventoryViewTab;
  taskSwipeDirection: SwipeDirection;
  reportsSwipeDirection: SwipeDirection;
  manufacturingSwipeDirection: SwipeDirection;
  inventorySwipeDirection: SwipeDirection;
};

function WorkspaceSectionPanel({
  children,
  disableAnimations = false,
  isActive,
  tabSwitchDirection,
}: {
  children: ReactNode;
  disableAnimations?: boolean;
  isActive: boolean;
  tabSwitchDirection: TabSwitchDirection;
}) {
  if (!isActive) {
    return null;
  }

  const animationClass = !disableAnimations
    ? ` workspace-tab-panel-enter workspace-tab-panel-enter-${tabSwitchDirection}`
    : "";

  return <div className={`workspace-tab-panel${animationClass}`}>{children}</div>;
}

function WorkspaceSubPanel({
  children,
  description,
  disableAnimations = false,
  isActive,
  swipeDirection = null,
}: {
  children: ReactNode;
  description: string;
  disableAnimations?: boolean;
  isActive: boolean;
  swipeDirection?: SwipeDirection;
}) {
  if (!isActive) {
    return null;
  }

  const panelAnimation = !disableAnimations ? swipeDirection ?? "neutral" : undefined;

  return (
    <div
      className="workspace-tab-panel workspace-subtab-panel"
      data-swipe-direction={panelAnimation}
    >
      {children}
      <div className="tab-interaction-note" role="note">
        <span className="tab-interaction-note-label">How to use this view</span>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function WorkspaceContentPanelsView({
  activePersonFilter,
  activeTab,
  tabSwitchDirection,
  allMembers,
  artifacts,
  bootstrap,
  cncItems,
  disciplinesById,
  externalMembers,
  fabricationItems,
  handleCreateMember,
  handleReactivateMemberForSeason,
  handleDeleteMember,
  handleTimelineEventDelete,
  handleTimelineEventSave,
  handleUpdateMember,
  isAddPersonOpen,
  isDeletingMember,
  isEditPersonOpen,
  isLoadingData,
  isAllProjectsView,
  isNonRobotProject,
  isSavingMember,
  memberEditDraft,
  memberForm,
  membersById,
  mechanismsById,
  openCreateManufacturingModal,
  openCreateArtifactModal,
  openCreateMaterialModal,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  openCreatePartDefinitionModal,
  openCreatePurchaseModal,
  openCreateTaskModal,
  openCreateTaskModalFromTimeline,
  openCreateWorkLogModal,
  openCreateQaReportModal,
  openCreateEventReportModal,
  openCreateWorkstreamModal,
  openEditWorkstreamModal,
  onCreateRisk,
  onDeleteRisk,
  onCncQuickStatusChange,
  openEditManufacturingModal,
  openEditArtifactModal,
  openEditMaterialModal,
  openEditMechanismModal,
  openEditPartInstanceModal,
  openEditSubsystemModal,
  openEditPartDefinitionModal,
  openEditPurchaseModal,
  openTimelineTaskDetailsModal,
  onUpdateRisk,
  partDefinitionsById,
  printItems,
  rosterMentors,
  showCncMentorQuickActions,
  manufacturingView,
  effectiveInventoryView,
  inventorySwipeDirection,
  riskManagementView,
  reportsSwipeDirection,
  reportsView,
  taskSwipeDirection,
  taskView,
  worklogsView,
  selectMember,
  selectedSeasonId,
  selectedMemberId,
  selectedProject,
  requestMemberPhotoUpload,
  setActivePersonFilter,
  setIsAddPersonOpen,
  setIsEditPersonOpen,
  setMemberEditDraft,
  setMemberForm,
  students,
  subsystemsById,
  timelineMilestoneCreateSignal,
  disablePanelAnimations = false,
  onStartInteractiveTutorial,
  onStartInteractiveTutorialChapter,
  interactiveTutorialChapters,
  isInteractiveTutorialActive = false,
  onDismissDataMessage,
  onDismissTaskEditNotice,
  dataMessage,
  taskEditNotice,
  manufacturingSwipeDirection,
}: WorkspaceContentPanelsViewProps) {
  return (
    <div
      className="dense-shell"
      style={{
        padding: 0,
        margin: 0,
        maxWidth: "none",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        minHeight: "100%",
      }}
    >
      {taskEditNotice ? (
        <WorkspaceInfoToast message={taskEditNotice} onDismiss={onDismissTaskEditNotice} />
      ) : null}
      {dataMessage ? (
        <WorkspaceErrorPopup message={dataMessage} onDismiss={onDismissDataMessage} />
      ) : null}
      {isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "tasks"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.timeline}
          isActive={taskView === "timeline"}
          swipeDirection={taskSwipeDirection}
        >
          <MemoizedTimelineView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            isAllProjectsView={isAllProjectsView}
            membersById={membersById}
            onDeleteTimelineEvent={handleTimelineEventDelete}
            onSaveTimelineEvent={handleTimelineEventSave}
            openCreateTaskModal={openCreateTaskModalFromTimeline}
            openTaskDetailModal={openTimelineTaskDetailsModal}
            setActivePersonFilter={setActivePersonFilter}
            triggerCreateMilestoneToken={timelineMilestoneCreateSignal}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.queue}
          isActive={taskView === "queue"}
          swipeDirection={taskSwipeDirection}
        >
          <TaskQueueView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            disciplinesById={disciplinesById}
            isAllProjectsView={isAllProjectsView}
            isNonRobotProject={isNonRobotProject}
            membersById={membersById}
            openCreateTaskModal={openCreateTaskModal}
            openEditTaskModal={openTimelineTaskDetailsModal}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.milestones}
          isActive={taskView === "milestones"}
          swipeDirection={taskSwipeDirection}
        >
          <MilestonesView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            isAllProjectsView={isAllProjectsView}
            onDeleteTimelineEvent={handleTimelineEventDelete}
            onSaveTimelineEvent={handleTimelineEventSave}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "risk-management"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE["risk-management"]}
          isActive
        >
          <RisksView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            onCreateRisk={onCreateRisk}
            onDeleteRisk={onDeleteRisk}
            onUpdateRisk={onUpdateRisk}
            view={riskManagementView}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "worklogs"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.logs}
          disableAnimations={disablePanelAnimations}
          isActive
        >
          <WorkLogsView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateWorkLogModal={openCreateWorkLogModal}
            openEditTaskModal={openTimelineTaskDetailsModal}
            subsystemsById={subsystemsById}
            view={worklogsView}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "reports"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.reports}
          disableAnimations={disablePanelAnimations}
          isActive={reportsView === "qa"}
          swipeDirection={reportsSwipeDirection}
        >
          <ReportsView
            bootstrap={bootstrap}
            openCreateEventReportModal={openCreateEventReportModal}
            openCreateQaReportModal={openCreateQaReportModal}
            openTaskDetailsModal={openTimelineTaskDetailsModal}
            view="qa"
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.reports}
          disableAnimations={disablePanelAnimations}
          isActive={reportsView === "event-results"}
          swipeDirection={reportsSwipeDirection}
        >
          <ReportsView
            bootstrap={bootstrap}
            openCreateEventReportModal={openCreateEventReportModal}
            openCreateQaReportModal={openCreateQaReportModal}
            openTaskDetailsModal={openTimelineTaskDetailsModal}
            view="event-results"
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "manufacturing"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.cnc}
          isActive={manufacturingView === "cnc"}
          swipeDirection={manufacturingSwipeDirection}
        >
          <CncView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            items={cncItems}
            membersById={membersById}
            onCreate={() => openCreateManufacturingModal("cnc")}
            onEdit={openEditManufacturingModal}
            onQuickStatusChange={onCncQuickStatusChange}
            showMentorQuickActions={showCncMentorQuickActions}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.prints}
          isActive={manufacturingView === "prints"}
          swipeDirection={manufacturingSwipeDirection}
        >
          <PrintsView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            items={printItems}
            membersById={membersById}
            onCreate={() => openCreateManufacturingModal("3d-print")}
            onEdit={openEditManufacturingModal}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.fabrication}
          isActive={manufacturingView === "fabrication"}
          swipeDirection={manufacturingSwipeDirection}
        >
          <FabricationView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            items={fabricationItems}
            membersById={membersById}
            onCreate={() => openCreateManufacturingModal("fabrication")}
            onEdit={openEditManufacturingModal}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "inventory"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={
            isNonRobotProject
              ? SUBVIEW_INTERACTION_GUIDANCE.documents
              : SUBVIEW_INTERACTION_GUIDANCE.materials
          }
          isActive={effectiveInventoryView === "materials"}
          swipeDirection={inventorySwipeDirection}
        >
          {isNonRobotProject ? (
            <ArtifactInventoryView
              artifacts={artifacts}
              bootstrap={bootstrap}
              createKind="document"
              kinds={DOCUMENT_ARTIFACT_KINDS}
              openCreateArtifactModal={openCreateArtifactModal}
              openEditArtifactModal={openEditArtifactModal}
              title="Documents"
            />
          ) : (
            <MaterialsView
              bootstrap={bootstrap}
              openCreateMaterialModal={openCreateMaterialModal}
              openEditMaterialModal={openEditMaterialModal}
            />
          )}
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.parts}
          isActive={!isNonRobotProject && effectiveInventoryView === "parts"}
          swipeDirection={inventorySwipeDirection}
        >
          <PartsView
            bootstrap={bootstrap}
            openCreatePartDefinitionModal={openCreatePartDefinitionModal}
            openEditPartDefinitionModal={openEditPartDefinitionModal}
            mechanismsById={mechanismsById}
            partDefinitionsById={partDefinitionsById}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.purchases}
          isActive={effectiveInventoryView === "purchases"}
          swipeDirection={inventorySwipeDirection}
        >
          <PurchasesView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreatePurchaseModal={openCreatePurchaseModal}
            openEditPurchaseModal={openEditPurchaseModal}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "subsystems"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={
            isNonRobotProject
              ? SUBVIEW_INTERACTION_GUIDANCE.workflow
              : SUBVIEW_INTERACTION_GUIDANCE.subsystems
          }
          isActive
        >
          {isNonRobotProject ? (
            <WorkflowView
              artifacts={artifacts}
              bootstrap={bootstrap}
              membersById={membersById}
              openCreateWorkstreamModal={openCreateWorkstreamModal}
              openEditWorkstreamModal={openEditWorkstreamModal}
            />
          ) : (
            <SubsystemsView
              bootstrap={bootstrap}
              membersById={membersById}
              openCreateMechanismModal={openCreateMechanismModal}
              openCreatePartInstanceModal={openCreatePartInstanceModal}
              openCreateSubsystemModal={openCreateSubsystemModal}
              openEditMechanismModal={openEditMechanismModal}
              openEditPartInstanceModal={openEditPartInstanceModal}
              openEditSubsystemModal={openEditSubsystemModal}
            />
          )}
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "roster"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.roster}
          disableAnimations={disablePanelAnimations}
          isActive
        >
          <RosterView
            allMembers={allMembers}
            bootstrap={bootstrap}
            selectedProject={selectedProject}
            handleCreateMember={handleCreateMember}
            handleReactivateMemberForSeason={handleReactivateMemberForSeason}
            handleDeleteMember={handleDeleteMember}
            handleUpdateMember={handleUpdateMember}
            isAddPersonOpen={isAddPersonOpen}
            isDeletingMember={isDeletingMember}
            isEditPersonOpen={isEditPersonOpen}
            isSavingMember={isSavingMember}
            memberEditDraft={memberEditDraft}
            memberForm={memberForm}
            externalMembers={externalMembers}
            rosterMentors={rosterMentors}
            requestMemberPhotoUpload={requestMemberPhotoUpload}
            selectMember={selectMember}
            selectedSeasonId={selectedSeasonId}
            selectedMemberId={selectedMemberId}
            setIsAddPersonOpen={setIsAddPersonOpen}
            setIsEditPersonOpen={setIsEditPersonOpen}
            setMemberEditDraft={setMemberEditDraft}
            setMemberForm={setMemberForm}
            students={students}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel
        disableAnimations={disablePanelAnimations}
        isActive={activeTab === "help"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.help}
          disableAnimations={disablePanelAnimations}
          isActive
        >
          <HelpView
            onStartInteractiveTutorial={onStartInteractiveTutorial}
            onStartInteractiveTutorialChapter={onStartInteractiveTutorialChapter}
            interactiveTutorialChapters={interactiveTutorialChapters}
            isInteractiveTutorialActive={isInteractiveTutorialActive}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>
    </div>
  );
}
