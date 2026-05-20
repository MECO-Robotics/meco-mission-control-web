import { RosterAttendanceView } from "@/features/workspace/views/roster/RosterAttendanceView";
import { RosterWorkloadView } from "@/features/workspace/views/roster/RosterWorkloadView";
import { RosterView } from "@/features/workspace/views/RosterView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type {
  WorkspaceRosterPanelProps,
  WorkspaceShellPanelProps,
} from "../workspaceContentPanelsViewTypes";

export function WorkspaceRosterSection({
  shell,
  roster,
}: {
  shell: WorkspaceShellPanelProps;
  roster: WorkspaceRosterPanelProps;
}) {
  const disablePanelAnimations = shell.disablePanelAnimations ?? false;
  const {
    allMembers,
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
  } = roster;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={shell.activeTab === "roster"}
      tabSwitchDirection={shell.tabSwitchDirection}
    >
      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive={rosterView === "directory"}>
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

      <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive={rosterView === "workload"}>
        <RosterWorkloadView
          bootstrap={bootstrap}
          onOpenTask={(taskId) => {
            const task = bootstrap.tasks.find((candidate) => candidate.id === taskId);
            if (task) {
              openTimelineTaskDetailsModal(task);
            }
          }}
          selectedProject={selectedProject}
          selectedSeasonId={selectedSeasonId}
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
