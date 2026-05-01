import type { BootstrapPayload, TaskStatus } from "@/types";

export type TimelineTaskDependencyRecord = NonNullable<BootstrapPayload["taskDependencies"]>[number];
export type TimelineTaskBlockerRecord = NonNullable<BootstrapPayload["taskBlockers"]>[number];
export type TimelineTaskStatusSignal = TaskStatus | "blocked" | "waiting-on-dependency";

export interface TimelineTaskDependencyCounts {
  incoming: number;
  outgoing: number;
}

const BLOCKING_DEPENDENCY_TYPES = new Set<TimelineTaskDependencyRecord["dependencyType"]>([
  "blocks",
  "finish_to_start",
]);

const EMPTY_DEPENDENCY_COUNTS: TimelineTaskDependencyCounts = {
  incoming: 0,
  outgoing: 0,
};

export function getTaskDependencyCounts(
  taskId: string,
  dependencies: TimelineTaskDependencyRecord[] = [],
): TimelineTaskDependencyCounts {
  let incoming = 0;
  let outgoing = 0;

  dependencies.forEach((dependency) => {
    if (dependency.downstreamTaskId === taskId) {
      incoming += 1;
    }
    if (dependency.upstreamTaskId === taskId) {
      outgoing += 1;
    }
  });

  return { incoming, outgoing };
}

function getOrCreateDependencyCounts(
  dependencyCountsByTaskId: Record<string, TimelineTaskDependencyCounts>,
  taskId: string,
) {
  dependencyCountsByTaskId[taskId] ??= { incoming: 0, outgoing: 0 };
  return dependencyCountsByTaskId[taskId];
}

export function buildTaskDependencyCountsByTaskId(
  dependencies: TimelineTaskDependencyRecord[] = [],
): Record<string, TimelineTaskDependencyCounts> {
  const dependencyCountsByTaskId: Record<string, TimelineTaskDependencyCounts> = {};

  dependencies.forEach((dependency) => {
    getOrCreateDependencyCounts(dependencyCountsByTaskId, dependency.downstreamTaskId).incoming += 1;
    getOrCreateDependencyCounts(dependencyCountsByTaskId, dependency.upstreamTaskId).outgoing += 1;
  });

  return dependencyCountsByTaskId;
}

export function getTaskDependencyCountsFromLookup(
  dependencyCountsByTaskId: Record<string, TimelineTaskDependencyCounts>,
  taskId: string,
) {
  return dependencyCountsByTaskId[taskId] ?? EMPTY_DEPENDENCY_COUNTS;
}

function hasActiveTaskBlocker(
  task: BootstrapPayload["tasks"][number],
  activeBlockerTaskIds: Set<string>,
) {
  return task.blockers.length > 0 || activeBlockerTaskIds.has(task.id);
}

function waitsOnIncompleteDependency(
  task: BootstrapPayload["tasks"][number],
  tasksById: Record<string, BootstrapPayload["tasks"][number]>,
  blockingDependencyUpstreamIdsByTaskId: Record<string, string[]>,
) {
  if (task.status === "complete") {
    return false;
  }

  const waitsOnDependencyRecord = (
    blockingDependencyUpstreamIdsByTaskId[task.id] ?? []
  ).some((upstreamTaskId) => tasksById[upstreamTaskId]?.status !== "complete");

  return (
    waitsOnDependencyRecord ||
    task.dependencyIds.some((dependencyId) => tasksById[dependencyId]?.status !== "complete")
  );
}

function buildActiveBlockerTaskIds(blockers: TimelineTaskBlockerRecord[] = []) {
  return new Set(
    blockers.flatMap((blocker) =>
      blocker.status === "open" ? [blocker.blockedTaskId] : [],
    ),
  );
}

function buildBlockingDependencyUpstreamIdsByTaskId(
  dependencies: TimelineTaskDependencyRecord[] = [],
) {
  const upstreamIdsByTaskId: Record<string, string[]> = {};

  dependencies.forEach((dependency) => {
    if (!BLOCKING_DEPENDENCY_TYPES.has(dependency.dependencyType)) {
      return;
    }

    upstreamIdsByTaskId[dependency.downstreamTaskId] ??= [];
    upstreamIdsByTaskId[dependency.downstreamTaskId].push(dependency.upstreamTaskId);
  });

  return upstreamIdsByTaskId;
}

function buildTimelineTaskStatusLookups(bootstrap: BootstrapPayload) {
  return {
    activeBlockerTaskIds: buildActiveBlockerTaskIds(bootstrap.taskBlockers),
    blockingDependencyUpstreamIdsByTaskId: buildBlockingDependencyUpstreamIdsByTaskId(
      bootstrap.taskDependencies,
    ),
    tasksById: Object.fromEntries(bootstrap.tasks.map((candidate) => [candidate.id, candidate])) as Record<
      string,
      BootstrapPayload["tasks"][number]
    >,
  };
}

export function getTimelineTaskStatusSignal(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  const {
    activeBlockerTaskIds,
    blockingDependencyUpstreamIdsByTaskId,
    tasksById,
  } = buildTimelineTaskStatusLookups(bootstrap);

  if (hasActiveTaskBlocker(task, activeBlockerTaskIds)) {
    return "blocked";
  }

  if (waitsOnIncompleteDependency(task, tasksById, blockingDependencyUpstreamIdsByTaskId)) {
    return "waiting-on-dependency";
  }

  return task.status;
}

export function buildTimelineTaskStatusSignalByTaskId(
  bootstrap: BootstrapPayload,
): Record<string, TimelineTaskStatusSignal> {
  const {
    activeBlockerTaskIds,
    blockingDependencyUpstreamIdsByTaskId,
    tasksById,
  } = buildTimelineTaskStatusLookups(bootstrap);

  return Object.fromEntries(
    bootstrap.tasks.map((task) => {
      const signal = hasActiveTaskBlocker(task, activeBlockerTaskIds)
        ? "blocked"
        : waitsOnIncompleteDependency(task, tasksById, blockingDependencyUpstreamIdsByTaskId)
          ? "waiting-on-dependency"
          : task.status;

      return [task.id, signal];
    }),
  );
}
