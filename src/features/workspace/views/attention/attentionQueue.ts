import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getTaskPlanningState } from "@/features/workspace/shared/task/taskPlanning";
import { isTaskDueSoon } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { getRiskAffectedTaskIds } from "../riskViewData/riskRecordLinks";
import type { TaskPlanningState } from "@/types/common";
import { isDateOverdue } from "./attentionViewHelpers";

export interface AttentionQueueRow {
  key: string;
  recordId: string;
  source: "risk" | "task";
  action: "open-risk" | "open-task";
  title: string;
  context: string;
  reasons: string[];
  urgency: number;
  ownerMemberId: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  dueDate: string | null;
  signals: string[];
  needsReview: boolean;
  detail?: string;
  projectId?: string;
  areaIds?: string[];
  areaLabels?: string[];
  affectedTaskIds?: string[];
  planningState?: TaskPlanningState;
}

interface AttentionQueueOptions {
  bootstrap: BootstrapPayload;
  activePersonFilter: FilterSelection;
  projectId?: string | null;
  today?: Date;
  includeResolvedRisks?: boolean;
  includeAllUnfinishedTasks?: boolean;
}

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const signalLabels: Record<string, string> = {
  blocked: "Blocks work", overdue: "Overdue", "high-risk": "High priority risk",
  "waiting-qa": "Waiting for QA", "due-soon": "Due within 7 days",
  unassigned: "Unassigned", "no-mitigation": "No mitigation task", resolved: "Resolved",
};

// Derive each record once so every consumer shares scope, signals and priority.
export function buildAttentionQueue({ bootstrap, activePersonFilter, projectId, today = new Date(), includeResolvedRisks = false, includeAllUnfinishedTasks = false }: AttentionQueueOptions): AttentionQueueRow[] {
  const members = new Map(bootstrap.members.map(member => [member.id, member.name]));
  const projects = new Map(bootstrap.projects.map(project => [project.id, project.name]));
  const tasks = bootstrap.tasks.filter(task => (!projectId || task.projectId === projectId) && filterSelectionMatchesTaskPeople(activePersonFilter, task));
  const taskIds = new Set(tasks.map(task => task.id));
  const rows: AttentionQueueRow[] = [];
  const taskById = new Map(bootstrap.tasks.map(task => [task.id, task]));
  const areas = new Map(bootstrap.subsystems.map(area => [area.id, area]));
  const parts = new Map(bootstrap.partInstances.map(part => [part.id, part]));
  const mechanisms = new Map(bootstrap.mechanisms.map(mechanism => [mechanism.id, mechanism]));
  const areaMetadata = (project: string, areaIds: string[]) => {
    const ids = [...new Set(areaIds.filter(id => areas.has(id)))];
    if (!ids.length) ids.push(`unassigned:${project}`);
    return { areaIds: ids, areaLabels: ids.map(id => areas.get(id)?.name ?? "No subsystem") };
  };
  const taskAreas = (taskId: string) => {
    const task = taskById.get(taskId);
    if (!task) return [];
    const partAreas = task.partInstanceIds.flatMap(id => {
      const part = parts.get(id);
      if (!part) return [];
      const installed = part.location.kind === "installed" ? part.location : null;
      const subsystemId = part.intendedSubsystemId ?? installed?.subsystemId;
      const mechanismId = part.intendedMechanismId ?? installed?.mechanismId;
      return [subsystemId, mechanismId ? mechanisms.get(mechanismId)?.subsystemId : null].filter((area): area is string => Boolean(area));
    });
    return [...task.subsystemIds, ...task.mechanismIds.flatMap(id => mechanisms.get(id)?.subsystemId ?? []), ...partAreas];
  };
  const context = (ownerId: string | null, recordProjectId: string) => [ownerId ? members.get(ownerId) ?? "Unassigned" : "Unassigned", projects.get(recordProjectId) ?? "Project"].join(" · ");
  const urgency = (signals: string[], highRisk: boolean) => signals.includes("resolved") ? 0 : signals.includes("blocked") ? 100 : signals.includes("overdue") ? 90 : highRisk ? 80 : signals.includes("waiting-qa") ? 70 : signals.includes("due-soon") ? 60 : 50;
  for (const risk of bootstrap.risks) {
    if ((projectId && risk.projectId !== projectId) || (risk.status === "resolved" && !includeResolvedRisks)) continue;
    if (activePersonFilter.length && !(risk.ownerMemberId && activePersonFilter.includes(risk.ownerMemberId)) && !getRiskAffectedTaskIds(risk, bootstrap).some(id => taskIds.has(id)) && !(risk.mitigationTaskId && taskIds.has(risk.mitigationTaskId))) continue;
    const affectedTaskIds = getRiskAffectedTaskIds(risk, bootstrap);
    const signals: string[] = [];
    const highRisk = risk.severity === "critical" || risk.severity === "high";
    if (risk.status === "resolved") signals.push("resolved");
    else {
      if (risk.blocksWork || risk.status === "blocked") signals.push("blocked");
      if (risk.mitigationDueDate && isDateOverdue(risk.mitigationDueDate, today)) signals.push("overdue");
      if (highRisk) signals.push("high-risk");
      if (risk.mitigationDueDate && isTaskDueSoon(risk.mitigationDueDate, today)) signals.push("due-soon");
      if (!risk.ownerMemberId) signals.push("unassigned");
      if (!risk.mitigationTaskId) signals.push("no-mitigation");
    }
    rows.push({ key: `risk:${risk.id}`, recordId: risk.id, source: "risk", action: "open-risk", title: risk.title, context: context(risk.ownerMemberId, risk.projectId), reasons: signals.map(signal => signalLabels[signal]), urgency: urgency(signals, highRisk), ownerMemberId: risk.ownerMemberId, priority: risk.severity, status: risk.status, dueDate: risk.mitigationDueDate, signals, needsReview: false, detail: risk.detail, projectId: risk.projectId, affectedTaskIds,
      ...areaMetadata(risk.projectId, [...affectedTaskIds, ...(risk.mitigationTaskId ? [risk.mitigationTaskId] : [])].flatMap(taskAreas).concat(risk.relatedTargets.flatMap(ref => ref.kind === "subsystem" ? [ref.id] : ref.kind === "mechanism" ? mechanisms.get(ref.id)?.subsystemId ?? [] : []))) });
  }
  for (const task of tasks) {
    if (task.status === "complete") continue;
    const signals: string[] = [];
    const planning = getTaskPlanningState(task, bootstrap, today);
    if (planning === "blocked" || planning === "waiting-on-dependency") signals.push("blocked");
    if (task.dueDate && isDateOverdue(task.dueDate, today)) signals.push("overdue");
    if (task.status === "waiting-for-qa") signals.push("waiting-qa");
    if (task.dueDate && isTaskDueSoon(task.dueDate, today)) signals.push("due-soon");
    if (!signals.length && !includeAllUnfinishedTasks) continue;
    if (!task.ownerId) signals.push("unassigned");
    rows.push({ key: `task:${task.id}`, recordId: task.id, source: "task", action: "open-task", title: task.title, context: context(task.ownerId, task.projectId), reasons: signals.map(signal => signal === "blocked" ? "Task blocked" : signalLabels[signal]), urgency: urgency(signals, false), ownerMemberId: task.ownerId, priority: task.priority, status: task.status, dueDate: task.dueDate || null, signals, needsReview: task.status === "waiting-for-qa", detail: task.summary, projectId: task.projectId, affectedTaskIds: [task.id], planningState: planning, ...areaMetadata(task.projectId, taskAreas(task.id)) });
  }
  return rows.sort((left, right) => right.urgency - left.urgency || priorityOrder[left.priority] - priorityOrder[right.priority] || (left.dueDate ?? "9999").localeCompare(right.dueDate ?? "9999") || left.title.localeCompare(right.title) || left.key.localeCompare(right.key));
}
