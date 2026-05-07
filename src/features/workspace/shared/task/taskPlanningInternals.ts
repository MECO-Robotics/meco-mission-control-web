import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskBlockerRecord, TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";

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

export const HARD_DEPENDENCY_TYPES = new Set<
  TaskDependencyRecord["dependencyType"] | "blocks" | "finish_to_start"
>(["hard", "blocks", "finish_to_start"]);

const PART_INSTANCE_STATUS_ORDER: Record<string, number> = {
  "not ready": 0,
  blocked: 1,
  qa: 2,
  ready: 3,
};

const MILESTONE_STATUS_ORDER: Record<string, number> = {
  "not ready": 0,
  blocked: 1,
  qa: 2,
  ready: 3,
};

function normalizeTaskDependencyKind(kind: TaskDependencyRecord["kind"] | undefined) {
  return kind ?? "task";
}

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function normalizeTaskDependencyRecord(
  dependency: DependencyLike,
  index: number,
): TaskDependencyRecord {
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
  const kind = normalizeTaskDependencyKind(dependencyRecord.kind);
  const taskId = dependencyRecord.taskId ?? dependencyRecord.downstreamTaskId ?? "";
  const refId = dependencyRecord.refId ?? dependencyRecord.upstreamTaskId ?? "";

  return {
    id: dependencyRecord.id ?? `${taskId || "task"}:dependency:${index + 1}`,
    taskId,
    kind,
    refId,
    requiredState:
      dependencyRecord.requiredState ??
      (kind === "part_instance" || kind === "milestone" ? "ready" : "complete"),
    dependencyType: dependencyRecord.dependencyType === "soft" ? "soft" : "hard",
    createdAt: dependencyRecord.createdAt ?? new Date().toISOString(),
  };
}

export function getTaskDependencyRecords(bootstrap: BootstrapPayload) {
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

export function getTaskBlockerRecords(bootstrap: BootstrapPayload) {
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

export function getTaskById(bootstrap: BootstrapPayload, taskId: string) {
  return bootstrap.tasks.find((candidate) => candidate.id === taskId) ?? null;
}

function getMilestoneById(bootstrap: BootstrapPayload, milestoneId: string) {
  return bootstrap.milestones.find((candidate) => candidate.id === milestoneId) ?? null;
}

function getPartInstanceById(bootstrap: BootstrapPayload, partInstanceId: string) {
  return bootstrap.partInstances.find((candidate) => candidate.id === partInstanceId) ?? null;
}

function isMilestoneDependencySatisfied(
  bootstrap: BootstrapPayload,
  milestoneId: string,
  requiredState: string | undefined,
  now: Date,
) {
  const milestone = getMilestoneById(bootstrap, milestoneId);
  if (!milestone) {
    return false;
  }

  const milestoneStatus = milestone.status ?? null;
  if (milestoneStatus) {
    const targetOrder = MILESTONE_STATUS_ORDER[milestoneStatus];
    const requiredOrder = MILESTONE_STATUS_ORDER[requiredState ?? "ready"];

    if (targetOrder !== undefined && requiredOrder !== undefined) {
      return targetOrder >= requiredOrder;
    }
  }

  const startDate = new Date(milestone.startDateTime);
  const endDate = milestone.endDateTime ? new Date(milestone.endDateTime) : startDate;

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

  const requiredOrder = PART_INSTANCE_STATUS_ORDER[requiredState ?? "ready"];
  const targetOrder = PART_INSTANCE_STATUS_ORDER[partInstance.status];

  if (requiredOrder === undefined || targetOrder === undefined) {
    return partInstance.status === (requiredState ?? "ready");
  }

  return targetOrder >= requiredOrder;
}

export function isTaskDependencySatisfied(
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

  if (dependency.kind === "milestone") {
    return isMilestoneDependencySatisfied(bootstrap, dependency.refId, dependency.requiredState, now);
  }

  return false;
}

export function getOpenTaskBlockers(taskId: string, bootstrap: BootstrapPayload) {
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

export function getBlockingDownstreamTaskIds(taskId: string, bootstrap: BootstrapPayload) {
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

export function getCriticalPathHours(
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
