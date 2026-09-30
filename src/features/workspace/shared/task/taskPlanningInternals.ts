import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";

export const HARD_DEPENDENCY_TYPES = new Set<TaskDependencyRecord["dependencyType"]>(["hard"]);

const READINESS_ORDER = { "not-ready": 0, blocked: 1, qa: 2, ready: 3 } as const;

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getTaskDependencyRecords(bootstrap: BootstrapPayload) {
  return bootstrap.taskDependencies ?? [];
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
) {
  const milestone = getMilestoneById(bootstrap, milestoneId);
  if (!milestone) {
    return false;
  }

  const targetOrder = milestone.readinessStatus ? READINESS_ORDER[milestone.readinessStatus] : undefined;
  const requiredOrder = READINESS_ORDER[(requiredState ?? "ready") as keyof typeof READINESS_ORDER];
  return targetOrder !== undefined && requiredOrder !== undefined && targetOrder >= requiredOrder;
}

function isPartInstanceDependencySatisfied(
  bootstrap: BootstrapPayload,
  partInstanceId: string,
  requiredCondition: TaskDependencyRecord["requiredCondition"],
) {
  const partInstance = getPartInstanceById(bootstrap, partInstanceId);
  if (!partInstance) {
    return false;
  }

  if (!requiredCondition) return false;
  if (requiredCondition.kind === "physical-location") {
    return partInstance.location.kind === requiredCondition.value;
  }
  const targetOrder = partInstance.readinessStatus ? READINESS_ORDER[partInstance.readinessStatus] : undefined;
  const requiredOrder = READINESS_ORDER[requiredCondition.value];
  return targetOrder !== undefined && targetOrder >= requiredOrder;
}

export function isTaskDependencySatisfied(
  dependency: TaskDependencyRecord,
  bootstrap: BootstrapPayload,
) {
  if (dependency.dependencyType === "soft") {
    return true;
  }

  if (dependency.kind === "task") {
    return getTaskById(bootstrap, dependency.refId)?.status === (dependency.requiredState ?? "complete");
  }

  if (dependency.kind === "part-instance") {
    return isPartInstanceDependencySatisfied(bootstrap, dependency.refId, dependency.requiredCondition);
  }

  if (dependency.kind === "milestone") {
    return isMilestoneDependencySatisfied(bootstrap, dependency.refId, dependency.requiredState);
  }

  return false;
}

export function getOpenTaskBlockers(taskId: string, bootstrap: BootstrapPayload) {
  return bootstrap.risks.filter((risk) =>
    risk.blocksWork && risk.status !== "resolved" && risk.relatedTargets.some((target) => target.kind === "task" && target.id === taskId),
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
