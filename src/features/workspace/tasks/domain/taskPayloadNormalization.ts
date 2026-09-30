import { normalizeBlockerSourceKind } from "@/lib/auth/bootstrap/task-blockers";
import type { TaskBlockerSeverity } from "@/types/common";
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
    targetRiskId:
      typeof taskDraft.targetRiskId === "string" && taskDraft.targetRiskId.trim().length > 0
        ? taskDraft.targetRiskId.trim()
        : null,
    assigneeIds: Array.from(new Set(taskDraft.assigneeIds)),
    taskDependencies: (taskDraft.taskDependencies ?? []).map((dependency) => ({
      ...dependency,
      refId: dependency.refId.trim(),
      requiredState: dependency.requiredState.trim(),
    })),
    taskBlockers: (taskDraft.taskBlockers ?? []).map((blocker) => {
      const persistedBlocker = { ...blocker };
      delete persistedBlocker.isIntentPlaceholder;
      return {
        ...persistedBlocker,
        description: persistedBlocker.description.trim(),
      };
    }),
  };
}

export function buildTaskDependencyPayload(
  workItemId: string,
  sourceType: "task" | "manufacturing",
  dependency: TaskDependencyDraft,
): TaskDependencyPayload {
  return {
    workItemId,
    sourceType,
    kind: dependency.kind,
    refType: dependency.refType,
    refId: dependency.refId.trim(),
    requiredState: dependency.requiredState.trim(),
    dependencyType: dependency.dependencyType,
  };
}

export function isTaskDependencyPayloadChanged(
  existingDependency: TaskDependencyRecord,
  payload: TaskDependencyPayload,
) {
  return (
    existingDependency.workItemId !== payload.workItemId ||
    existingDependency.sourceType !== payload.sourceType ||
    existingDependency.kind !== payload.kind ||
    existingDependency.refType !== payload.refType ||
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
    blockerType: normalizeBlockerSourceKind(blocker.sourceKind),
    issueType: blocker.blockerType,
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
    existingBlocker.blockerType !== payload.issueType ||
    existingBlocker.blockerId !== payload.blockerId ||
    existingBlocker.description !== payload.description ||
    existingBlocker.severity !== payload.severity ||
    existingBlocker.status !== payload.status
  );
}
