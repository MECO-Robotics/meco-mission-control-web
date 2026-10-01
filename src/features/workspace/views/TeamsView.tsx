import { useMemo, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { ResponsibleGroupPayload } from "@/types/payloads";
import { createResponsibleGroup, updateResponsibleGroup } from "@/lib/auth/records/responsibleGroups";
import { formatHours } from "./roster/rosterInsightsViewModel";

const emptyDraft = (seasonId: string): ResponsibleGroupPayload => ({ seasonId, name: "", projectIds: [], memberIds: [], isArchived: false });

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
    setDraft({ seasonId: group.seasonId, name: group.name, projectIds: [...group.projectIds], memberIds: [...group.memberIds], isArchived: group.isArchived });
  }

  async function archive(group: BootstrapPayload["responsibleGroups"][number]) {
    try { await updateResponsibleGroup(group.id, { isArchived: !group.isArchived }, handleUnauthorized); await onRefresh(); }
    catch (error) { onError(error instanceof Error ? error.message : "Could not update this team."); }
  }

  return <section className="panel dense-panel teams-view">
    <header className="panel-header"><div><h2>Teams</h2><p className="section-copy">Manage subteams and review derived task load against their members’ planned weekly capacity.</p></div>
      <button className="primary-action" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft(selectedSeasonId ?? "")); }}>Create team</button></header>
    {draft ? <form className="compact-form teams-editor" onSubmit={save}>
      <h3>{editingId ? "Edit team" : "Create team"}</h3>
      <label className="field"><span>Name</span><input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
      <fieldset className="field"><legend>Projects</legend>{projects.map(project => <label className="checkbox-field" key={project.id}><input type="checkbox" checked={draft.projectIds.includes(project.id)} onChange={event => setDraft({ ...draft, projectIds: event.target.checked ? [...draft.projectIds, project.id] : draft.projectIds.filter(id => id !== project.id) })}/><span>{project.name}</span></label>)}</fieldset>
      <fieldset className="field"><legend>Members</legend>{members.map(member => <label className="checkbox-field" key={member.id}><input type="checkbox" checked={draft.memberIds.includes(member.id)} onChange={event => setDraft({ ...draft, memberIds: event.target.checked ? [...draft.memberIds, member.id] : draft.memberIds.filter(id => id !== member.id) })}/><span>{member.name} · {member.role}</span></label>)}</fieldset>
      <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setDraft(null)}>Cancel</button><button className="primary-action" disabled={saving}>{saving ? "Saving…" : "Save team"}</button></div>
    </form> : null}
    <div className="teams-list">{groups.length ? groups.map(group => {
      const tasks = taskByGroup.get(group.id) ?? [];
      const openTasks = group.isArchived ? [] : tasks;
      const blocked = openTasks.filter(task => task.isBlocked);
      const overdue = openTasks.filter(task => task.dueDate < new Date().toISOString().slice(0, 10));
      const metric = (label: string, count: number, filter: "open" | "blocked" | "overdue") => <button aria-pressed={taskDrilldown?.groupId === group.id && taskDrilldown.filter === filter} key={filter} onClick={() => setTaskDrilldown({ groupId: group.id, filter })}><small>{label}</small><strong>{count}</strong></button>;
      const drilldownTasks = taskDrilldown?.groupId !== group.id ? tasks : taskDrilldown.filter === "blocked" ? blocked : taskDrilldown.filter === "overdue" ? overdue : openTasks;
      const remaining = openTasks.reduce((sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours), 0);
      const groupMembers = group.memberIds.map(id => memberById.get(id)).filter((member): member is NonNullable<typeof member> => Boolean(member));
      const capacity = groupMembers.reduce((sum, member) => sum + (member.plannedWeeklyAttendanceHours ?? 0), 0);
      return <article className="panel-card team-card" key={group.id}>
        <header className="panel-header"><div><h3>{group.name}{group.isArchived ? " · Archived" : ""}</h3><p>{group.projectIds.map(id => projects.find(project => project.id === id)?.name ?? "Unknown project").join(", ") || "All projects"}</p>
        {groupMembers.some(member => member.role === "lead" || member.role === "mentor" || member.role === "admin") ? <p>Leads / mentors: {groupMembers.filter(member => ["lead", "mentor", "admin"].includes(member.role)).map(member => member.name).join(", ")}</p> : null}</div><div><button className="secondary-action" type="button" onClick={() => edit(group)}>Edit</button><button className="secondary-action" type="button" onClick={() => void archive(group)}>{group.isArchived ? "Restore" : "Archive"}</button></div></header>
        <div className="metric-grid"><div><small>Members</small><strong>{groupMembers.length}</strong></div><div><small>Planned weekly capacity</small><strong>{formatHours(group.isArchived ? 0 : capacity)}</strong></div>{metric("Open tasks", openTasks.length, "open")}{metric("Blocked tasks", blocked.length, "blocked")}{metric("Overdue tasks", overdue.length, "overdue")}<div><small>Estimated hours remaining</small><strong>{formatHours(remaining)}</strong></div></div>
        <div className="team-load"><h4>Assigned work by member</h4>{groupMembers.map(member => { const assigned = openTasks.filter(task => task.ownerId === member.id || task.assigneeIds.includes(member.id)); const hours = assigned.reduce((sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours), 0); const memberCapacity = member.plannedWeeklyAttendanceHours ?? 0; const percent = memberCapacity ? Math.min(100, Math.round(hours / memberCapacity * 100)) : 0; return <button className="team-member-load" key={member.id} onClick={() => onOpenMember(member.id)}><span>{member.name}</span><span>{assigned.length} tasks · {formatHours(hours)} / {formatHours(memberCapacity)} weekly</span><span className="team-capacity-track"><i style={{ width: `${percent}%` }}/></span></button>; })}</div>
        <details open={taskDrilldown?.groupId === group.id}><summary>{taskDrilldown?.groupId === group.id ? `${taskDrilldown.filter[0].toUpperCase()}${taskDrilldown.filter.slice(1)} tasks` : "Tasks"}</summary>{drilldownTasks.length ? drilldownTasks.map(task => <button className="ghost-button" key={task.id} onClick={() => onOpenTask(task)}>{task.title} · {task.status}</button>) : <p>No tasks match this metric.</p>}</details>
      </article>;
    }) : <p className="empty-state">No teams in this season yet.</p>}</div>
  </section>;
}
