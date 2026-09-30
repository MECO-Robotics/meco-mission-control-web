import { Briefcase } from "lucide-react";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import React from "react";
import { buildAvailableStudentRoster, getPresentRosterMemberIds } from "./roster/availableStudentsRoster";
import { useRosterInsights } from "./roster/useRosterInsights";
import { formatAvailabilityLabel, formatHours } from "./roster/rosterInsightsViewModel";
import type { TaskRecord } from "@/types/recordsExecution";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { ALL_FILTER_LABEL } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MemberPayload } from "@/types/payloads";
import type { MemberRecord } from "@/types/recordsOrganization";
import { isMemberActiveInSeason } from "@/lib/appUtils/common";
import { getWorkTypesForProject } from "@/lib/taskDisciplines";

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
  const [peopleSort, setPeopleSort] = useRememberedViewState("people.sort", "name");
  const [peopleSortDirection, setPeopleSortDirection] = useRememberedViewState<"asc" | "desc">("people.sortDirection", "asc");
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
      getWorkTypesForProject(bootstrap, projectForDisciplines).map((workType) => workType.id),
    );
    const uniqueDisciplinesByName = new Map<string, BootstrapPayload["workTypes"][number]>();

    for (const discipline of bootstrap.workTypes) {
      if (!allowedDisciplineIds.has(discipline.id)) {
        continue;
      }
      const normalizedName = discipline.name.trim().toLowerCase();
      if (!uniqueDisciplinesByName.has(normalizedName)) {
        uniqueDisciplinesByName.set(normalizedName, discipline);
      }
    }

    return [...uniqueDisciplinesByName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [bootstrap.workTypes, bootstrap.projects, selectedProject]);

  const disciplineOptions = React.useMemo(
    () => sortedDisciplines.map((discipline) => ({ id: discipline.id, name: discipline.name })),
    [sortedDisciplines],
  );
  const disciplineById = React.useMemo(
    () => Object.fromEntries(bootstrap.workTypes.map((discipline) => [discipline.id, discipline.name] as const)),
    [bootstrap.workTypes],
  );
  const normalizedSearch = searchText.trim().toLowerCase();
  const filterMembers = (members: MemberRecord[]) => {
    const scopedMembers = members.filter(member => peopleFilter === "all" || (peopleFilter === "present" ? presentMemberIds.has(member.id) : peopleFilter === "available" ? presenceById.get(member.id)?.state === "available" : insightById.get(member.id)?.availabilityStatus === "overloaded"));
    const searchedMembers = normalizedSearch.length === 0 ? scopedMembers : scopedMembers.filter((member) =>
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
    const disciplineName = (member: MemberRecord) => member.disciplineId ? disciplineById[member.disciplineId] ?? "" : "";
    return [...searchedMembers].sort((a, b) => {
      const priority = peopleSort === "discipline" ? disciplineName(a).localeCompare(disciplineName(b)) : peopleSort === "role" ? a.role.localeCompare(b.role) : a.name.localeCompare(b.name);
      return priority * (peopleSortDirection === "asc" ? 1 : -1);
    });
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
    const load = insightById.get(member.id);
    return <div className="people-member" key={member.id}>
      <RosterMemberRow disciplines={bootstrap.workTypes} member={member} onEditMember={openEditPersonPopup} onSelectMember={openEditPersonPopup} selectedMemberId={selectedMemberId} />
      <div className="people-member-context">
        <div className="people-member-load-summary">
          <div aria-label="Weekly capacity" className="people-member-capacity">
            <small>Capacity</small>
            <span>{load ? formatAvailabilityLabel(load.availabilityStatus) : "Unrated"} · <strong>{formatHours(load?.plannedWeeklyAttendanceHours ?? member.plannedWeeklyAttendanceHours)} planned / week</strong></span>
            <span><strong>{formatHours(load?.remainingOpenHours)}</strong> remaining</span>
          </div>
          <div aria-label="Task breakdown" className="people-member-task-counts">
            <div><span>Active</span><strong>{load?.activeTaskCount ?? 0}</strong></div>
            <div><span>Blocked</span><strong>{load?.blockedTaskCount ?? 0}</strong></div>
            <div><span>Overdue</span><strong>{load?.overdueTaskCount ?? 0}</strong></div>
          </div>
        </div>
        <div className="people-member-activity">
          {load ? <details className="people-workload-details"><summary>Workload and recent activity</summary>
          {load.topTasks.map(task => <button className="ghost-button" key={task.id} type="button" onClick={() => { const record = bootstrap.tasks.find(item => item.id === task.id); if (record) onOpenTask?.(record); }}>{task.title}</button>)}</details> : null}
          {onCreateTaskForMember && member.role !== "external" ? (
            <button
              aria-label={`Assign work to ${member.name.split(" ")[0]}`}
              className="icon-button people-assign-work-button"
              title={`Assign work to ${member.name.split(" ")[0]}`}
              type="button"
              onClick={() => onCreateTaskForMember(member.id)}
            >
              <Briefcase aria-hidden="true" size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>;
  };

  const rosterSections: Array<{
    className?: string;
    title: string;
    members: MemberRecord[];
  }> = [
    {
      className: "roster-section-students",
      members: filteredSortedStudents,
      title: "Students",
    },
    {
      members: filteredSortedMentors,
      title: "Mentors",
    },
    {
      members: filteredSortedExternalMembers,
      title: "External access",
    },
  ];
  const visibleRosterSections = rosterSections.filter((section) => section.members.length > 0);
  const hasRosterMembers = sortedStudents.length + sortedMentors.length + sortedExternalMembers.length > 0;

  return (
    <section className={`panel dense-panel roster-layout ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar roster-directory-toolbar">
          <TopbarResponsiveSearch
            actions={<>
              <WorkspaceSortMenu direction={peopleSortDirection} field={peopleSort} label="people" onDirectionChange={setPeopleSortDirection} onFieldChange={setPeopleSort} options={[{ label: "Name", value: "name" }, { label: "Discipline", value: "discipline" }, { label: "Role", value: "role" }]} />
              <CompactFilterMenu
                activeCount={peopleFilter === "all" ? 0 : 1}
                ariaLabel="People filters"
                buttonLabel="Filter people"
                className="people-search-filter-menu"
                iconOnly
                items={[
                  {
                    label: "People",
                    content: (
                      <select
                        aria-label="Filter people"
                        className="toolbar-filter-select"
                        onChange={(event) => setPeopleFilter(event.target.value)}
                        value={peopleFilter}
                      >
                        <option value="all">{ALL_FILTER_LABEL}</option>
                        <option value="present">Here today</option>
                        <option value="available">Available now</option>
                        <option value="overloaded">Overloaded</option>
                      </select>
                    ),
                  },
                ]}
              />
            </>}
            ariaLabel="Search people"
            compactPlaceholder="Search"
            onChange={setSearchText}
            placeholder="Search people..."
            value={searchText}
          />
        </div>
      </AppTopbarSlotPortal>
      <WorkspaceTopbarAddMenu
        actions={buildTopbarAddMenuActions(
          makeAddMenuAction("Add student", () => openAddPersonPanel("student")),
          makeAddMenuAction("Add mentor", () => openAddPersonPanel("mentor")),
          makeAddMenuAction("Add external member", () => openAddPersonPanel("external")),
        )}
        ariaLabel="Add person"
        title="Add person"
        tutorialTarget="create-person-button"
      />

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>People</h2>
        </div>
      </div>
      <div className="roster-columns">
        {visibleRosterSections.length === 0 ? (
          <p className="empty-state" role="status">
            {hasRosterMembers
              ? "No people match the current search or filters. Try clearing your search or filters."
              : "No people in this roster yet. Add a student, mentor, or external member to get started."}
          </p>
        ) : null}
        {visibleRosterSections.map((section) => (
          <RosterSection
            className={section.className}
            count={section.members.length}
            presentCount={section.members.filter((member) => presentMemberIds.has(member.id)).length}
            key={section.title}
            members={section.members}
            renderMember={renderMember}
            title={section.title}
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
