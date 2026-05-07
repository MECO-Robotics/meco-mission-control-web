import { ArtifactInventoryView } from "@/features/workspace/views/ArtifactInventoryView";
import { MaterialsView } from "@/features/workspace/views/MaterialsView";
import { PartMappingsPlaceholderView } from "@/features/workspace/views/PartMappingsPlaceholderView";
import { PartsView } from "@/features/workspace/views/PartsView";
import { PurchasesView } from "@/features/workspace/views/PurchasesView";
import { WorkflowView } from "@/features/workspace/views/WorkflowView";
import { SubsystemsView } from "@/features/workspace/views/SubsystemsView";
import { RosterView } from "@/features/workspace/views/RosterView";
import { HelpView } from "@/features/workspace/views/HelpView";
import { RosterPlaceholderView } from "@/features/workspace/views/roster/RosterPlaceholderView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "./workspaceContentPanelsViewTypes";

const DOCUMENT_ARTIFACT_KINDS: readonly ["document", "nontechnical"] = ["document", "nontechnical"];

export function WorkspaceInventorySection(props: WorkspaceContentPanelsViewProps) {
  const {
    artifacts,
    bootstrap,
    disablePanelAnimations = false,
    effectiveInventoryView,
    inventorySwipeDirection,
    isNonRobotProject,
    openCreateArtifactModal,
    openCreateMaterialModal,
    openEditArtifactModal,
    openEditMaterialModal,
    openCreatePartDefinitionModal,
    openEditPartDefinitionModal,
    openCreatePurchaseModal,
    openEditPurchaseModal,
    partDefinitionsById,
    mechanismsById,
    membersById,
    tabSwitchDirection,
    subsystemsById,
    activePersonFilter,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "inventory"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
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
        isActive={!isNonRobotProject && effectiveInventoryView === "part-mappings"}
        swipeDirection={inventorySwipeDirection}
      >
        <PartMappingsPlaceholderView />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
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
  );
}

export function WorkspaceSubsystemsSection(props: WorkspaceContentPanelsViewProps) {
  const { artifacts, bootstrap, disablePanelAnimations = false, membersById, openCreateMechanismModal, openCreatePartInstanceModal, openCreateSubsystemModal, openEditMechanismModal, openEditPartInstanceModal, openEditSubsystemModal, tabSwitchDirection } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "subsystems"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive
      >
        {props.isNonRobotProject ? (
          <WorkflowView
            artifacts={artifacts}
            bootstrap={bootstrap}
            membersById={membersById}
            openCreateWorkstreamModal={props.openCreateWorkstreamModal}
            openEditWorkstreamModal={props.openEditWorkstreamModal}
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
  );
}

export function WorkspaceRosterSection(props: WorkspaceContentPanelsViewProps) {
  const { allMembers, bootstrap, disablePanelAnimations = false, externalMembers, handleCreateMember, handleDeleteMember, handleReactivateMemberForSeason, handleUpdateMember, isAddPersonOpen, isDeletingMember, isEditPersonOpen, isSavingMember, memberEditDraft, memberForm, requestMemberPhotoUpload, rosterMentors, rosterView, selectMember, selectedMemberId, selectedProject, selectedSeasonId, setIsAddPersonOpen, setIsEditPersonOpen, setMemberEditDraft, setMemberForm, students, tabSwitchDirection } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "roster"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={rosterView === "directory"}
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

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={rosterView === "workload"}
      >
        <RosterPlaceholderView view="workload" />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={rosterView === "attendance"}
      >
        <RosterPlaceholderView view="attendance" />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}

export function WorkspaceHelpSection(props: WorkspaceContentPanelsViewProps) {
  const { disablePanelAnimations = false, interactiveTutorialChapters, isInteractiveTutorialActive = false, onStartInteractiveTutorial, onStartInteractiveTutorialChapter, tabSwitchDirection } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "help"}
      tabSwitchDirection={tabSwitchDirection}
    >
      <WorkspaceSubPanel
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
  );
}
