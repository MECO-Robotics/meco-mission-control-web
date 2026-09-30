import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPlanningState } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";

import {
  getCriticalPathHours,
  getOpenTaskBlockers,
  getTaskDependencyRecords,
  HARD_DEPENDENCY_TYPES,
  isTaskDependencySatisfied,
} from "./taskPlanningInternals";

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
  if (task.status === "complete") {
    return "ready";
  }

  if (task.isBlocked || getOpenTaskBlockers(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencyRecords(task.id, bootstrap, now).length > 0) {
    return "waiting-on-dependency";
  }

  const hoursUntilDeadline = (() => {
    const deadline = new Date(`${task.dueDate}T12:00:00Z`);
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

export const getTaskOpenBlockersForTask = getOpenTaskBlockers;

export function getTaskDependencyRecordsForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) => dependency.taskId === taskId || dependency.refId === taskId,
  );
}

export const getTaskWaitingOnDependencies = getTaskWaitingOnDependencyRecords;

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
