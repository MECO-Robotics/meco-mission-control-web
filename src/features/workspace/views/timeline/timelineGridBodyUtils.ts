import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import { getTaskWaitingOnDependencies } from "@/features/workspace/shared/task/taskPlanning";

export type TimelineTaskBlockerRecord = NonNullable<BootstrapPayload["taskBlockers"]>[number];
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

function buildActiveBlockerTaskIds(blockers: TimelineTaskBlockerRecord[] = []) {
  return new Set(
    blockers.flatMap((blocker) =>
      blocker.status === "open" && blocker.blockedTaskId ? [blocker.blockedTaskId] : [],
    ),
  );
}

function hasActiveTaskBlocker(
  task: BootstrapPayload["tasks"][number],
  activeBlockerTaskIds: Set<string>,
) {
  return task.blockers.length > 0 || activeBlockerTaskIds.has(task.id);
}

function getTimelineTaskStatusSignalForTask(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
  activeBlockerTaskIds: Set<string>,
): TimelineTaskStatusSignal {
  if (hasActiveTaskBlocker(task, activeBlockerTaskIds)) {
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
  return getTimelineTaskStatusSignalForTask(
    task,
    bootstrap,
    buildActiveBlockerTaskIds(bootstrap.taskBlockers),
  );
}

export function buildTimelineTaskStatusSignalByTaskId(
  bootstrap: BootstrapPayload,
): Record<string, TimelineTaskStatusSignal> {
  const activeBlockerTaskIds = buildActiveBlockerTaskIds(bootstrap.taskBlockers);

  return Object.fromEntries(
    bootstrap.tasks.map((task) => [
      task.id,
      getTimelineTaskStatusSignalForTask(task, bootstrap, activeBlockerTaskIds),
    ]),
  );
}
