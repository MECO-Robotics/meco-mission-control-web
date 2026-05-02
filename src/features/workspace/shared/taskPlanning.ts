import type {
  BootstrapPayload,
  TaskBlockerRecord,
  TaskDependencyRecord,
  TaskPlanningState,
  TaskRecord,
} from "@/types";

type LegacyTaskDependencyRecord = {
  id: string;
  upstreamTaskId: string;
  downstreamTaskId: string;
  dependencyType: "blocks" | "soft" | "finish_to_start";
  createdAt: string;
};

type DependencyLike =
  | TaskDependencyRecord
  | LegacyTaskDependencyRecord
  | Partial<TaskDependencyRecord & LegacyTaskDependencyRecord>;

const HARD_DEPENDENCY_TYPES = new Set<TaskDependencyRecord["dependencyType"] | "blocks" | "finish_to_start">([
  "hard",
  "blocks",
  "finish_to_start",
]);

const PART_INSTANCE_STATUS_ORDER: Record<string, number> = {
  planned: 0,
  needed: 1,
  available: 2,
  installed: 3,
  retired: 4,
};

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function normalizeTaskDependencyRecord(dependency: DependencyLike, index: number): TaskDependencyRecord {
  const dependencyRecord = dependency as {
    id?: string;
    kind?: TaskDependencyRecord["kind"];
    taskId?: string;
    downstreamTaskId?: string;
    refId?: string;
    upstreamTaskId?: string;
    requiredState?: string;
    dependencyType?: TaskDependencyRecord["dependencyType"] | "blocks" | "finish_to_start";
    createdAt?: string;
  };
  const kind = dependencyRecord.kind ?? "task";
  const taskId = dependencyRecord.taskId ?? dependencyRecord.downstreamTaskId ?? "";
  const refId = dependencyRecord.refId ?? dependencyRecord.upstreamTaskId ?? "";

  return {
    id: dependencyRecord.id ?? `${taskId || "task"}:dependency:${index + 1}`,
    taskId,
    kind,
    refId,
    requiredState:
      dependencyRecord.requiredState ?? (kind === "part_instance" ? "available" : "complete"),
    dependencyType: dependencyRecord.dependencyType === "soft" ? "soft" : "hard",
    createdAt: dependencyRecord.createdAt ?? new Date().toISOString(),
  };
}

function getTaskDependencyRecords(bootstrap: BootstrapPayload) {
  const explicitDependencies = (bootstrap.taskDependencies ?? []).map((dependency, index) =>
    normalizeTaskDependencyRecord(dependency as DependencyLike, index),
  );

  const fallbackDependencies = bootstrap.tasks.flatMap((task, taskIndex) =>
    uniqueIds(task.dependencyIds ?? []).map<TaskDependencyRecord>((refId, dependencyIndex) => ({
      id: `${task.id}:dependency:${taskIndex + dependencyIndex + 1}`,
      taskId: task.id,
      kind: "task",
      refId,
      requiredState: "complete",
      dependencyType: "hard",
      createdAt: task.startDate ? `${task.startDate}T00:00:00.000Z` : new Date().toISOString(),
    })),
  );

  const dependencyKey = (dependency: TaskDependencyRecord) =>
    `${dependency.taskId}:${dependency.kind}:${dependency.refId}:${dependency.dependencyType}:${dependency.requiredState ?? ""}`;
  const explicitKeys = new Set(explicitDependencies.map(dependencyKey));

  return [
    ...explicitDependencies,
    ...fallbackDependencies.filter((dependency) => !explicitKeys.has(dependencyKey(dependency))),
  ];
}

function getTaskBlockerRecords(bootstrap: BootstrapPayload) {
  const explicitBlockers = bootstrap.taskBlockers ?? [];
  const fallbackBlockers = bootstrap.tasks.flatMap<TaskBlockerRecord>((task) =>
    task.blockers.map((description, index) => ({
      id: `${task.id}:blocker:${index + 1}`,
      blockedTaskId: task.id,
      blockerType: "external",
      blockerId: null,
      description,
      severity: "medium",
      status: "open",
      createdByMemberId: null,
      createdAt: task.startDate ? `${task.startDate}T00:00:00.000Z` : new Date().toISOString(),
      resolvedAt: null,
    })),
  );
  const blockerKey = (blocker: { blockedTaskId: string; description: string; status: string }) =>
    `${blocker.blockedTaskId}:${blocker.description}:${blocker.status}`;
  const explicitKeys = new Set(explicitBlockers.map(blockerKey));

  return [
    ...explicitBlockers,
    ...fallbackBlockers.filter((blocker) => !explicitKeys.has(blockerKey(blocker))),
  ];
}

function getTaskById(bootstrap: BootstrapPayload, taskId: string) {
  return bootstrap.tasks.find((candidate) => candidate.id === taskId) ?? null;
}

function getEventById(bootstrap: BootstrapPayload, eventId: string) {
  return bootstrap.events.find((candidate) => candidate.id === eventId) ?? null;
}

function getPartInstanceById(bootstrap: BootstrapPayload, partInstanceId: string) {
  return bootstrap.partInstances.find((candidate) => candidate.id === partInstanceId) ?? null;
}

function isEventDependencySatisfied(
  bootstrap: BootstrapPayload,
  eventId: string,
  requiredState: string | undefined,
  now: Date,
) {
  const event = getEventById(bootstrap, eventId);
  if (!event) {
    return false;
  }

  const startDate = new Date(event.startDateTime);
  const endDate = event.endDateTime ? new Date(event.endDateTime) : startDate;

  if (requiredState === "started" || requiredState === "available") {
    return !Number.isNaN(startDate.getTime()) && now.getTime() >= startDate.getTime();
  }

  if (Number.isNaN(endDate.getTime())) {
    return false;
  }

  return now.getTime() >= endDate.getTime();
}

function isPartInstanceDependencySatisfied(
  bootstrap: BootstrapPayload,
  partInstanceId: string,
  requiredState: string | undefined,
) {
  const partInstance = getPartInstanceById(bootstrap, partInstanceId);
  if (!partInstance) {
    return false;
  }

  const requiredOrder = PART_INSTANCE_STATUS_ORDER[requiredState ?? "available"];
  const targetOrder = PART_INSTANCE_STATUS_ORDER[partInstance.status];

  if (requiredOrder === undefined || targetOrder === undefined) {
    return partInstance.status === (requiredState ?? "available");
  }

  return targetOrder >= requiredOrder;
}

function isTaskDependencySatisfied(
  dependency: TaskDependencyRecord,
  bootstrap: BootstrapPayload,
  now: Date,
) {
  if (dependency.dependencyType === "soft") {
    return true;
  }

  if (dependency.kind === "task") {
    return getTaskById(bootstrap, dependency.refId)?.status === (dependency.requiredState ?? "complete");
  }

  if (dependency.kind === "part_instance") {
    return isPartInstanceDependencySatisfied(bootstrap, dependency.refId, dependency.requiredState);
  }

  if (dependency.kind === "milestone" || dependency.kind === "event") {
    return isEventDependencySatisfied(bootstrap, dependency.refId, dependency.requiredState, now);
  }

  return false;
}

function getOpenTaskBlockers(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskBlockerRecords(bootstrap).filter(
    (blocker) => blocker.blockedTaskId === taskId && blocker.status === "open",
  );
}

function getRemainingHours(task: TaskRecord) {
  return Math.max(task.estimatedHours - task.actualHours, 0);
}

function getBlockingUpstreamTaskIds(taskId: string, bootstrap: BootstrapPayload) {
  return uniqueIds(
    getTaskDependencyRecords(bootstrap)
      .filter(
        (dependency) =>
          dependency.taskId === taskId &&
          dependency.kind === "task" &&
          HARD_DEPENDENCY_TYPES.has(dependency.dependencyType),
      )
      .map((dependency) => dependency.refId),
  );
}

function getBlockingDownstreamTaskIds(taskId: string, bootstrap: BootstrapPayload) {
  return uniqueIds(
    getTaskDependencyRecords(bootstrap)
      .filter(
        (dependency) =>
          dependency.refId === taskId &&
          dependency.kind === "task" &&
          HARD_DEPENDENCY_TYPES.has(dependency.dependencyType),
      )
      .map((dependency) => dependency.taskId),
  );
}

function getCriticalPathHours(
  taskId: string,
  bootstrap: BootstrapPayload,
  memo: Map<string, number>,
  visiting: Set<string>,
) {
  if (memo.has(taskId)) {
    return memo.get(taskId) ?? 0;
  }

  if (visiting.has(taskId)) {
    return 0;
  }

  visiting.add(taskId);
  const task = getTaskById(bootstrap, taskId);
  if (!task || task.status === "complete") {
    memo.set(taskId, 0);
    visiting.delete(taskId);
    return 0;
  }

  let longestUpstream = 0;
  getBlockingUpstreamTaskIds(taskId, bootstrap).forEach((upstreamTaskId) => {
    const upstreamHours = getCriticalPathHours(upstreamTaskId, bootstrap, memo, visiting);
    if (upstreamHours > longestUpstream) {
      longestUpstream = upstreamHours;
    }
  });

  const total = getRemainingHours(task) + longestUpstream;
  memo.set(taskId, total);
  visiting.delete(taskId);
  return total;
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

  const deadlineDay = task.targetEventId && getEventById(bootstrap, task.targetEventId)
    ? (() => {
        const event = getEventById(bootstrap, task.targetEventId);
        const eventDay = event?.startDateTime.slice(0, 10) ?? task.dueDate;
        return eventDay < task.dueDate ? eventDay : task.dueDate;
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
