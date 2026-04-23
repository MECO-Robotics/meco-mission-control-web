import { type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";

import type {
  BootstrapPayload,
  ManufacturingItemRecord,
  MaterialRecord,
  MemberPayload,
  PartDefinitionRecord,
  PurchaseItemRecord,
  TaskRecord,
} from "../../types";
import { CncView } from "./CncView";
import { MaterialsView } from "./MaterialsView";
import { PartsView } from "./PartsView";
import { PrintsView } from "./PrintsView";
import { PurchasesView } from "./PurchasesView";
import { RosterView } from "./RosterView";
import { TaskQueueView } from "./TaskQueueView";
import { TimelineView } from "./TimelineView";
import type { ViewTab } from "./workspaceTypes";

const TAB_INTERACTION_GUIDANCE: Record<ViewTab, string> = {
  timeline:
    "Use the person and date-range filters above to focus the schedule, collapse or expand subsystem rows with the arrows, and hover a task bar to reveal the pencil cue before clicking the task to edit it.",
  queue:
    "Use search and filters to narrow the list, click a column header to sort, and hover any row to reveal the pencil cue before clicking the row to open its task details. Use Add to create a new task.",
  purchases:
    "Search or filter requests by subsystem, requester, status, vendor, or approval, then hover a row to reveal the pencil cue before clicking the row to review or update it. Use Add to log a new request.",
  cnc:
    "Search and filter CNC jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new CNC request.",
  prints:
    "Search and filter 3D print jobs by subsystem, requester, material, or status, then hover a row to reveal the pencil cue before clicking the row to update that job. Use Add to enter a new print request.",
  materials:
    "Use the search and stock filters to find inventory quickly, then hover a row to reveal the pencil cue before clicking the row to update quantities, vendors, locations, or notes. Use Add to track a new material.",
  parts:
    "Search and filter the catalog from the toolbar, hover a part definition to reveal the pencil cue and delete action, and click the row to edit it. Review matching part instances below for subsystem status.",
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
  handleCreateMember: (event: FormEvent<HTMLFormElement>) => void;
  handleDeleteMember: (id: string) => void;
  handleDeletePartDefinition: (id: string) => void;
  handleUpdateMember: (event: FormEvent<HTMLFormElement>) => void;
  isAddPersonOpen: boolean;
  isDeletingMember: boolean;
  isDeletingPartDefinition: boolean;
  isEditPersonOpen: boolean;
  isLoadingData: boolean;
  isSavingMember: boolean;
  memberEditDraft: MemberPayload | null;
  memberForm: MemberPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  openCreateManufacturingModal: (process: "cnc" | "3d-print" | "fabrication") => void;
  openCreateMaterialModal: () => void;
  openCreatePartDefinitionModal: () => void;
  openCreatePurchaseModal: () => void;
  openCreateTaskModal: () => void;
  openEditManufacturingModal: (item: ManufacturingItemRecord) => void;
  openEditMaterialModal: (item: MaterialRecord) => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  openEditTaskModal: (task: TaskRecord) => void;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  printItems: ManufacturingItemRecord[];
  requirementsById: Record<string, BootstrapPayload["requirements"][number]>;
  rosterMentors: BootstrapPayload["members"];
  selectMember: (id: string | null, payload: BootstrapPayload) => void;
  selectedMemberId: string | null;
  setActivePersonFilter: (value: string) => void;
  setIsAddPersonOpen: (open: boolean) => void;
  setIsEditPersonOpen: (open: boolean) => void;
  setMemberEditDraft: Dispatch<SetStateAction<MemberPayload | null>>;
  setMemberForm: Dispatch<SetStateAction<MemberPayload>>;
  students: BootstrapPayload["members"];
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

function WorkspaceTabPanel({
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
        <span className="tab-interaction-note-label">How to use this tab</span>
        <p>{description}</p>
      </div>
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
  handleCreateMember,
  handleDeleteMember,
  handleDeletePartDefinition,
  handleUpdateMember,
  isAddPersonOpen,
  isDeletingMember,
  isDeletingPartDefinition,
  isEditPersonOpen,
  isLoadingData,
  isSavingMember,
  memberEditDraft,
  memberForm,
  membersById,
  mechanismsById,
  openCreateManufacturingModal,
  openCreateMaterialModal,
  openCreatePartDefinitionModal,
  openCreatePurchaseModal,
  openCreateTaskModal,
  openEditManufacturingModal,
  openEditMaterialModal,
  openEditPartDefinitionModal,
  openEditPurchaseModal,
  openEditTaskModal,
  partDefinitionsById,
  partInstancesById,
  printItems,
  requirementsById,
  rosterMentors,
  selectMember,
  selectedMemberId,
  setActivePersonFilter,
  setIsAddPersonOpen,
  setIsEditPersonOpen,
  setMemberEditDraft,
  setMemberForm,
  students,
  subsystemsById,
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
      {dataMessage ? <p className="banner banner-error">{dataMessage}</p> : null}
      {isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.timeline}
        isActive={activeTab === "timeline"}
      >
        <TimelineView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          membersById={membersById}
          openCreateTaskModal={openCreateTaskModal}
          openEditTaskModal={openEditTaskModal}
          setActivePersonFilter={setActivePersonFilter}
        />
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.queue}
        isActive={activeTab === "queue"}
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
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.purchases}
        isActive={activeTab === "purchases"}
      >
        <PurchasesView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          membersById={membersById}
          openCreatePurchaseModal={openCreatePurchaseModal}
          openEditPurchaseModal={openEditPurchaseModal}
          subsystemsById={subsystemsById}
        />
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.cnc}
        isActive={activeTab === "cnc"}
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
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.prints}
        isActive={activeTab === "prints"}
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
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.roster}
        isActive={activeTab === "roster"}
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
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.materials}
        isActive={activeTab === "materials"}
      >
        <MaterialsView
          bootstrap={bootstrap}
          openCreateMaterialModal={openCreateMaterialModal}
          openEditMaterialModal={openEditMaterialModal}
        />
      </WorkspaceTabPanel>

      <WorkspaceTabPanel
        description={TAB_INTERACTION_GUIDANCE.parts}
        isActive={activeTab === "parts"}
      >
        <PartsView
          bootstrap={bootstrap}
          handleDeletePartDefinition={handleDeletePartDefinition}
          isDeletingPartDefinition={isDeletingPartDefinition}
          openCreatePartDefinitionModal={openCreatePartDefinitionModal}
          openEditPartDefinitionModal={openEditPartDefinitionModal}
          partDefinitionsById={partDefinitionsById}
          subsystemsById={subsystemsById}
        />
      </WorkspaceTabPanel>
    </div>
  );
}
