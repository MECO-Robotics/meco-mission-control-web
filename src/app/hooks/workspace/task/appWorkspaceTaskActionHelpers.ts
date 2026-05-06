import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { createTaskBlockerRecord, createTaskDependencyRecord, deleteTaskBlockerRecord, deleteTaskDependencyRecord, updateTaskBlockerRecord, updateTaskDependencyRecord } from "@/lib/auth/records/taskRelations";
import type { TaskBlockerDraft, TaskBlockerPayload, TaskDependencyDraft, TaskDependencyPayload, TaskPayload } from "@/types/payloads";
import type { TaskBlockerRecord, TaskDependencyRecord } from "@/types/recordsExecution";
import type { TaskBlockerSeverity, TaskBlockerType } from "@/types/common";

type HandleUnauthorized = AppWorkspaceModel["handleUnauthorized"];

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

export async function syncTaskDependencies(params: {
  taskId: string;
  desiredDependencies: TaskDependencyDraft[] | undefined;
  existingDependencies: TaskDependencyRecord[];
  handleUnauthorized: HandleUnauthorized;
}) {
  const { taskId, desiredDependencies, existingDependencies, handleUnauthorized } = params;
  const existingById = new Map(existingDependencies.map((dependency) => [dependency.id, dependency] as const));
  const desiredIds = new Set<string>();

  for (const dependency of desiredDependencies ?? []) {
    const payload: TaskDependencyPayload = {
      taskId,
      kind: dependency.kind,
      refId: dependency.refId.trim(),
      requiredState: dependency.requiredState?.trim(),
      dependencyType: dependency.dependencyType,
    };
    const existingDependency = dependency.id ? existingById.get(dependency.id) : null;

    if (existingDependency) {
      desiredIds.add(existingDependency.id);
      if (
        existingDependency.kind !== payload.kind ||
        existingDependency.refId !== payload.refId ||
        existingDependency.requiredState !== payload.requiredState ||
        existingDependency.dependencyType !== payload.dependencyType
      ) {
        await updateTaskDependencyRecord(existingDependency.id, payload, handleUnauthorized);
      }
    } else {
      const createdDependency = await createTaskDependencyRecord(payload, handleUnauthorized);
      desiredIds.add(createdDependency.id);
    }
  }

  for (const dependency of existingDependencies) {
    if (!desiredIds.has(dependency.id)) {
      await deleteTaskDependencyRecord(dependency.id, handleUnauthorized);
    }
  }
}

export async function syncTaskBlockers(params: {
  taskId: string;
  desiredBlockers: TaskBlockerDraft[] | undefined;
  existingBlockers: TaskBlockerRecord[];
  handleUnauthorized: HandleUnauthorized;
}) {
  const { taskId, desiredBlockers, existingBlockers, handleUnauthorized } = params;
  const existingById = new Map(existingBlockers.map((blocker) => [blocker.id, blocker] as const));
  const desiredIds = new Set<string>();

  for (const blocker of desiredBlockers ?? []) {
    const payload: TaskBlockerPayload = {
      blockedTaskId: taskId,
      blockerType: blocker.blockerType as TaskBlockerType,
      blockerId: blocker.blockerId ?? null,
      description: blocker.description.trim(),
      severity: blocker.severity as TaskBlockerSeverity,
      status: "open",
    };
    const existingBlocker = blocker.id ? existingById.get(blocker.id) : null;

    if (existingBlocker) {
      desiredIds.add(existingBlocker.id);
      if (
        existingBlocker.blockerType !== payload.blockerType ||
        existingBlocker.blockerId !== payload.blockerId ||
        existingBlocker.description !== payload.description ||
        existingBlocker.severity !== payload.severity ||
        existingBlocker.status !== payload.status
      ) {
        await updateTaskBlockerRecord(existingBlocker.id, payload, handleUnauthorized);
      }
    } else {
      const createdBlocker = await createTaskBlockerRecord(payload, handleUnauthorized);
      desiredIds.add(createdBlocker.id);
    }
  }

  for (const blocker of existingBlockers) {
    if (!desiredIds.has(blocker.id)) {
      await deleteTaskBlockerRecord(blocker.id, handleUnauthorized);
    }
  }
}
