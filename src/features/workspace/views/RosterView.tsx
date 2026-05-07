import React from "react";

import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MemberPayload } from "@/types/payloads";
import type { MemberRecord } from "@/types/recordsOrganization";
import { isMemberActiveInSeason } from "@/lib/appUtils/common";
import { getTaskDisciplinesForProject } from "@/lib/taskDisciplines";

import { RosterAddPersonModal } from "./roster/RosterAddPersonModal";
import { RosterEditPersonModal } from "./roster/RosterEditPersonModal";
import { RosterMemberRow } from "./roster/RosterMemberRow";
import { RosterSection } from "./roster/RosterSection";

interface RosterViewProps {
  allMembers: MemberRecord[];
  bootstrap: BootstrapPayload;
  selectedProject: BootstrapPayload["projects"][number] | null;
  selectedMemberId: string | null;
  selectedSeasonId: string | null;
  selectMember: (id: string | null, payload: BootstrapPayload) => void;
  isAddPersonOpen: boolean;
  setIsAddPersonOpen: (open: boolean) => void;
  isEditPersonOpen: boolean;
  setIsEditPersonOpen: (open: boolean) => void;
  memberForm: MemberPayload;
  setMemberForm: React.Dispatch<React.SetStateAction<MemberPayload>>;
  memberEditDraft: MemberPayload | null;
  setMemberEditDraft: React.Dispatch<React.SetStateAction<MemberPayload | null>>;
  handleCreateMember: (e: React.FormEvent<HTMLFormElement>) => void;
  handleReactivateMemberForSeason: (memberId: string) => Promise<void>;
  handleUpdateMember: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteMember: (id: string) => void;
  requestMemberPhotoUpload: (file: File) => Promise<string>;
  isSavingMember: boolean;
  isDeletingMember: boolean;
  students: MemberRecord[];
  rosterMentors: MemberRecord[];
  externalMembers: MemberRecord[];
}

const isLeadStudent = (member: MemberRecord) =>
  member.role === "lead" || (member.role === "student" && member.elevated);

const isAdminMentor = (member: MemberRecord) =>
  member.role === "admin" || (member.role === "mentor" && member.elevated);

const isElevatedRole = (role: MemberPayload["role"]) => role === "lead" || role === "admin";

const getEmailPlaceholder = (role: MemberPayload["role"]) =>
  role === "external" ? "name@example.org" : "name@mecorobotics.org";

export const RosterView: React.FC<RosterViewProps> = ({
  allMembers,
  bootstrap,
  selectedProject,
  selectedMemberId,
  selectedSeasonId,
  selectMember,
  isAddPersonOpen,
  setIsAddPersonOpen,
  isEditPersonOpen,
  setIsEditPersonOpen,
  memberForm,
  setMemberForm,
  memberEditDraft,
  setMemberEditDraft,
  handleCreateMember,
  handleReactivateMemberForSeason,
  handleUpdateMember,
  handleDeleteMember,
  requestMemberPhotoUpload,
  isSavingMember,
  isDeletingMember,
  students,
  rosterMentors,
  externalMembers,
}) => {
  const [reactivateExistingMember, setReactivateExistingMember] = React.useState(false);
  const [reactivateMemberId, setReactivateMemberId] = React.useState("");

  const sortedStudents = [...students].sort((a, b) => {
    const priority = Number(isLeadStudent(b)) - Number(isLeadStudent(a));
    return priority !== 0 ? priority : a.name.localeCompare(b.name);
  });
  const sortedMentors = [...rosterMentors].sort((a, b) => {
    const priority = Number(isAdminMentor(b)) - Number(isAdminMentor(a));
    return priority !== 0 ? priority : a.name.localeCompare(b.name);
  });
  const sortedExternalMembers = [...externalMembers].sort((a, b) => a.name.localeCompare(b.name));

  const sortedDisciplines = React.useMemo(() => {
    const projectForDisciplines = selectedProject ?? bootstrap.projects[0] ?? null;
    const allowedDisciplineIds = new Set(
      getTaskDisciplinesForProject(projectForDisciplines).map((discipline) => discipline.id),
    );
    const uniqueDisciplinesByName = new Map<string, BootstrapPayload["disciplines"][number]>();

    for (const discipline of bootstrap.disciplines) {
      if (!allowedDisciplineIds.has(discipline.id)) {
        continue;
      }
      const normalizedName = discipline.name.trim().toLowerCase();
      if (!uniqueDisciplinesByName.has(normalizedName)) {
        uniqueDisciplinesByName.set(normalizedName, discipline);
      }
    }

    return [...uniqueDisciplinesByName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [bootstrap.disciplines, bootstrap.projects, selectedProject]);

  const disciplineOptions = React.useMemo(
    () => sortedDisciplines.map((discipline) => ({ id: discipline.id, name: discipline.name })),
    [sortedDisciplines],
  );

  const inactiveMembers = React.useMemo(() => {
    if (!selectedSeasonId) {
      return [];
    }

    return allMembers
      .filter((member) => !isMemberActiveInSeason(member, selectedSeasonId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMembers, selectedSeasonId]);

  const openAddPersonPanel = (role: MemberPayload["role"]) => {
    setMemberForm({ name: "", email: "", photoUrl: "", role, elevated: isElevatedRole(role), disciplineId: null });
    setReactivateExistingMember(false);
    setReactivateMemberId("");
    setIsAddPersonOpen(true);
    setIsEditPersonOpen(false);
  };

  const closeAddPersonPopup = () => {
    setReactivateExistingMember(false);
    setReactivateMemberId("");
    setIsAddPersonOpen(false);
  };

  const openEditPersonPopup = (id: string) => {
    selectMember(id, bootstrap);
    setIsEditPersonOpen(true);
    setIsAddPersonOpen(false);
  };

  const handleAddMemberSubmit = (milestone: React.FormEvent<HTMLFormElement>) => {
    if (!reactivateExistingMember) {
      handleCreateMember(milestone);
      return;
    }

    milestone.preventDefault();
    if (!reactivateMemberId) {
      return;
    }
    void handleReactivateMemberForSeason(reactivateMemberId);
  };

  const renderMember = (member: MemberRecord) => (
    <RosterMemberRow
      disciplines={bootstrap.disciplines}
      key={member.id}
      member={member}
      onEditMember={openEditPersonPopup}
      onSelectMember={(id) => selectMember(id, bootstrap)}
      selectedMemberId={selectedMemberId}
    />
  );

  const rosterSections: Array<{
    title: string;
    addTarget: "student" | "mentor" | "external";
    members: MemberRecord[];
    tutorialTarget?: string;
  }> = [
    {
      addTarget: "student",
      members: sortedStudents,
      title: "Students",
      tutorialTarget: "create-student-button",
    },
    {
      addTarget: "mentor",
      members: sortedMentors,
      title: "Mentors",
    },
    {
      addTarget: "external",
      members: sortedExternalMembers,
      title: "External access",
    },
  ];

  return (
    <section className={`panel dense-panel roster-layout ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Roster</h2>
          <p className="section-copy">Manage team members, external access, and roles.</p>
        </div>
      </div>
      <div className="roster-columns">
        {rosterSections.map((section) => (
          <RosterSection
            addTarget={section.addTarget}
            count={section.members.length}
            key={section.title}
            members={section.members}
            onAdd={openAddPersonPanel}
            renderMember={renderMember}
            title={section.title}
            tutorialTarget={section.tutorialTarget}
          />
        ))}
      </div>
      <RosterAddPersonModal
        disciplineOptions={disciplineOptions}
        getEmailPlaceholder={getEmailPlaceholder}
        inactiveMembers={inactiveMembers}
        isElevatedRole={isElevatedRole}
        isOpen={isAddPersonOpen}
        isSavingMember={isSavingMember}
        memberForm={memberForm}
        onClose={closeAddPersonPopup}
        onSubmit={handleAddMemberSubmit}
        reactivateExistingMember={reactivateExistingMember}
        reactivateMemberId={reactivateMemberId}
        requestMemberPhotoUpload={requestMemberPhotoUpload}
        setMemberForm={setMemberForm}
        setReactivateExistingMember={setReactivateExistingMember}
        setReactivateMemberId={setReactivateMemberId}
      />
      <RosterEditPersonModal
        disciplineOptions={disciplineOptions}
        getEmailPlaceholder={getEmailPlaceholder}
        isDeletingMember={isDeletingMember}
        isElevatedRole={isElevatedRole}
        isOpen={isEditPersonOpen}
        isSavingMember={isSavingMember}
        memberEditDraft={memberEditDraft}
        onClose={() => setIsEditPersonOpen(false)}
        onDeleteMember={handleDeleteMember}
        onSubmit={handleUpdateMember}
        requestMemberPhotoUpload={requestMemberPhotoUpload}
        selectedMemberId={selectedMemberId}
        setMemberEditDraft={setMemberEditDraft}
      />
    </section>
  );
};
