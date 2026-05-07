import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPlanningState } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";

import {
  getBlockingDownstreamTaskIds,
  getCriticalPathHours,
  getOpenTaskBlockers,
  getTaskById,
  getTaskDependencyRecords,
  HARD_DEPENDENCY_TYPES,
  isTaskDependencySatisfied,
} from "./taskPlanningInternals";

function getMilestoneById(bootstrap: BootstrapPayload, milestoneId: string) {
  return bootstrap.milestones.find((candidate) => candidate.id === milestoneId) ?? null;
}

export function getTaskWaitingOnDependencyRecords(
  taskId: string,
  bootstrap: BootstrapPayload,
  now: Date = new Date(),
) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) =>
      dependency.taskId === taskId &&
      HARD_DEPENDENCY_TYPES.has(dependency.dependencyType) &&
      !isTaskDependencySatisfied(dependency, bootstrap, now),
  );
}

export function getTaskPlanningState(
  task: TaskRecord,
  bootstrap: BootstrapPayload,
  now: Date = new Date(),
): TaskPlanningState {
  if (task.planningState) {
    return task.planningState;
  }

  if (task.status === "complete") {
    return "ready";
  }

  if (getOpenTaskBlockers(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencyRecords(task.id, bootstrap, now).length > 0) {
    return "waiting-on-dependency";
  }

  const deadlineDay = task.targetMilestoneId && getMilestoneById(bootstrap, task.targetMilestoneId)
    ? (() => {
        const milestone = getMilestoneById(bootstrap, task.targetMilestoneId);
        const milestoneDay = milestone?.startDateTime.slice(0, 10) ?? task.dueDate;
        return milestoneDay < task.dueDate ? milestoneDay : task.dueDate;
      })()
    : task.dueDate;
  const hoursUntilDeadline = (() => {
    const deadline = new Date(`${deadlineDay}T12:00:00Z`);
    const deltaMs = deadline.getTime() - now.getTime();
    return deltaMs <= 0 ? 0 : deltaMs / (1000 * 60 * 60);
  })();

  if (hoursUntilDeadline <= 0) {
    return "overdue";
  }

  const criticalPathHours = getCriticalPathHours(
    task.id,
    bootstrap,
    new Map<string, number>(),
    new Set<string>(),
  );

  if (criticalPathHours > hoursUntilDeadline) {
    return "at-risk";
  }

  return "ready";
}

export function getTaskOpenBlockersForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getOpenTaskBlockers(taskId, bootstrap);
}

export function getTaskDependencyRecordsForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) => dependency.taskId === taskId || dependency.refId === taskId,
  );
}

export function getTaskWaitingOnDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskWaitingOnDependencyRecords(taskId, bootstrap);
}

export function getTaskBlocksDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) =>
      dependency.refId === taskId &&
      dependency.kind === "task" &&
      HARD_DEPENDENCY_TYPES.has(dependency.dependencyType),
  );
}

export function getTaskWaitingOnTasks(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskWaitingOnDependencyRecords(taskId, bootstrap)
    .filter((dependency) => dependency.kind === "task")
    .map((dependency) => dependency.refId)
    .filter((upstreamTaskId) => getTaskById(bootstrap, upstreamTaskId)?.status !== "complete");
}

export function getTaskBlocksTasks(taskId: string, bootstrap: BootstrapPayload) {
  return getBlockingDownstreamTaskIds(taskId, bootstrap);
}

export function isTaskWaitingOnDependencies(
  task: Pick<TaskRecord, "id" | "status">,
  bootstrap: BootstrapPayload,
  now: Date = new Date(),
) {
  return task.status !== "complete" && getTaskWaitingOnDependencyRecords(task.id, bootstrap, now).length > 0;
}

export function formatTaskPlanningState(state: TaskPlanningState) {
  switch (state) {
    case "ready":
      return "Ready";
    case "waiting-on-dependency":
      return "Waiting on dependency";
    case "blocked":
      return "Blocked";
    case "overdue":
      return "Overdue";
    case "at-risk":
      return "At risk";
    default:
      return state;
  }
}

export function groupTasksByPlanningState(tasks: TaskRecord[], bootstrap: BootstrapPayload) {
  const grouped: Record<TaskPlanningState, TaskRecord[]> = {
    ready: [],
    "waiting-on-dependency": [],
    blocked: [],
    overdue: [],
    "at-risk": [],
  };

  tasks.forEach((task) => {
    const planningState = getTaskPlanningState(task, bootstrap);
    grouped[planningState].push(task);
  });

  return grouped;
}
