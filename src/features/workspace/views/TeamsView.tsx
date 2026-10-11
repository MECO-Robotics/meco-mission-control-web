import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Ellipsis, Pencil, Trash2 } from "lucide-react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { ResponsibleGroupPayload } from "@/types/payloads";
import { createResponsibleGroup, deleteResponsibleGroup, updateResponsibleGroup } from "@/lib/auth/records/responsibleGroups";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { formatHours } from "./roster/rosterInsightsViewModel";

const emptyDraft = (seasonId: string, projectId: string | null): ResponsibleGroupPayload => ({ seasonId, name: "", projectIds: projectId ? [projectId] : [], memberIds: [], primaryMemberIds: [], isArchived: false });

export function TeamsView({ bootstrap, selectedSeasonId, selectedProjectId, onRefresh, handleUnauthorized, onOpenTask, onOpenMember, onError }: {
  bootstrap: BootstrapPayload;
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
  onRefresh: () => Promise<unknown>;
  handleUnauthorized: () => void;
  onOpenTask: (task: BootstrapPayload["tasks"][number]) => void;
  onOpenMember: (memberId: string) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<ResponsibleGroupPayload | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [taskDrilldown, setTaskDrilldown] = useState<{ groupId: string; filter: "open" | "blocked" | "overdue" } | null>(null);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const projects = bootstrap.projects.filter(project => !selectedSeasonId || project.seasonId === selectedSeasonId);
  const members = bootstrap.members.filter(member => !selectedSeasonId || member.seasonId === selectedSeasonId || member.activeSeasonIds?.includes(selectedSeasonId));
  const groups = bootstrap.responsibleGroups.filter(group => (selectedSeasonId === null || group.seasonId === selectedSeasonId) && (selectedProjectId === null || group.projectIds.length === 0 || group.projectIds.includes(selectedProjectId)));
  const scopedTasks = bootstrap.tasks.filter(task => selectedProjectId === null || task.projectId === selectedProjectId);
  const memberById = useMemo(() => new Map(members.map(member => [member.id, member])), [members]);
  const taskByGroup = useMemo(() => {
    const result = new Map<string, BootstrapPayload["tasks"]>();
    for (const group of groups) result.set(group.id, scopedTasks.filter(task => task.responsibleGroupId === group.id && task.status !== "complete"));
    return result;
  }, [groups, scopedTasks]);
  const visibleGroups = useMemo(() => groups.filter(group => {
    const matchesArchive = archiveFilter === "all" || (archiveFilter === "archived" ? group.isArchived : !group.isArchived);
    const query = search.trim().toLocaleLowerCase();
    if (!matchesArchive || !query) return matchesArchive;
    const groupMembers = group.memberIds.map(id => memberById.get(id)?.name ?? "").join(" ");
    const groupProjects = group.projectIds.map(id => projects.find(project => project.id === id)?.name ?? "").join(" ");
    return `${group.name} ${groupMembers} ${groupProjects}`.toLocaleLowerCase().includes(query);
  }).sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (sortField === "capacity") {
      const capacity = (group: typeof a) => group.isArchived ? 0 : group.memberIds.reduce((sum, id) => {
        const member = memberById.get(id);
        return sum + (member && ((member.role !== "student" && member.role !== "lead") || group.primaryMemberIds.includes(id)) ? member.plannedWeeklyAttendanceHours ?? 0 : 0);
      }, 0);
      return (capacity(a) - capacity(b)) * direction || a.name.localeCompare(b.name);
    }
    if (sortField === "remaining") {
      const remaining = (group: typeof a) => group.isArchived ? 0 : (taskByGroup.get(group.id) ?? []).reduce((sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours), 0);
      return (remaining(a) - remaining(b)) * direction || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name) * direction;
  }), [archiveFilter, groups, memberById, projects, search, sortDirection, sortField, taskByGroup]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...draft, name: draft.name.trim() };
      if (editingId) await updateResponsibleGroup(editingId, payload, handleUnauthorized);
      else await createResponsibleGroup(payload, handleUnauthorized);
      setDraft(null); setEditingId(null); await onRefresh();
    } catch (error) { onError(error instanceof Error ? error.message : "Could not save this team."); }
    finally { setSaving(false); }
  }

  function edit(group: BootstrapPayload["responsibleGroups"][number]) {
    setEditingId(group.id);
    setDraft({ seasonId: group.seasonId, name: group.name, projectIds: [...group.projectIds], memberIds: [...group.memberIds], primaryMemberIds: [...group.primaryMemberIds], isArchived: group.isArchived });
  }

  async function archive(group: BootstrapPayload["responsibleGroups"][number]) {
    try { await updateResponsibleGroup(group.id, { isArchived: !group.isArchived }, handleUnauthorized); await onRefresh(); }
    catch (error) { onError(error instanceof Error ? error.message : "Could not update this team."); }
  }

  async function remove(group: BootstrapPayload["responsibleGroups"][number]) {
    const assignedTaskCount = bootstrap.tasks.filter(task => task.responsibleGroupId === group.id).length;
    const effect = assignedTaskCount ? ` ${assignedTaskCount} assigned ${assignedTaskCount === 1 ? "task will" : "tasks will"} become unassigned.` : "";
    if (!window.confirm(`Remove ${group.name}?${effect}`)) return;
    try { await deleteResponsibleGroup(group.id, handleUnauthorized); await onRefresh(); }
    catch (error) { onError(error instanceof Error ? error.message : "Could not remove this team."); }
  }

  return <section className={`panel dense-panel teams-view ${WORKSPACE_PANEL_CLASS}`}>
    <TopbarResponsiveSearch
      actions={<>
        <CompactFilterMenu activeCount={archiveFilter === "all" ? 0 : 1} ariaLabel="Filter teams" buttonLabel="Filter" iconOnly items={[{ label: "Team status", content: <select aria-label="Filter teams by status" className="toolbar-filter-select" onChange={event => setArchiveFilter(event.target.value)} value={archiveFilter}><option value="all">All teams</option><option value="active">Active</option><option value="archived">Archived</option></select> }]} />
        <WorkspaceSortMenu direction={sortDirection} field={sortField} label="teams" onDirectionChange={setSortDirection} onFieldChange={setSortField} options={[{ label: "Name", value: "name" }, { label: "Planned capacity", value: "capacity" }, { label: "Estimated work remaining", value: "remaining" }]} />
      </>}
      ariaLabel="Search teams"
      compactPlaceholder="Search teams"
      onChange={setSearch}
      placeholder="Search teams, people, projects…"
      value={search}
    />
    <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Create team", onSelect: () => { setEditingId(null); setDraft(emptyDraft(selectedSeasonId ?? "", selectedProjectId)); } })} ariaLabel="Create team" title="Create team" />
    {draft ? <form className="compact-form teams-editor" onSubmit={save}>
      <h3>{editingId ? "Edit team" : "Create team"}</h3>
      <label className="field"><span>Name</span><input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
      <fieldset className="field"><legend>Projects</legend>{projects.map(project => <label className="checkbox-field" key={project.id}><input type="checkbox" checked={draft.projectIds.includes(project.id)} onChange={event => setDraft({ ...draft, projectIds: event.target.checked ? [...draft.projectIds, project.id] : draft.projectIds.filter(id => id !== project.id) })}/><span>{project.name}</span></label>)}</fieldset>
      <fieldset className="field"><legend>Members</legend><p className="team-primary-help">Students can belong to several teams. Mark which selected students list this as their primary team.</p>{members.map(member => {
        const isSelected = draft.memberIds.includes(member.id);
        const canBePrimary = member.role === "student" || member.role === "lead";
        const isPrimary = draft.primaryMemberIds.includes(member.id);
        const existingPrimary = bootstrap.responsibleGroups.find(group => group.seasonId === draft.seasonId && !group.isArchived && group.primaryMemberIds.includes(member.id));
        return <div className="team-member-option" key={member.id}>
          <label className="checkbox-field"><input type="checkbox" checked={isSelected} onChange={event => setDraft({ ...draft, memberIds: event.target.checked ? [...draft.memberIds, member.id] : draft.memberIds.filter(id => id !== member.id), primaryMemberIds: event.target.checked ? draft.primaryMemberIds : draft.primaryMemberIds.filter(id => id !== member.id) })}/><span>{member.name} · {member.role}</span></label>
          {canBePrimary && isSelected ? <button className="secondary-action" type="button" aria-pressed={isPrimary} disabled={isPrimary} onClick={() => setDraft({ ...draft, primaryMemberIds: [...draft.primaryMemberIds, member.id] })}>{isPrimary ? "Primary team" : existingPrimary && existingPrimary.id !== editingId ? `Make primary · currently ${existingPrimary.name}` : "Make primary"}</button> : null}
        </div>;
      })}</fieldset>
      <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setDraft(null)}>Cancel</button><button className="primary-action" disabled={saving}>{saving ? "Saving…" : "Save team"}</button></div>
    </form> : null}
    <div className="teams-list">{visibleGroups.length ? visibleGroups.map(group => {
      const tasks = taskByGroup.get(group.id) ?? [];
      const totalTasks = scopedTasks.filter(task => task.responsibleGroupId === group.id).length;
      const openTasks = group.isArchived ? [] : tasks;
      const today = new Date().toISOString().slice(0, 10);
      const blocked = openTasks.filter(task => task.isBlocked);
      const overdue = openTasks.filter(task => task.dueDate < today);
      const metric = (label: string, count: number, filter: "blocked" | "overdue") => <button type="button" className={`team-task-status-filter is-${filter}`} aria-label={`${label} ${count}`} aria-pressed={taskDrilldown?.groupId === group.id && taskDrilldown.filter === filter} key={filter} onClick={() => setTaskDrilldown({ groupId: group.id, filter })}>
        <span className="team-metric-label">{label}</span>{" "}<strong className={`is-${filter}`}>{count}</strong>
      </button>;
      const drilldownTasks = taskDrilldown?.groupId !== group.id ? tasks : taskDrilldown.filter === "blocked" ? blocked : taskDrilldown.filter === "overdue" ? overdue : openTasks;
      const remaining = openTasks.reduce((sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours), 0);
      const groupMembers = group.memberIds.map(id => memberById.get(id)).filter((member): member is NonNullable<typeof member> => Boolean(member));
      const groupMemberIds = new Set(group.memberIds);
      const contributorIds = new Set(openTasks.flatMap(task => [task.ownerId, ...task.assigneeIds, task.mentorId].filter((id): id is string => Boolean(id))));
      const contributorMembers = bootstrap.members.filter(member => contributorIds.has(member.id) && !groupMemberIds.has(member.id)).sort((a, b) => {
        const order = (role: string) => role === "lead" ? 0 : role === "mentor" ? 2 : 1;
        return order(a.role) - order(b.role) || a.name.localeCompare(b.name);
      });
      const capacity = groupMembers.reduce((sum, member) => {
        const hasPrimaryTeam = member.role === "student" || member.role === "lead";
        return sum + (!hasPrimaryTeam || group.primaryMemberIds.includes(member.id) ? member.plannedWeeklyAttendanceHours ?? 0 : 0);
      }, 0);
      const effectiveCapacity = group.isArchived ? 0 : capacity;
      const capacityCoverage = remaining > 0 ? Math.min(100, effectiveCapacity / remaining * 100) : effectiveCapacity > 0 ? 100 : 0;
      const sortedGroupMembers = [...groupMembers].sort((a, b) => {
        const order = (role: string) => role === "lead" ? 0 : role === "mentor" ? 2 : 1;
        return order(a.role) - order(b.role) || a.name.localeCompare(b.name);
      });
      const isStudent = (member: typeof sortedGroupMembers[number]) => member.role === "student" || member.role === "lead";
      const primaryMembers = sortedGroupMembers.filter(member => !isStudent(member) || group.primaryMemberIds.includes(member.id));
      const secondaryMembers = sortedGroupMembers.filter(member => isStudent(member) && !group.primaryMemberIds.includes(member.id));
      const completedTasks = group.isArchived ? 0 : Math.max(0, totalTasks - tasks.length);
      const blockedIds = new Set(blocked.map(task => task.id));
      const overdueForPie = overdue.filter(task => !blockedIds.has(task.id));
      const openForPie = openTasks.filter(task => !blockedIds.has(task.id) && task.dueDate >= today);
      const taskPieTotal = openForPie.length + blocked.length + overdueForPie.length + completedTasks;
      const taskPieDegrees = (count: number) => taskPieTotal > 0 ? count / taskPieTotal * 360 : 0;
      const taskPieOpenEnd = taskPieDegrees(openForPie.length);
      const taskPieBlockedEnd = taskPieOpenEnd + taskPieDegrees(blocked.length);
      const taskPieOverdueEnd = taskPieBlockedEnd + taskPieDegrees(overdueForPie.length);
      const memberSection = (label: string, sectionMembers: typeof sortedGroupMembers) => {
        const students = sectionMembers.filter(isStudent).length;
        const mentors = sectionMembers.filter(member => member.role === "mentor").length;
        return <details className="team-member-section" key={label} open={label === "Primary"}>
          <summary>{label}<span className="team-member-counts"><span><small>S:</small><strong>{students}</strong></span><span><small>M:</small><strong>{mentors}</strong></span></span></summary>
          <div className="team-member-grid">{sectionMembers.map(member => {
            const assigned = openTasks.filter(task => task.ownerId === member.id || task.assigneeIds.includes(member.id) || task.mentorId === member.id);
            const blockedForMember = assigned.filter(task => task.isBlocked);
            const overdueForMember = assigned.filter(task => task.dueDate < today);
            const hours = assigned.reduce((sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours), 0);
            const primaryGroup = isStudent(member) ? bootstrap.responsibleGroups.find(other => !other.isArchived && other.seasonId === group.seasonId && other.primaryMemberIds.includes(member.id)) : undefined;
            const memberCapacity = group.isArchived || (primaryGroup && primaryGroup.id !== group.id) ? 0 : member.plannedWeeklyAttendanceHours ?? 0;
            const capacityState = hours > memberCapacity ? "is-over-capacity" : hours === memberCapacity ? "is-at-capacity" : "";
            const percent = memberCapacity ? Math.min(100, Math.round(hours / memberCapacity * 100)) : hours > 0 ? 100 : 0;
            return <button className="team-member-load" key={member.id} onClick={() => onOpenMember(member.id)}>
              <span className="team-member-name">{member.name}{member.role === "lead" || member.role === "mentor" ? <small>{member.role === "lead" ? "L" : "M"}</small> : null}</span>
              <span className="team-member-task-metrics" aria-label={`${assigned.length} open, ${blockedForMember.length} blocked, ${overdueForMember.length} overdue`}>
                {assigned.length > 0 ? <span className="is-open"><strong>{assigned.length}</strong> open</span> : null}
                {blockedForMember.length > 0 ? <span className="is-blocked"><strong>{blockedForMember.length}</strong> blocked</span> : null}
                {overdueForMember.length > 0 ? <span className="is-overdue"><strong>{overdueForMember.length}</strong> overdue</span> : null}
              </span>
              <span className={`team-member-capacity ${capacityState}`} aria-label={`${formatHours(hours)} remaining / ${formatHours(memberCapacity)} planned weekly`}>
                {formatHours(hours).replace(/h$/, "")}/{formatHours(memberCapacity).replace(/h$/, "")}hrs
              </span>
              <span className={`team-capacity-track ${capacityState}`}><i style={{ width: `${percent}%` }}/></span>
            </button>;
          })}{!sectionMembers.length ? <p className="empty-state">No {label.toLowerCase()} members.</p> : null}</div>
        </details>;
      };
      return <article className="panel-card team-card" key={group.id}>
        <header className="panel-header team-card-header">
          <div className="team-card-identity">
            <h2>{group.name}{group.isArchived ? " · Archived" : ""}</h2>
            {group.projectIds.length ? <span>{group.projectIds.map(id => projects.find(project => project.id === id)?.name ?? "Unknown project").join(", ")}</span> : null}
          </div>
          <div className="metric-grid">
            <div aria-label={`${formatHours(effectiveCapacity)} planned weekly capacity; one week covers ${Math.round(capacityCoverage)}% of ${formatHours(remaining)} estimated hours remaining`}>
              <span className="team-metric-pie is-capacity" style={{ "--team-metric-progress": `${capacityCoverage}%` } as React.CSSProperties} aria-hidden="true" />
              <span className="team-metric-label">Capacity</span><strong>{formatHours(effectiveCapacity)} / {formatHours(remaining)}</strong>
            </div>
            <div className="team-task-breakdown">
              <span className={`team-task-pie${taskPieTotal === 0 ? " is-empty" : ""}`} role="img" aria-label={`${openForPie.length} open, ${blocked.length} blocked, ${overdueForPie.length} overdue, and ${completedTasks} completed tasks`} style={{ "--team-task-open-end": `${taskPieOpenEnd}deg`, "--team-task-blocked-end": `${taskPieBlockedEnd}deg`, "--team-task-overdue-end": `${taskPieOverdueEnd}deg` } as React.CSSProperties} />
              <span className="team-task-legend">
                <button type="button" className="team-task-open-filter" aria-label={`Open ${openTasks.length}`} aria-pressed={taskDrilldown?.groupId === group.id && taskDrilldown.filter === "open"} onClick={() => setTaskDrilldown({ groupId: group.id, filter: "open" })}>Open <strong>{openTasks.length}</strong></button>
                <span>Done <strong>{completedTasks}</strong></span>
                {metric("Blocked", blocked.length, "blocked")}{metric("Overdue", overdue.length, "overdue")}
              </span>
            </div>
          </div>
          <details className="team-actions-menu" onClick={event => { if ((event.target as HTMLElement).closest("button")) event.currentTarget.open = false; }}>
            <summary aria-label={`Actions for ${group.name}`} title="Team actions"><Ellipsis aria-hidden="true" size={18}/></summary>
            <div className="team-actions-menu-panel" role="menu" aria-label={`${group.name} actions`}>
              <button aria-label={`Edit ${group.name}`} className="icon-button" onClick={() => edit(group)} title="Edit" type="button"><Pencil aria-hidden="true" size={16}/></button>
              <button aria-label={`${group.isArchived ? "Restore" : "Archive"} ${group.name}`} className="icon-button" onClick={() => void archive(group)} title={group.isArchived ? "Restore" : "Archive"} type="button">{group.isArchived ? <ArchiveRestore aria-hidden="true" size={16}/> : <Archive aria-hidden="true" size={16}/>}</button>
              <button aria-label={`Remove ${group.name}`} className="icon-button" onClick={() => void remove(group)} title="Remove" type="button"><Trash2 aria-hidden="true" size={16}/></button>
            </div>
          </details>
        </header>
        <div className="team-load">{memberSection("Primary", primaryMembers)}{memberSection("Secondary", secondaryMembers)}{contributorMembers.length ? memberSection("Assigned contributors", contributorMembers) : null}</div>
        <details open={taskDrilldown?.groupId === group.id}><summary>{taskDrilldown?.groupId === group.id ? `${taskDrilldown.filter[0].toUpperCase()}${taskDrilldown.filter.slice(1)} tasks` : "Tasks"}</summary>{drilldownTasks.length ? drilldownTasks.map(task => <button className="ghost-button" key={task.id} onClick={() => onOpenTask(task)}>{task.title} · {task.status}</button>) : <p>No tasks match this metric.</p>}</details>
      </article>;
    }) : <p className="empty-state">{search || archiveFilter !== "all" ? "No teams match these filters." : "No teams in this season yet."}</p>}</div>
  </section>;
}
