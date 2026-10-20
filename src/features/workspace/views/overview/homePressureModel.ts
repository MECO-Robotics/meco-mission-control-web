import type { BootstrapPayload } from "@/types/bootstrap";
import type { AttentionQueueRow } from "../attention/attentionQueue";
import { filterSelectionMatchesTaskPeople, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export type HomePressureBucket = "urgency" | "project" | "subsystem" | "team" | "workstream";
export const HOME_PRESSURE_BUCKETS: readonly { id: HomePressureBucket; label: string }[] = [
  { id: "urgency", label: "Urgency" }, { id: "project", label: "Project" },
  { id: "subsystem", label: "Subsystem" }, { id: "team", label: "Team" },
  { id: "workstream", label: "Workstream" },
];
export interface HomePressureGroup { id: string; label: string; tone: string; items: AttentionQueueRow[] }
export const HOME_ACTION_GROUPS = [
  { id: "blocked", label: "Blocking work", tone: "danger" },
  { id: "overdue", label: "Overdue", tone: "danger" },
  { id: "high-risk", label: "High priority risks", tone: "warning" },
  { id: "waiting-qa", label: "Waiting for QA", tone: "info" },
  { id: "due-soon", label: "Due within 7 days", tone: "warning" },
  { id: "other", label: "Other active risks", tone: "neutral" },
] as const;

export function groupHomeActions(items: AttentionQueueRow[]): HomePressureGroup[] {
  const unique = [...new Map(items.map(item => [item.key, item])).values()];
  return HOME_ACTION_GROUPS.map(group => ({ ...group, items: unique.filter(item =>
    (HOME_ACTION_GROUPS.find(candidate => item.signals.includes(candidate.id))?.id ?? "other") === group.id,
  ) }));
}

export function buildHomePressureGroups(items: AttentionQueueRow[], bucket: HomePressureBucket,
  bootstrap: BootstrapPayload, options: { activePersonFilter?: FilterSelection } = {}): HomePressureGroup[] {
  if (bucket === "urgency") return groupHomeActions(items);
  const projects = new Map(bootstrap.projects.map(project => [project.id, project.name]));
  const tasks = new Map(bootstrap.tasks.map(task => [task.id, task]));
  const risks = new Map(bootstrap.risks.map(risk => [risk.id, risk]));
  const teams = new Map(bootstrap.responsibleGroups.map(team => [team.id, team.name]));
  const areas = new Map(bootstrap.subsystems.map(area => [area.id, area]));
  const mechanisms = new Map(bootstrap.mechanisms.map(mechanism => [mechanism.id, mechanism]));
  const parts = new Map(bootstrap.partInstances.map(part => [part.id, part]));
  const workstreams = new Map(bootstrap.workstreams.map(stream => [stream.id, stream]));
  const groups = new Map<string, HomePressureGroup>();
  const projectLabel = (id: string) => projects.get(id) ?? `Unknown project (${id})`;
  const namedArea = (record: { id: string; name: string; projectId: string }, records: Iterable<{ id: string; name: string; projectId: string }>) =>
    [...records].some(other => other.id !== record.id && other.name === record.name && other.projectId !== record.projectId)
      ? `${record.name} · ${projectLabel(record.projectId)}` : record.name;
  for (const item of items) {
    const add = (id: string, label: string) => {
      const key = `${bucket}:${id}`;
      const group = groups.get(key) ?? { id: key, label, tone: "warning", items: [] };
      if (!group.items.some(row => row.key === item.key)) group.items.push(item);
      groups.set(key, group);
    };
    if (bucket === "project") {
      add(item.projectId ?? "unassigned", item.projectId ? projectLabel(item.projectId) : "No project");
      continue;
    }
    // A risk's mitigation is separate work, never evidence of affected-group membership.
    const linkedTasks = (item.source === "task" ? [item.recordId] : item.affectedTaskIds ?? [])
      .flatMap(id => {
        const task = tasks.get(id);
        return task && (!item.projectId || task.projectId === item.projectId)
          && filterSelectionMatchesTaskPeople(options.activePersonFilter ?? [], task) ? [task] : [];
      });
    if (bucket === "subsystem") {
      const mechanismArea = (id: string) => mechanisms.get(id)?.subsystemId ?? `mechanism:${id}`;
      const riskAreas = item.source === "risk" ? [
        ...linkedTasks.flatMap(task => [
          ...task.subsystemIds, ...task.mechanismIds.map(mechanismArea),
          ...task.partInstanceIds.flatMap(id => {
            const part = parts.get(id);
            if (!part) return [`part-instance:${id}`];
            const installed = part.location.kind === "installed" ? part.location : null;
            const area = part.intendedSubsystemId ?? installed?.subsystemId;
            const mechanism = part.intendedMechanismId ?? installed?.mechanismId;
            return [...(area ? [area] : []), ...(mechanism ? [mechanismArea(mechanism)] : [])];
          }),
        ]),
        ...(risks.get(item.recordId)?.relatedTargets.flatMap(ref => ref.kind === "subsystem"
          ? [ref.id] : ref.kind === "mechanism" ? [mechanismArea(ref.id)] : []) ?? []),
      ] : item.areaIds ?? [];
      const ids = riskAreas.length ? [...new Set(riskAreas)] : [item.source === "risk" && item.projectId ? `unassigned:${item.projectId}` : "unassigned"];
      ids.forEach((id, index) => {
        const area = areas.get(id);
        add(id, area ? namedArea(area, areas.values()) : id.startsWith("unassigned:")
          ? `No subsystem · ${projectLabel(id.slice("unassigned:".length))}` : id === "unassigned"
            ? "No subsystem" : id.startsWith("mechanism:") ? `Unknown mechanism (${id.slice("mechanism:".length)})`
              : id.startsWith("part-instance:") ? `Unknown part instance (${id.slice("part-instance:".length)})`
                : (item.source === "task" ? item.areaLabels?.[index] : undefined) ?? `Unknown subsystem (${id})`);
      });
      continue;
    }
    if (bucket === "team") {
      const directTeam = item.source === "risk" ? risks.get(item.recordId)?.ownerGroupId : null;
      const ids = [...new Set([...linkedTasks.flatMap(task => task.responsibleGroupId ?? []), ...(directTeam ? [directTeam] : [])])];
      if (linkedTasks.some(task => !task.responsibleGroupId) || !ids.length) add("unassigned", "No team");
      ids.forEach(id => add(id, teams.get(id) ?? `Unknown team (${id})`));
    } else {
      const ids = [...new Set(linkedTasks.flatMap(task => task.workstreamIds))];
      if (linkedTasks.some(task => !task.workstreamIds.length) || !ids.length) add("unassigned", "No workstream");
      ids.forEach(id => {
        const stream = workstreams.get(id);
        add(id, stream ? namedArea(stream, workstreams.values()) : `Unknown workstream (${id})`);
      });
    }
  }
  return [...groups.values()].sort((left, right) => right.items.length - left.items.length
    || left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
}
