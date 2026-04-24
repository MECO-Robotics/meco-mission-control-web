import {
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
  TaskRecord,
} from "@/types";
import {
  ArtifactInventoryView,
  CncView,
  FabricationView,
  MaterialsView,
  MilestonesView,
  PartsView,
  PrintsView,
  PurchasesView,
  RosterView,
  SubsystemsView,
  TaskQueueView,
  TimelineView,
  WorkflowView,
  WorkLogsView,
} from "@/features/workspace/views";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  TaskViewTab,
  ViewTab,
} from "@/features/workspace/shared";

type WorkspaceSubviewTab =
  | TaskViewTab
  | ManufacturingViewTab
  | InventoryViewTab
  | "worklogs"
  | "documents"
  | "nontechnical"
  | "subsystems"
  | "workflow"
  | "roster";

type SwipeDirection = "left" | "right" | null;
type TabSwitchDirection = "up" | "down";

const SUBVIEW_INTERACTION_GUIDANCE: Record<WorkspaceSubviewTab, string> = {
  timeline:
    "Use the person and date-range filters above to focus the schedule, click a date number to add or edit milestones for that day, collapse or expand subsystem rows with the arrows, and hover a task bar to reveal the pencil cue before clicking the task to edit it.",
  milestones:
    "Use search and filters to narrow milestones, click a row to edit details, and use Add to create new milestone events tied to relevant subsystems when needed.",
  queue:
    "Use search and filters to narrow the list, click a column header to sort, and hover any row to reveal the pencil cue before clicking the row to open its task details. Use Add to create a new task.",
  worklogs:
    "Search the log entries, filter by subsystem, add new work logs from the toolbar, and click a row to jump back to the linked task. The selected roster person stays in sync with the global workspace filter.",
  cnc:
    "Search and filter CNC jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new CNC request tied to a catalog part.",
  prints:
    "Search and filter 3D print jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new print request tied to a catalog part.",
  fabrication:
    "Search and filter fabrication jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new freeform fabrication request.",
  materials:
    "Use the search and stock filters to find inventory quickly, then hover a row to reveal the pencil cue before clicking the row to update quantities, vendors, locations, or notes. Use Add to track a new material.",
  documents:
    "Use search to find project artifacts quickly, hover a row to reveal the pencil cue, and click the row to update linked document details.",
  nontechnical:
    "Use this view to track non-technical outputs, ownership, and progress, then click any row to update details.",
  parts:
    "Search and filter the catalog from the toolbar, hover a part definition to reveal the pencil cue, and click the row to edit it. Use the edit modal to update or delete the part definition. Review matching part instances below for subsystem and mechanism ownership.",
  purchases:
    "Search or filter requests by subsystem, requester, status, vendor, or approval, then hover a row to reveal the pencil cue before clicking the row to review or update it. Use Add to log a new request against a real part from the Parts tab.",
  subsystems:
    "Search and filter subsystem ownership and mechanism coverage, click a subsystem row to expand its mechanisms underneath, hover the pencil on the right to edit the subsystem, and use the add controls to create or update subsystems, mechanisms, and mechanism-owned part instances.",
  workflow:
    "Search and filter workflow ownership, click a row to expand details, and use add or edit controls to keep non-technical workstreams current.",
  roster:
    "Use the plus buttons to add people to each group, click a name to select them, and hover a member to reveal the pencil affordance for editing or deleting them from the popup.",
};

const TASK_VIEW_ORDER: readonly TaskViewTab[] = ["timeline", "queue", "milestones"];
const MANUFACTURING_VIEW_ORDER: readonly ManufacturingViewTab[] = [
  "cnc",
  "prints",
  "fabrication",
];
const INVENTORY_VIEW_ORDER: readonly InventoryViewTab[] = ["materials", "parts", "purchases"];

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
  activePersonFilter: string;
  activeTab: ViewTab;
  tabSwitchDirection: TabSwitchDirection;
  artifacts: ArtifactRecord[];
  bootstrap: BootstrapPayload;
  cncItems: ManufacturingItemRecord[];
  dataMessage: string | null;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  fabricationItems: ManufacturingItemRecord[];
  handleCreateMember: (event: FormEvent<HTMLFormElement>) => void;
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
  openEditManufacturingModal: (item: ManufacturingItemRecord) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  openEditMaterialModal: (item: MaterialRecord) => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartInstanceModal: (partInstance: BootstrapPayload["partInstances"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  openEditTaskModal: (task: TaskRecord) => void;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  printItems: ManufacturingItemRecord[];
  rosterMentors: BootstrapPayload["members"];
  manufacturingView: ManufacturingViewTab;
  inventoryView: InventoryViewTab;
  taskView: TaskViewTab;
  selectMember: (id: string | null, payload: BootstrapPayload) => void;
  selectedMemberId: string | null;
  setActivePersonFilter: (value: string) => void;
  setIsAddPersonOpen: (open: boolean) => void;
  setIsEditPersonOpen: (open: boolean) => void;
  setMemberEditDraft: Dispatch<SetStateAction<MemberPayload | null>>;
  setMemberForm: Dispatch<SetStateAction<MemberPayload>>;
  students: BootstrapPayload["members"];
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  timelineMilestoneCreateSignal: number;
  disablePanelAnimations?: boolean;
  onDismissDataMessage: () => void;
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
  const animationClass = isActive && !disableAnimations
    ? ` workspace-tab-panel-enter workspace-tab-panel-enter-${tabSwitchDirection}`
    : "";

  return (
    <div
      className={`workspace-tab-panel${animationClass}`}
      hidden={!isActive}
      style={isActive ? undefined : { display: "none" }}
    >
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
  const panelAnimation =
    isActive && !disableAnimations ? swipeDirection ?? "neutral" : undefined;

  return (
    <div
      className="workspace-tab-panel workspace-subtab-panel"
      data-swipe-direction={panelAnimation}
      hidden={!isActive}
      style={isActive ? undefined : { display: "none" }}
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
  artifacts,
  bootstrap,
  cncItems,
  dataMessage,
  disciplinesById,
  eventsById,
  fabricationItems,
  handleCreateMember,
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
  openEditManufacturingModal,
  openEditArtifactModal,
  openEditMaterialModal,
  openEditMechanismModal,
  openEditPartInstanceModal,
  openEditSubsystemModal,
  openEditPartDefinitionModal,
  openEditPurchaseModal,
  openEditTaskModal,
  partDefinitionsById,
  partInstancesById,
  printItems,
  rosterMentors,
  manufacturingView,
  inventoryView,
  taskView,
  selectMember,
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
}: WorkspaceContentProps) {
  const previousTaskViewRef = useRef(taskView);
  const previousManufacturingViewRef = useRef(manufacturingView);
  const previousInventoryViewRef = useRef(inventoryView);

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
  const inventorySwipeDirection = getSwipeDirection(
    previousInventoryViewRef.current,
    inventoryView,
    INVENTORY_VIEW_ORDER,
  );

  useEffect(() => {
    previousTaskViewRef.current = taskView;
  }, [taskView]);

  useEffect(() => {
    previousManufacturingViewRef.current = manufacturingView;
  }, [manufacturingView]);

  useEffect(() => {
    previousInventoryViewRef.current = inventoryView;
  }, [inventoryView]);

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
          <TimelineView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            isAllProjectsView={isAllProjectsView}
            membersById={membersById}
            onDeleteTimelineEvent={handleTimelineEventDelete}
            onSaveTimelineEvent={handleTimelineEventSave}
            openCreateTaskModal={openCreateTaskModalFromTimeline}
            openEditTaskModal={openEditTaskModal}
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
            eventsById={eventsById}
            isAllProjectsView={isAllProjectsView}
            mechanismsById={mechanismsById}
            membersById={membersById}
            openCreateTaskModal={openCreateTaskModal}
            openEditTaskModal={openEditTaskModal}
            partDefinitionsById={partDefinitionsById}
            partInstancesById={partInstancesById}
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
        isActive={activeTab === "worklogs"}
        tabSwitchDirection={tabSwitchDirection}
      >
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.worklogs}
          disableAnimations={disablePanelAnimations}
          isActive
        >
          <WorkLogsView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateWorkLogModal={openCreateWorkLogModal}
            openEditTaskModal={openEditTaskModal}
            subsystemsById={subsystemsById}
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
          isActive={inventoryView === "materials"}
          swipeDirection={inventorySwipeDirection}
        >
          {isNonRobotProject ? (
            <ArtifactInventoryView
              artifacts={artifacts}
              bootstrap={bootstrap}
              kind="document"
              openCreateArtifactModal={openCreateArtifactModal}
              openEditArtifactModal={openEditArtifactModal}
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
          description={
            isNonRobotProject
              ? SUBVIEW_INTERACTION_GUIDANCE.nontechnical
              : SUBVIEW_INTERACTION_GUIDANCE.parts
          }
          isActive={inventoryView === "parts"}
          swipeDirection={inventorySwipeDirection}
        >
          {isNonRobotProject ? (
            <ArtifactInventoryView
              artifacts={artifacts}
              bootstrap={bootstrap}
              kind="nontechnical"
              openCreateArtifactModal={openCreateArtifactModal}
              openEditArtifactModal={openEditArtifactModal}
            />
          ) : (
            <PartsView
              bootstrap={bootstrap}
              openCreatePartDefinitionModal={openCreatePartDefinitionModal}
              openEditPartDefinitionModal={openEditPartDefinitionModal}
              mechanismsById={mechanismsById}
              partDefinitionsById={partDefinitionsById}
              subsystemsById={subsystemsById}
            />
          )}
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          disableAnimations={disablePanelAnimations}
          description={SUBVIEW_INTERACTION_GUIDANCE.purchases}
          isActive={inventoryView === "purchases"}
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
            bootstrap={bootstrap}
            handleCreateMember={handleCreateMember}
            handleDeleteMember={handleDeleteMember}
            handleUpdateMember={handleUpdateMember}
            isAddPersonOpen={isAddPersonOpen}
            isDeletingMember={isDeletingMember}
            isEditPersonOpen={isEditPersonOpen}
            isSavingMember={isSavingMember}
            memberEditDraft={memberEditDraft}
            memberForm={memberForm}
            rosterMentors={rosterMentors}
            selectMember={selectMember}
            selectedMemberId={selectedMemberId}
            setIsAddPersonOpen={setIsAddPersonOpen}
            setIsEditPersonOpen={setIsEditPersonOpen}
            setMemberEditDraft={setMemberEditDraft}
            setMemberForm={setMemberForm}
            students={students}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>
    </div>
  );
}




