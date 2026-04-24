import {
  useEffect,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  useRef,
  type SetStateAction,
} from "react";

import type {
  BootstrapPayload,
  ManufacturingItemRecord,
  MaterialRecord,
  MemberPayload,
  PartDefinitionRecord,
  PurchaseItemRecord,
  TaskRecord,
} from "../../types";
import { CncView } from "./views/CncView";
import { FabricationView } from "./views/FabricationView";
import { MaterialsView } from "./views/MaterialsView";
import { PartsView } from "./views/PartsView";
import { PrintsView } from "./views/PrintsView";
import { PurchasesView } from "./views/PurchasesView";
import { RosterView } from "./views/RosterView";
import { SubsystemsView } from "./views/SubsystemsView";
import { WorkLogsView } from "./views/WorkLogsView";
import { TaskQueueView } from "./views/TaskQueueView";
import { TimelineView } from "./views/TimelineView";
import type {
  InventoryViewTab,
  ManufacturingViewTab,
  TaskViewTab,
  ViewTab,
} from "./shared/workspaceTypes";

type WorkspaceSubviewTab =
  | TaskViewTab
  | ManufacturingViewTab
  | InventoryViewTab
  | "worklogs"
  | "subsystems"
  | "roster";

const SUBVIEW_INTERACTION_GUIDANCE: Record<WorkspaceSubviewTab, string> = {
  timeline:
    "Use the person and date-range filters above to focus the schedule, collapse or expand subsystem rows with the arrows, and hover a task bar to reveal the pencil cue before clicking the task to edit it.",
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
  parts:
    "Search and filter the catalog from the toolbar, hover a part definition to reveal the pencil cue, and click the row to edit it. Use the edit modal to update or delete the part definition. Review matching part instances below for subsystem and mechanism ownership.",
  purchases:
    "Search or filter requests by subsystem, requester, status, vendor, or approval, then hover a row to reveal the pencil cue before clicking the row to review or update it. Use Add to log a new request against a real part from the Parts tab.",
  subsystems:
    "Search and filter subsystem ownership and mechanism coverage, click a subsystem row to expand its mechanisms underneath, hover the pencil on the right to edit the subsystem, and use the add controls to create or update subsystems, mechanisms, and mechanism-owned part instances.",
  roster:
    "Use the plus buttons to add people to each group, click a name to select them, and hover a member to reveal the pencil affordance for editing or deleting them from the popup.",
};

interface WorkspaceContentProps {
  activePersonFilter: string;
  activeTab: ViewTab;
  bootstrap: BootstrapPayload;
  cncItems: ManufacturingItemRecord[];
  dataMessage: string | null;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  fabricationItems: ManufacturingItemRecord[];
  handleCreateMember: (event: FormEvent<HTMLFormElement>) => void;
  handleDeleteMember: (id: string) => void;
  handleUpdateMember: (event: FormEvent<HTMLFormElement>) => void;
  isAddPersonOpen: boolean;
  isDeletingMember: boolean;
  isEditPersonOpen: boolean;
  isLoadingData: boolean;
  isSavingMember: boolean;
  memberEditDraft: MemberPayload | null;
  memberForm: MemberPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  openCreateManufacturingModal: (process: "cnc" | "3d-print" | "fabrication") => void;
  openCreateMaterialModal: () => void;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openCreatePartDefinitionModal: () => void;
  openCreatePurchaseModal: () => void;
  openCreateTaskModal: () => void;
  openCreateWorkLogModal: () => void;
  openEditManufacturingModal: (item: ManufacturingItemRecord) => void;
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
  requirementsById: Record<string, BootstrapPayload["requirements"][number]>;
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
  onDismissDataMessage: () => void;
}

function WorkspaceSectionPanel({
  children,
  isActive,
}: {
  children: ReactNode;
  isActive: boolean;
}) {
  return (
    <div
      className="workspace-tab-panel"
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
  isActive,
}: {
  children: ReactNode;
  description: string;
  isActive: boolean;
}) {
  return (
    <div
      className="workspace-tab-panel"
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
  bootstrap,
  cncItems,
  dataMessage,
  disciplinesById,
  eventsById,
  fabricationItems,
  handleCreateMember,
  handleDeleteMember,
  handleUpdateMember,
  isAddPersonOpen,
  isDeletingMember,
  isEditPersonOpen,
  isLoadingData,
  isSavingMember,
  memberEditDraft,
  memberForm,
  membersById,
  mechanismsById,
  openCreateManufacturingModal,
  openCreateMaterialModal,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  openCreatePartDefinitionModal,
  openCreatePurchaseModal,
  openCreateTaskModal,
  openCreateWorkLogModal,
  openEditManufacturingModal,
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
  requirementsById,
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
  onDismissDataMessage,
}: WorkspaceContentProps) {
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

      <WorkspaceSectionPanel isActive={activeTab === "tasks"}>
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.timeline}
          isActive={taskView === "timeline"}
        >
          <TimelineView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateTaskModal={openCreateTaskModal}
            openEditTaskModal={openEditTaskModal}
            setActivePersonFilter={setActivePersonFilter}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.queue}
          isActive={taskView === "queue"}
        >
          <TaskQueueView
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            disciplinesById={disciplinesById}
            eventsById={eventsById}
            mechanismsById={mechanismsById}
            membersById={membersById}
            openCreateTaskModal={openCreateTaskModal}
            openEditTaskModal={openEditTaskModal}
            partDefinitionsById={partDefinitionsById}
            partInstancesById={partInstancesById}
            requirementsById={requirementsById}
            subsystemsById={subsystemsById}
          />
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel isActive={activeTab === "worklogs"}>
        <WorkspaceSubPanel description={SUBVIEW_INTERACTION_GUIDANCE.worklogs} isActive>
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

      <WorkspaceSectionPanel isActive={activeTab === "manufacturing"}>
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.cnc}
          isActive={manufacturingView === "cnc"}
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
          description={SUBVIEW_INTERACTION_GUIDANCE.prints}
          isActive={manufacturingView === "prints"}
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
          description={SUBVIEW_INTERACTION_GUIDANCE.fabrication}
          isActive={manufacturingView === "fabrication"}
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

      <WorkspaceSectionPanel isActive={activeTab === "inventory"}>
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.materials}
          isActive={inventoryView === "materials"}
        >
          <MaterialsView
            bootstrap={bootstrap}
            openCreateMaterialModal={openCreateMaterialModal}
            openEditMaterialModal={openEditMaterialModal}
          />
        </WorkspaceSubPanel>

        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.parts}
          isActive={inventoryView === "parts"}
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
          description={SUBVIEW_INTERACTION_GUIDANCE.purchases}
          isActive={inventoryView === "purchases"}
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

      <WorkspaceSectionPanel isActive={activeTab === "subsystems"}>
        <WorkspaceSubPanel
          description={SUBVIEW_INTERACTION_GUIDANCE.subsystems}
          isActive
        >
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
        </WorkspaceSubPanel>
      </WorkspaceSectionPanel>

      <WorkspaceSectionPanel isActive={activeTab === "roster"}>
        <WorkspaceSubPanel description={SUBVIEW_INTERACTION_GUIDANCE.roster} isActive>
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
