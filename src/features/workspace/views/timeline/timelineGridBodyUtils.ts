import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import { getTaskWaitingOnDependencies } from "@/features/workspace/shared/task/taskPlanning";

type LegacyTaskDependencyRecord = {
  id: string;
  upstreamTaskId: string;
  downstreamTaskId: string;
  dependencyType: "blocks" | "soft" | "finish_to_start";
  createdAt: string;
  kind?: string;
  refId?: string;
  requiredState?: string;
  taskId?: string;
};

export type TimelineTaskDependencyRecord =
  | NonNullable<BootstrapPayload["taskDependencies"]>[number]
  | LegacyTaskDependencyRecord;

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

function getDependencyTaskId(dependency: TimelineTaskDependencyRecord) {
  const dependencyRecord = dependency as {
    taskId?: string;
    downstreamTaskId?: string;
  };
  return dependencyRecord.taskId ?? dependencyRecord.downstreamTaskId ?? "";
}

function getDependencyRefId(dependency: TimelineTaskDependencyRecord) {
  const dependencyRecord = dependency as {
    refId?: string;
    upstreamTaskId?: string;
  };
  return dependencyRecord.refId ?? dependencyRecord.upstreamTaskId ?? "";
}

function getOrCreateDependencyCounts(
  countsByTaskId: Record<string, TimelineTaskDependencyCounts>,
  taskId: string,
) {
  if (!countsByTaskId[taskId]) {
    countsByTaskId[taskId] = { ...EMPTY_DEPENDENCY_COUNTS };
  }

  return countsByTaskId[taskId];
}

export function getTaskDependencyCounts(
  taskId: string,
  dependencies: TimelineTaskDependencyRecord[] = [],
): TimelineTaskDependencyCounts {
  let incoming = 0;
  let outgoing = 0;

  dependencies.forEach((dependency) => {
    if (getDependencyTaskId(dependency) === taskId) {
      incoming += 1;
    }
    if (getDependencyRefId(dependency) === taskId) {
      outgoing += 1;
    }
  });

  return {
    incoming,
    outgoing,
  };
}

export function buildTaskDependencyCountsByTaskId(
  dependencies: TimelineTaskDependencyRecord[] = [],
) {
  const dependencyCountsByTaskId: Record<string, TimelineTaskDependencyCounts> = {};

  dependencies.forEach((dependency) => {
    getOrCreateDependencyCounts(dependencyCountsByTaskId, getDependencyTaskId(dependency)).incoming += 1;
    getOrCreateDependencyCounts(dependencyCountsByTaskId, getDependencyRefId(dependency)).outgoing += 1;
  });

  return dependencyCountsByTaskId;
}

export function getTaskDependencyCountsFromLookup(
  countsByTaskId: Record<string, TimelineTaskDependencyCounts>,
  taskId: string,
) {
  return countsByTaskId[taskId] ?? EMPTY_DEPENDENCY_COUNTS;
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

export function getTimelineTaskStatusSignal(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  const activeBlockerTaskIds = buildActiveBlockerTaskIds(bootstrap.taskBlockers);

  if (hasActiveTaskBlocker(task, activeBlockerTaskIds)) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencies(task.id, bootstrap).length > 0) {
    return "waiting-on-dependency";
  }

  return task.status;
}

export function buildTimelineTaskStatusSignalByTaskId(
  bootstrap: BootstrapPayload,
): Record<string, TimelineTaskStatusSignal> {
  const activeBlockerTaskIds = buildActiveBlockerTaskIds(bootstrap.taskBlockers);

  return Object.fromEntries(
    bootstrap.tasks.map((task) => {
      const signal = hasActiveTaskBlocker(task, activeBlockerTaskIds)
        ? "blocked"
        : getTaskWaitingOnDependencies(task.id, bootstrap).length > 0
          ? "waiting-on-dependency"
          : task.status;

      return [task.id, signal];
    }),
  );
}
