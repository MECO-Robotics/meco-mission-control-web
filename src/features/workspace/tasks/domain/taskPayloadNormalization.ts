import type {
  TaskDependencyDraft,
  TaskDependencyPayload,
  TaskPayload,
} from "@/types/payloads/task";
import type { TaskDependencyRecord } from "@/types/recordsExecution";

export function normalizeTaskPayload(taskDraft: TaskPayload): TaskPayload {
  return {
    ...taskDraft,
    title: taskDraft.title.trim(),
    summary: taskDraft.summary.trim(),
    assigneeIds: Array.from(new Set(taskDraft.assigneeIds)),
    taskDependencies: (taskDraft.taskDependencies ?? []).map((dependency) => ({
      ...dependency,
      refId: dependency.refId.trim(),
      ...(dependency.requiredState === undefined ? {} : { requiredState: dependency.requiredState.trim() }),
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
    ...(dependency.requiredState === undefined ? {} : { requiredState: dependency.requiredState.trim() }),
    ...(dependency.requiredCondition ? { requiredCondition: dependency.requiredCondition } : {}),
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
    JSON.stringify(existingDependency.requiredCondition) !== JSON.stringify(payload.requiredCondition) ||
    existingDependency.dependencyType !== payload.dependencyType
  );
}
