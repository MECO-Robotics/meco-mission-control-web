import type {
  BootstrapPayload,
  TaskBlockerRecord,
  TaskDependencyRecord,
  TaskPlanningState,
  TaskRecord,
} from "@/types";

const BLOCKING_DEPENDENCY_TYPES = new Set<TaskDependencyRecord["dependencyType"]>([
  "blocks",
  "finish_to_start",
]);

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getTaskDependencyRecords(bootstrap: BootstrapPayload) {
  if ((bootstrap.taskDependencies ?? []).length > 0) {
    return bootstrap.taskDependencies ?? [];
  }

  return bootstrap.tasks.flatMap((task) =>
    (task.dependencyIds ?? []).map<TaskDependencyRecord>((upstreamTaskId, dependencyIndex) => ({
      id: `${task.id}:dependency:${dependencyIndex + 1}`,
      upstreamTaskId,
      downstreamTaskId: task.id,
      dependencyType: "finish_to_start",
      createdAt: new Date().toISOString(),
    })),
  );
}

function getTaskBlockerRecords(bootstrap: BootstrapPayload) {
  if ((bootstrap.taskBlockers ?? []).length > 0) {
    return bootstrap.taskBlockers ?? [];
  }

  return bootstrap.tasks.flatMap((task) =>
    (task.blockers ?? []).map<TaskBlockerRecord>((description, index) => ({
      id: `${task.id}:blocker:${index + 1}`,
      blockedTaskId: task.id,
      blockerType: "external",
      blockerId: null,
      description,
      severity: "medium",
      status: "open",
      createdByMemberId: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    })),
  );
}

function dayPortion(value: string) {
  return value.slice(0, 10);
}

function utcNoon(value: string) {
  return new Date(`${dayPortion(value)}T12:00:00Z`);
}

function hoursUntilDay(day: string, now: Date) {
  const deadline = utcNoon(day);
  const deltaMs = deadline.getTime() - now.getTime();
  return deltaMs <= 0 ? 0 : deltaMs / (1000 * 60 * 60);
}

function getTaskDeadlineDay(task: TaskRecord, bootstrap: BootstrapPayload) {
  const event = task.targetEventId
    ? bootstrap.events.find((candidate) => candidate.id === task.targetEventId)
    : null;

  if (!event) {
    return task.dueDate;
  }

  const eventDay = dayPortion(event.startDateTime);
  return eventDay < task.dueDate ? eventDay : task.dueDate;
}

function getRemainingHours(task: TaskRecord) {
  return Math.max(task.estimatedHours - task.actualHours, 0);
}

function getBlockingUpstreamTaskIds(
  taskId: string,
  bootstrap: BootstrapPayload,
  dependencies: TaskDependencyRecord[] = getTaskDependencyRecords(bootstrap),
) {
  return uniqueIds(
    dependencies
      .filter(
        (dependency) =>
          dependency.downstreamTaskId === taskId &&
          BLOCKING_DEPENDENCY_TYPES.has(dependency.dependencyType),
      )
      .map((dependency) => dependency.upstreamTaskId),
  );
}

function getBlockingDownstreamTaskIds(
  taskId: string,
  bootstrap: BootstrapPayload,
  dependencies: TaskDependencyRecord[] = getTaskDependencyRecords(bootstrap),
) {
  return uniqueIds(
    dependencies
      .filter(
        (dependency) =>
          dependency.upstreamTaskId === taskId &&
          BLOCKING_DEPENDENCY_TYPES.has(dependency.dependencyType),
      )
      .map((dependency) => dependency.downstreamTaskId),
  );
}

function getOpenTaskBlockers(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskBlockerRecords(bootstrap).filter(
    (blocker) => blocker.blockedTaskId === taskId && blocker.status === "open",
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
  const task = bootstrap.tasks.find((candidate) => candidate.id === taskId);
  if (!task || task.status === "complete") {
    memo.set(taskId, 0);
    visiting.delete(taskId);
    return 0;
  }

  const upstreamTaskIds = getBlockingUpstreamTaskIds(taskId, bootstrap);
  let longestUpstream = 0;

  upstreamTaskIds.forEach((upstreamTaskId) => {
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

  const openBlockers = getOpenTaskBlockers(task.id, bootstrap);
  if (openBlockers.length > 0) {
    return "blocked";
  }

  const blockingUpstream = getBlockingUpstreamTaskIds(task.id, bootstrap);
  const incompleteBlockingUpstream = blockingUpstream.filter((upstreamTaskId) => {
    const upstreamTask = bootstrap.tasks.find((candidate) => candidate.id === upstreamTaskId);
    return upstreamTask?.status !== "complete";
  });

  if (incompleteBlockingUpstream.length > 0) {
    return "waiting-on-dependency";
  }

  const deadlineDay = getTaskDeadlineDay(task, bootstrap);
  const hoursUntilDeadline = hoursUntilDay(deadlineDay, now);
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
    (dependency) =>
      dependency.upstreamTaskId === taskId || dependency.downstreamTaskId === taskId,
  );
}

export function getTaskWaitingOnDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) =>
      dependency.downstreamTaskId === taskId && BLOCKING_DEPENDENCY_TYPES.has(dependency.dependencyType),
  );
}

export function getTaskBlocksDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) =>
      dependency.upstreamTaskId === taskId && BLOCKING_DEPENDENCY_TYPES.has(dependency.dependencyType),
  );
}

export function getTaskWaitingOnTasks(taskId: string, bootstrap: BootstrapPayload) {
  return getBlockingUpstreamTaskIds(taskId, bootstrap).filter((upstreamTaskId) => {
    const upstreamTask = bootstrap.tasks.find((candidate) => candidate.id === upstreamTaskId);
    return upstreamTask?.status !== "complete";
  });
}

export function getTaskBlocksTasks(taskId: string, bootstrap: BootstrapPayload) {
  return getBlockingDownstreamTaskIds(taskId, bootstrap);
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
