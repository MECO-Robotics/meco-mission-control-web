import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTimelineTaskStatusSignal } from "../timelineGridBodyUtils";
import { dateDiffInDays, formatIterationVersion } from "@/lib/appUtils/common";
import { getTaskDependencyTargetName } from "@/features/workspace/shared/task/taskTargeting";
import { getTaskOpenBlockersForTask, getTaskWaitingOnDependencies } from "@/features/workspace/shared/task/taskPlanning";
import { isTaskDependencySatisfied } from "@/features/workspace/shared/task/taskPlanningInternals";
import { normalizeTaskTargetIds } from "@/features/workspace/shared/task/normalizeTaskTargetIds";

export type GroupBy = "team" | "subsystem";

export interface ProductTimelineGroup {
  id: string;
  name: string;
  tasks: TaskRecord[];
}

export interface ProductTimelineProject {
  id: string;
  name: string;
  groups: ProductTimelineGroup[];
  taskCount: number;
  completeCount: number;
}

export function buildProductTimelineProjects(bootstrap: BootstrapPayload, tasks: TaskRecord[], days: string[], groupBy: GroupBy): ProductTimelineProject[] {
  const projects = new Map<string, ProductTimelineProject>();
  const uniqueTasks = new Map(tasks.filter((task) => getProductTimelineTaskSpan(task, days)).map((task) => [task.id, task]));
  const sortedTasks = Array.from(uniqueTasks.values()).sort((left, right) => left.startDate.localeCompare(right.startDate) || left.dueDate.localeCompare(right.dueDate) || left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
  for (const task of sortedTasks) {
    const record = bootstrap.projects.find((project) => project.id === task.projectId);
    let project = projects.get(task.projectId);
    if (!project) {
      project = { id: task.projectId, name: record?.name ?? "Unavailable project", groups: [], taskCount: 0, completeCount: 0 };
      projects.set(task.projectId, project);
    }
    project.taskCount += 1;
    project.completeCount += Number(task.status === "complete");
    const isRobot = record?.projectType === "robot";
    const targets = isRobot ? bootstrap.subsystems : bootstrap.workstreams;
    const ids = normalizeTaskTargetIds(isRobot ? task.subsystemIds : task.workstreamIds).filter((id) => targets.some((candidate) => candidate.id === id && candidate.projectId === task.projectId));
    const team = task.responsibleGroupId ? bootstrap.responsibleGroups.find((candidate) => candidate.id === task.responsibleGroupId) : undefined;
    const groups = groupBy === "team"
      ? [{ id: task.responsibleGroupId ? `team:${task.responsibleGroupId}` : "unassigned-team", name: task.responsibleGroupId ? team?.name ?? `Unavailable team (${task.responsibleGroupId})` : "Unassigned team" }]
      : ids.length ? ids.map((id) => ({ id: `target:${id}`, name: targets.find((candidate) => candidate.id === id && candidate.projectId === task.projectId)!.name })) : [{ id: "general", name: "General" }];
    for (const { id, name } of groups) {
      let group = project.groups.find((candidate) => candidate.id === id);
      if (!group) {
        group = { id, name, tasks: [] };
        project.groups.push(group);
      }
      group.tasks.push(task);
    }
  }
  const projectOrder = new Map(bootstrap.projects.map((project, index) => [project.id, index]));
  return Array.from(projects.values()).sort((left, right) => (projectOrder.get(left.id) ?? Infinity) - (projectOrder.get(right.id) ?? Infinity)).map((project) => {
    const isRobot = bootstrap.projects.find((record) => record.id === project.id)?.projectType === "robot";
    const groupOrder = new Map<string, number>(groupBy === "team"
      ? bootstrap.responsibleGroups.map((team, index) => [`team:${team.id}`, index] as const)
      : (isRobot ? bootstrap.subsystems : bootstrap.workstreams).filter((target) => target.projectId === project.id).map((target, index) => [`target:${target.id}`, index] as const));
    const order = (id: string) => id === "unassigned-team" ? Infinity : groupOrder.get(id) ?? Number.MAX_SAFE_INTEGER;
    project.groups.sort((left, right) => order(left.id) - order(right.id));
    return project;
  });
}

export function getProductTimelineTaskSpan(task: TaskRecord, days: string[]) {
  if (!days.length || !task.startDate || !task.dueDate) return null;
  const first = days[0];
  const last = days[days.length - 1];
  if (task.startDate > task.dueDate || task.startDate > last || task.dueDate < first) return null;
  const start = days.findIndex((day) => day >= task.startDate);
  const end = days.findLastIndex((day) => day <= task.dueDate);
  if (start < 0 || end < start) return null;
  return { start, span: end - start + 1, spillsLeft: task.startDate < first, spillsRight: task.dueDate > last };
}

export function getProductTimelineTaskContext(task: TaskRecord, bootstrap: BootstrapPayload, today: string) {
  const blockers = getTaskOpenBlockersForTask(task.id, bootstrap);
  const waiting = getTaskWaitingOnDependencies(task.id, bootstrap);
  const signal = getTimelineTaskStatusSignal(task, bootstrap);
  const state = ({
    "not-started": "Not started", "in-progress": "In progress", "waiting-for-qa": "Waiting for QA",
    complete: "Complete", blocked: "Blocked", "waiting-on-dependency": "Waiting on prerequisite",
  })[signal];
  const overdueDays = task.status !== "complete" && task.dueDate && task.dueDate < today ? dateDiffInDays(task.dueDate, today) : 0;
  const overdueLabel = overdueDays ? `Overdue · ${overdueDays} ${overdueDays === 1 ? "day" : "days"}` : "";
  const isRobot = bootstrap.projects.find((project) => project.id === task.projectId)?.projectType === "robot";
  const targets = isRobot ? bootstrap.subsystems : bootstrap.workstreams;
  const unavailableTargets = normalizeTaskTargetIds(isRobot ? task.subsystemIds : task.workstreamIds).filter((id) => !targets.some((target) => target.id === id && target.projectId === task.projectId));
  return {
    team: task.responsibleGroupId ? bootstrap.responsibleGroups.find((group) => group.id === task.responsibleGroupId)?.name ?? "Unavailable team" : null,
    state, signal, overdueDays, overdueLabel,
    description: [task.title, state, `${task.startDate} – ${task.dueDate}`, overdueLabel].filter(Boolean).join(" · "),
    unavailableTargets,
    hasHandoffs: Boolean(task.isBlocked) || blockers.length > 0 || bootstrap.taskDependencies.some((dependency) => dependency.taskId === task.id || (dependency.kind === "task" && dependency.refId === task.id)),
    blocked: task.status !== "complete" && (Boolean(task.isBlocked) || blockers.length > 0),
    waiting: task.status !== "complete" && waiting.length > 0,
    overdue: task.status !== "complete" && Boolean(task.dueDate) && task.dueDate < today,
  };
}

export function getProductTimelineInspection(task: TaskRecord, bootstrap: BootstrapPayload) {
  const index = <T extends { id: string }>(records: T[]) => Object.fromEntries(records.map((record) => [record.id, record]));
  const lookups = {
    tasksById: index(bootstrap.tasks), milestonesById: index(bootstrap.milestones),
    partInstancesById: index(bootstrap.partInstances), partDefinitionsById: index(bootstrap.partDefinitions), formatIterationVersion,
  };
  const incoming = bootstrap.taskDependencies.filter((dependency) => dependency.taskId === task.id).map((dependency) => ({
    id: dependency.id,
    label: getTaskDependencyTargetName(dependency.kind, dependency.refId, lookups),
    task: dependency.kind === "task" ? lookups.tasksById[dependency.refId] : undefined,
    state: dependency.dependencyType === "soft" ? "Advisory" : isTaskDependencySatisfied(dependency, bootstrap) ? "Satisfied" : "Waiting",
  }));
  const downstream = bootstrap.taskDependencies.filter((dependency) => dependency.kind === "task" && dependency.refId === task.id).map((dependency) => ({
    id: dependency.id,
    label: lookups.tasksById[dependency.taskId]?.title ?? "Unavailable task",
    task: lookups.tasksById[dependency.taskId],
    state: dependency.dependencyType === "soft" ? "Advisory" : "Hard prerequisite",
  }));
  return { incoming, downstream, blockers: getTaskOpenBlockersForTask(task.id, bootstrap) };
}
