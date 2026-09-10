import { RosterAttendanceView } from "@/features/workspace/views/roster/RosterAttendanceView";
import { RosterView } from "@/features/workspace/views/RosterView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceRosterSection(props: WorkspaceContentPanelsViewProps) {
  const disablePanelAnimations = props.disablePanelAnimations ?? false;
  const {
    allMembers,
    availabilityBootstrap,
    bootstrap,
    externalMembers,
    handleCreateMember,
    handleDeleteMember,
    handleReactivateMemberForSeason,
    handleUpdateMember,
    isAddPersonOpen,
    isDeletingMember,
    isEditPersonOpen,
    isSavingMember,
    memberEditDraft,
    memberForm,
    openTimelineTaskDetailsModal,
    openCreateTaskModalForMember,
    requestMemberPhotoUpload,
    rosterMentors,
    rosterView,
    selectMember,
    selectedMemberId,
    selectedProject,
    selectedSeasonId,
    setIsAddPersonOpen,
    setIsEditPersonOpen,
    setMemberEditDraft,
    setMemberForm,
    students,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "roster"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive={rosterView !== "attendance"}>
        <RosterView
          availabilityBootstrap={availabilityBootstrap}
          onCreateTaskForMember={openCreateTaskModalForMember}
          onOpenTask={openTimelineTaskDetailsModal}
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

      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive={rosterView === "attendance"}>
        <RosterAttendanceView
          bootstrap={bootstrap}
          selectedProject={selectedProject}
          selectedSeasonId={selectedSeasonId}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
