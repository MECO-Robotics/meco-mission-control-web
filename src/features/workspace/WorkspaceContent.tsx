import {
  memo,
  useEffect,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  useRef,
  type SetStateAction,
} from "react";

import type {
  ArtifactKind,
  ArtifactRecord,
  BootstrapPayload,
  EventPayload,
  ManufacturingItemRecord,
  MaterialRecord,
  MemberPayload,
  PartDefinitionRecord,
  PurchaseItemRecord,
  RiskPayload,
  TaskRecord,
} from "@/types";
import {
  INVENTORY_VIEW_ORDER,
  MANUFACTURING_VIEW_ORDER,
  TASK_VIEW_ORDER,
  WORKLOG_VIEW_ORDER,
  type InventoryViewTab,
  type ManufacturingViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
} from "@/lib/workspaceNavigation";
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
import type { FilterSelection } from "@/features/workspace/shared";
import { SUBVIEW_INTERACTION_GUIDANCE } from "@/features/workspace/shared/workspaceSubviewGuidance";

type SwipeDirection = "left" | "right" | null;
type TabSwitchDirection = "up" | "down";

const DOCUMENT_ARTIFACT_KINDS: readonly ArtifactKind[] = ["document", "nontechnical"];
const MemoizedTimelineView = memo(TimelineView);

function getSwipeDirection<T extends string>(
  previousView: T,
  currentView: T,
  viewOrder: readonly T[],
): SwipeDirection {
  if (previousView === currentView) {
    return null;
  }

  const previousIndex = viewOrder.indexOf(previousView);
  const currentIndex = viewOrder.indexOf(currentView);

  if (previousIndex < 0 || currentIndex < 0) {
    return null;
  }

  return currentIndex > previousIndex ? "left" : "right";
}

interface WorkspaceContentProps {
  activePersonFilter: FilterSelection;
  activeTab: ViewTab;
  tabSwitchDirection: TabSwitchDirection;
  allMembers: BootstrapPayload["members"];
  artifacts: ArtifactRecord[];
  bootstrap: BootstrapPayload;
  cncItems: ManufacturingItemRecord[];
  dataMessage: string | null;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  externalMembers: BootstrapPayload["members"];
  fabricationItems: ManufacturingItemRecord[];
  handleCreateMember: (event: FormEvent<HTMLFormElement>) => void;
  handleReactivateMemberForSeason: (memberId: string) => Promise<void>;
  handleDeleteMember: (id: string) => void;
  handleTimelineEventDelete: (eventId: string) => Promise<void>;
  handleTimelineEventSave: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
  handleUpdateMember: (event: FormEvent<HTMLFormElement>) => void;
  isAddPersonOpen: boolean;
  isDeletingMember: boolean;
  isEditPersonOpen: boolean;
  isLoadingData: boolean;
  isAllProjectsView: boolean;
  isNonRobotProject: boolean;
  isSavingMember: boolean;
  memberEditDraft: MemberPayload | null;
  memberForm: MemberPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  openCreateManufacturingModal: (process: "cnc" | "3d-print" | "fabrication") => void;
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openCreateMaterialModal: () => void;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openCreatePartDefinitionModal: () => void;
  openCreatePurchaseModal: () => void;
  openCreateTaskModal: () => void;
  openCreateTaskModalFromTimeline: () => void;
  openCreateWorkLogModal: () => void;
  openCreateQaReportModal: () => void;
  openCreateEventReportModal: () => void;
  openCreateWorkstreamModal: () => void;
  openEditWorkstreamModal: (workstream: BootstrapPayload["workstreams"][number]) => void;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onCncQuickStatusChange: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  openEditManufacturingModal: (item: ManufacturingItemRecord) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  openEditMaterialModal: (item: MaterialRecord) => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  openTimelineTaskDetailsModal: (task: TaskRecord) => void;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  printItems: ManufacturingItemRecord[];
  rosterMentors: BootstrapPayload["members"];
  showCncMentorQuickActions: boolean;
  manufacturingView: ManufacturingViewTab;
  inventoryView: InventoryViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
  selectMember: (id: string | null, payload: BootstrapPayload) => void;
  selectedSeasonId: string | null;
  selectedMemberId: string | null;
  setActivePersonFilter: (value: FilterSelection) => void;
  setIsAddPersonOpen: (open: boolean) => void;
  setIsEditPersonOpen: (open: boolean) => void;
  setMemberEditDraft: Dispatch<SetStateAction<MemberPayload | null>>;
  setMemberForm: Dispatch<SetStateAction<MemberPayload>>;
  students: BootstrapPayload["members"];
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  timelineMilestoneCreateSignal: number;
  disablePanelAnimations?: boolean;
  onDismissDataMessage: () => void;
  onStartInteractiveTutorial?: () => void;
  onStartInteractiveTutorialChapter?: (chapterId: string) => void;
  interactiveTutorialChapters?: Array<{
    id: string;
    title: string;
    summary: string;
    completed?: boolean;
  }>;
  isInteractiveTutorialActive?: boolean;
}

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

  return (
    <div className={`workspace-tab-panel${animationClass}`}>
      {children}
    </div>
  );
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

function WorkspaceErrorPopup({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const dismissButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    dismissButtonRef.current?.focus();
  }, [message]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="modal-scrim error-popup-scrim"
      onClick={onDismiss}
      role="presentation"
      style={{ zIndex: 2600 }}
    >
      <section
        aria-describedby="workspace-error-message"
        aria-labelledby="workspace-error-title"
        aria-modal="true"
        className="modal-card error-popup-card"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--official-red)" }}>
              Workspace error
            </p>
            <h2 id="workspace-error-title">Something needs your attention</h2>
          </div>
          <button
            ref={dismissButtonRef}
            className="icon-button"
            onClick={onDismiss}
            type="button"
          >
            Dismiss
          </button>
        </div>

        <p className="error-popup-message" id="workspace-error-message">
          {message}
        </p>

        <div className="error-popup-actions">
          <button className="primary-action" onClick={onDismiss} type="button">
            Close popup
          </button>
        </div>
      </section>
    </div>
  );
}

export function WorkspaceContent({
  activePersonFilter,
  activeTab,
  tabSwitchDirection,
  allMembers,
  artifacts,
  bootstrap,
  cncItems,
  dataMessage,
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
  inventoryView,
  riskManagementView,
  taskView,
  worklogsView,
  selectMember,
  selectedSeasonId,
  selectedMemberId,
  setActivePersonFilter,
  setIsAddPersonOpen,
  setIsEditPersonOpen,
  setMemberEditDraft,
  setMemberForm,
  students,
  subsystemsById,
  timelineMilestoneCreateSignal,
  disablePanelAnimations = false,
  onDismissDataMessage,
  onStartInteractiveTutorial,
  onStartInteractiveTutorialChapter,
  interactiveTutorialChapters,
  isInteractiveTutorialActive = false,
}: WorkspaceContentProps) {
  const effectiveInventoryView =
    isNonRobotProject && inventoryView === "parts" ? "materials" : inventoryView;
  const previousTaskViewRef = useRef(taskView);
  const previousWorklogsViewRef = useRef(worklogsView);
  const previousManufacturingViewRef = useRef(manufacturingView);
  const previousInventoryViewRef = useRef(effectiveInventoryView);

  const taskSwipeDirection = getSwipeDirection(
    previousTaskViewRef.current,
    taskView,
    TASK_VIEW_ORDER,
  );
  const manufacturingSwipeDirection = getSwipeDirection(
    previousManufacturingViewRef.current,
    manufacturingView,
    MANUFACTURING_VIEW_ORDER,
  );
  const worklogsSwipeDirection = getSwipeDirection(
    previousWorklogsViewRef.current,
    worklogsView,
    WORKLOG_VIEW_ORDER,
  );
  const inventorySwipeDirection = getSwipeDirection(
    previousInventoryViewRef.current,
    effectiveInventoryView,
    INVENTORY_VIEW_ORDER,
  );

  useEffect(() => {
    previousTaskViewRef.current = taskView;
  }, [taskView]);

  useEffect(() => {
    previousWorklogsViewRef.current = worklogsView;
  }, [worklogsView]);

  useEffect(() => {
    previousManufacturingViewRef.current = manufacturingView;
  }, [manufacturingView]);

  useEffect(() => {
    previousInventoryViewRef.current = effectiveInventoryView;
  }, [effectiveInventoryView]);

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
          isActive={worklogsView === "logs"}
          swipeDirection={worklogsSwipeDirection}
        >
          <WorkLogsView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateWorkLogModal={openCreateWorkLogModal}
            openEditTaskModal={openTimelineTaskDetailsModal}
            subsystemsById={subsystemsById}
            view="logs"
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.summary}
          disableAnimations={disablePanelAnimations}
          isActive={worklogsView === "summary"}
          swipeDirection={worklogsSwipeDirection}
        >
          <WorkLogsView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateWorkLogModal={openCreateWorkLogModal}
            openEditTaskModal={openTimelineTaskDetailsModal}
            subsystemsById={subsystemsById}
            view="summary"
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
          isActive
        >
          <ReportsView
            bootstrap={bootstrap}
            openCreateEventReportModal={openCreateEventReportModal}
            openCreateQaReportModal={openCreateQaReportModal}
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
