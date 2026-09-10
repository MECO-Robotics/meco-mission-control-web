import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import React from "react";
import { buildAvailableStudentRoster, getPresentRosterMemberIds } from "./roster/availableStudentsRoster";
import { useRosterInsights } from "./roster/useRosterInsights";
import { formatAvailabilityLabel, formatHours } from "./roster/rosterInsightsViewModel";
import type { TaskRecord } from "@/types/recordsExecution";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
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
  availabilityBootstrap?: BootstrapPayload;
  onCreateTaskForMember?: (memberId: string) => void;
  onOpenTask?: (task: TaskRecord) => void;
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
  availabilityBootstrap,
  onCreateTaskForMember,
  onOpenTask,
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
  const [peopleFilter, setPeopleFilter] = useRememberedViewState("people.peopleFilter", "all");
  const insights = useRosterInsights({ bootstrap, projectId: selectedProject?.id ?? null, seasonId: selectedSeasonId });
  const insightById = new Map(insights.insights.members.map(row => [row.memberId, row]));
  const attendance = buildAvailableStudentRoster(availabilityBootstrap ?? bootstrap);
  const scopedMemberIds = new Set(bootstrap.members.map(member => member.id));
  const presentMemberIds = new Set([...getPresentRosterMemberIds(availabilityBootstrap ?? bootstrap)].filter(id => scopedMemberIds.has(id)));
  const presenceById = new Map([...attendance.available, ...attendance.blockedWaiting, ...attendance.busy].filter(row => scopedMemberIds.has(row.member.id)).map(row => [row.member.id, row]));
  const [searchText, setSearchText] = useRememberedViewState("people.searchText", "");
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
  const disciplineById = React.useMemo(
    () => Object.fromEntries(bootstrap.disciplines.map((discipline) => [discipline.id, discipline.name] as const)),
    [bootstrap.disciplines],
  );
  const normalizedSearch = searchText.trim().toLowerCase();
  const filterMembers = (members: MemberRecord[]) => {
    const scopedMembers = members.filter(member => peopleFilter === "all" || (peopleFilter === "present" ? presentMemberIds.has(member.id) : peopleFilter === "available" ? presenceById.get(member.id)?.state === "available" : insightById.get(member.id)?.availabilityStatus === "overloaded"));
    if (normalizedSearch.length === 0) return scopedMembers;
    return scopedMembers.filter((member) =>
      [
        member.name,
        member.email,
        member.role,
        member.elevated ? "elevated" : "",
        member.disciplineId ? disciplineById[member.disciplineId] ?? "" : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  };
  const filteredSortedStudents = filterMembers(sortedStudents);
  const filteredSortedMentors = filterMembers(sortedMentors);
  const filteredSortedExternalMembers = filterMembers(sortedExternalMembers);

  const inactiveMembers = React.useMemo(() => {
    if (!selectedSeasonId) {
      return [];
    }

    return allMembers
      .filter((member) => !isMemberActiveInSeason(member, selectedSeasonId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMembers, selectedSeasonId]);

  const openAddPersonPanel = (role: MemberPayload["role"]) => {
    setMemberForm({
      name: "",
      email: "",
      photoUrl: "",
      role,
      elevated: isElevatedRole(role),
      disciplineId: null,
      plannedWeeklyAttendanceHours: 0,
      plannedAttendanceDays: [],
      plannedAttendanceNotes: "",
    });
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

  const renderMember = (member: MemberRecord) => {
    const presence = presenceById.get(member.id);
    const load = insightById.get(member.id);
    return <div className="people-member" key={member.id}>
      <RosterMemberRow disciplines={bootstrap.disciplines} member={member} onEditMember={openEditPersonPopup} onSelectMember={openEditPersonPopup} selectedMemberId={selectedMemberId} />
      <div className="people-member-context">
        <small>{presence ? `Here today · ${presence.stateLabel}` : presentMemberIds.has(member.id) ? "Here today" : "No attendance recorded today"}</small>
        {load ? <small>Capacity: {formatAvailabilityLabel(load.availabilityStatus)} · {load.activeTaskCount} active · {load.blockedTaskCount} blocked · {load.overdueTaskCount} overdue · {formatHours(load.remainingOpenHours)} remaining</small> : null}
        {load ? <details className="people-workload-details"><summary>Workload and recent activity</summary><small>{formatHours(load.plannedWeeklyAttendanceHours)} planned/week · {formatHours(load.attendanceHoursLast14Days)} attended in 14 days</small>
        {load?.topTasks.map(task => <button className="ghost-button" key={task.id} type="button" onClick={() => { const record = bootstrap.tasks.find(item => item.id === task.id); if (record) onOpenTask?.(record); }}>{task.title}</button>)}</details> : null}
        {onCreateTaskForMember && member.role !== "external" ? <button className="ghost-button" type="button" onClick={() => onCreateTaskForMember(member.id)}>Assign work to {member.name.split(" ")[0]}</button> : null}
      </div>
    </div>;
  };

  const rosterSections: Array<{
    title: string;
    addTarget: "student" | "mentor" | "external";
    members: MemberRecord[];
    tutorialTarget?: string;
  }> = [
    {
      addTarget: "student",
      members: filteredSortedStudents,
      title: "Students",
      tutorialTarget: "create-student-button",
    },
    {
      addTarget: "mentor",
      members: filteredSortedMentors,
      title: "Mentors",
    },
    {
      addTarget: "external",
      members: filteredSortedExternalMembers,
      title: "External access",
    },
  ];

  return (
    <section className={`panel dense-panel roster-layout ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar roster-directory-toolbar">
          <TopbarResponsiveSearch
            ariaLabel="Search people"
            compactPlaceholder="Search"
            onChange={setSearchText}
            placeholder="Search people..."
            value={searchText}
          />
        </div>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>People</h2>
          <p className="section-copy">Find available teammates, balance assignments, and manage membership.</p>
        </div>
      </div>
      <div className="workspace-presentation-controls">
        <label>People <select aria-label="Filter people" value={peopleFilter} onChange={event => setPeopleFilter(event.target.value)}><option value="all">All people</option><option value="present">Here today</option><option value="available">Available now</option><option value="overloaded">Overloaded</option></select></label>
        <span>{presentMemberIds.size} people here today</span>
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
