import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import { getTaskOpenBlockersForTask, getTaskWaitingOnDependencies } from "@/features/workspace/shared/task/taskPlanning";

export type TimelineTaskStatusSignal = TaskStatus | "blocked" | "waiting-on-dependency";

export interface TimelineTaskDependencyCounts {
  incoming: number;
  outgoing: number;
}

const EMPTY_DEPENDENCY_COUNTS: TimelineTaskDependencyCounts = {
  incoming: 0,
  outgoing: 0,
};

function getOrCreateDependencyCounts(
  countsByTaskId: Record<string, TimelineTaskDependencyCounts>,
  taskId: string,
) {
  if (!countsByTaskId[taskId]) {
    countsByTaskId[taskId] = { ...EMPTY_DEPENDENCY_COUNTS };
  }

  return countsByTaskId[taskId];
}

export function buildTaskDependencyCountsByTaskId(
  dependencies: BootstrapPayload["taskDependencies"] = [],
) {
  const dependencyCountsByTaskId: Record<string, TimelineTaskDependencyCounts> = {};

  dependencies.forEach((dependency) => {
    getOrCreateDependencyCounts(dependencyCountsByTaskId, dependency.taskId).incoming += 1;
    if (dependency.kind === "task") {
      getOrCreateDependencyCounts(dependencyCountsByTaskId, dependency.refId).outgoing += 1;
    }
  });

  return dependencyCountsByTaskId;
}

function getTimelineTaskStatusSignalForTask(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  if (getTaskOpenBlockersForTask(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencies(task.id, bootstrap).length > 0) {
    return "waiting-on-dependency";
  }

  return task.status;
}

export function getTimelineTaskStatusSignal(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  return getTimelineTaskStatusSignalForTask(task, bootstrap);
}

export function buildTimelineTaskStatusSignalByTaskId(
  bootstrap: BootstrapPayload,
): Record<string, TimelineTaskStatusSignal> {
  return Object.fromEntries(
    bootstrap.tasks.map((task) => [
      task.id,
      getTimelineTaskStatusSignalForTask(task, bootstrap),
    ]),
  );
}
