import type { TaskBlockerSeverity, TaskBlockerType } from "@/types/common";
import type {
  TaskBlockerDraft,
  TaskBlockerPayload,
  TaskDependencyDraft,
  TaskDependencyPayload,
  TaskPayload,
} from "@/types/payloads";
import type { TaskBlockerRecord, TaskDependencyRecord } from "@/types/recordsExecution";

export function normalizeTaskPayload(taskDraft: TaskPayload): TaskPayload {
  return {
    ...taskDraft,
    title: taskDraft.title.trim(),
    summary: taskDraft.summary.trim(),
    assigneeIds: Array.from(new Set(taskDraft.assigneeIds)),
    taskDependencies: (taskDraft.taskDependencies ?? []).map((dependency) => ({
      ...dependency,
      refId: dependency.refId.trim(),
      requiredState: dependency.requiredState?.trim(),
    })),
    taskBlockers: (taskDraft.taskBlockers ?? []).map((blocker) => ({
      ...blocker,
      description: blocker.description.trim(),
    })),
  };
}

export function buildTaskDependencyPayload(
  taskId: string,
  dependency: TaskDependencyDraft,
): TaskDependencyPayload {
  return {
    taskId,
    kind: dependency.kind,
    refId: dependency.refId.trim(),
    requiredState: dependency.requiredState?.trim(),
    dependencyType: dependency.dependencyType,
  };
}

export function isTaskDependencyPayloadChanged(
  existingDependency: TaskDependencyRecord,
  payload: TaskDependencyPayload,
) {
  return (
    existingDependency.kind !== payload.kind ||
    existingDependency.refId !== payload.refId ||
    existingDependency.requiredState !== payload.requiredState ||
    existingDependency.dependencyType !== payload.dependencyType
  );
}

export function buildTaskBlockerPayload(
  taskId: string,
  blocker: TaskBlockerDraft,
): TaskBlockerPayload {
  return {
    blockedTaskId: taskId,
    blockerType: blocker.blockerType as TaskBlockerType,
    blockerId: blocker.blockerId ?? null,
    description: blocker.description.trim(),
    severity: blocker.severity as TaskBlockerSeverity,
    status: "open",
  };
}

export function isTaskBlockerPayloadChanged(
  existingBlocker: TaskBlockerRecord,
  payload: TaskBlockerPayload,
) {
  return (
    existingBlocker.blockerType !== payload.blockerType ||
    existingBlocker.blockerId !== payload.blockerId ||
    existingBlocker.description !== payload.description ||
    existingBlocker.severity !== payload.severity ||
    existingBlocker.status !== payload.status
  );
}
