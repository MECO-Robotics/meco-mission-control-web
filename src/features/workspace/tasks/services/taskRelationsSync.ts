import type {
  TaskBlockerDraft,
  TaskBlockerPayload,
  TaskDependencyDraft,
  TaskDependencyPayload,
} from "@/types/payloads";
import type { TaskBlockerRecord, TaskDependencyRecord } from "@/types/recordsExecution";
import {
  buildTaskBlockerPayload,
  buildTaskDependencyPayload,
  isTaskBlockerPayloadChanged,
  isTaskDependencyPayloadChanged,
} from "@/features/workspace/tasks/domain/taskPayloadNormalization";

type HandleUnauthorized = (() => void) | undefined;

export interface TaskRelationPersistence {
  createTaskDependencyRecord: (
    payload: TaskDependencyPayload,
    onUnauthorized?: HandleUnauthorized,
  ) => Promise<TaskDependencyRecord>;
  updateTaskDependencyRecord: (
    dependencyId: string,
    payload: Partial<TaskDependencyPayload>,
    onUnauthorized?: HandleUnauthorized,
  ) => Promise<TaskDependencyRecord>;
  deleteTaskDependencyRecord: (
    dependencyId: string,
    onUnauthorized?: HandleUnauthorized,
  ) => Promise<TaskDependencyRecord>;
  createTaskBlockerRecord: (
    payload: TaskBlockerPayload,
    onUnauthorized?: HandleUnauthorized,
  ) => Promise<TaskBlockerRecord>;
  updateTaskBlockerRecord: (
    blockerId: string,
    payload: Partial<TaskBlockerPayload>,
    onUnauthorized?: HandleUnauthorized,
  ) => Promise<TaskBlockerRecord>;
  deleteTaskBlockerRecord: (
    blockerId: string,
    onUnauthorized?: HandleUnauthorized,
  ) => Promise<TaskBlockerRecord>;
}

export async function syncTaskDependencies(
  params: {
    taskId: string;
    desiredDependencies: TaskDependencyDraft[] | undefined;
    existingDependencies: TaskDependencyRecord[];
    handleUnauthorized: HandleUnauthorized;
  },
  persistence: TaskRelationPersistence,
) {
  const { taskId, desiredDependencies, existingDependencies, handleUnauthorized } = params;
  const existingById = new Map(
    existingDependencies.map((dependency) => [dependency.id, dependency] as const),
  );
  const desiredIds = new Set<string>();

  for (const dependency of desiredDependencies ?? []) {
    const payload = buildTaskDependencyPayload(taskId, dependency);
    const existingDependency = dependency.id ? existingById.get(dependency.id) : null;

    if (existingDependency) {
      desiredIds.add(existingDependency.id);
      if (isTaskDependencyPayloadChanged(existingDependency, payload)) {
        await persistence.updateTaskDependencyRecord(
          existingDependency.id,
          payload,
          handleUnauthorized,
        );
      }
    } else {
      const createdDependency = await persistence.createTaskDependencyRecord(
        payload,
        handleUnauthorized,
      );
      desiredIds.add(createdDependency.id);
    }
  }

  for (const dependency of existingDependencies) {
    if (!desiredIds.has(dependency.id)) {
      await persistence.deleteTaskDependencyRecord(dependency.id, handleUnauthorized);
    }
  }
}

export async function syncTaskBlockers(
  params: {
    taskId: string;
    desiredBlockers: TaskBlockerDraft[] | undefined;
    existingBlockers: TaskBlockerRecord[];
    handleUnauthorized: HandleUnauthorized;
  },
  persistence: TaskRelationPersistence,
) {
  const { taskId, desiredBlockers, existingBlockers, handleUnauthorized } = params;
  const existingById = new Map(existingBlockers.map((blocker) => [blocker.id, blocker] as const));
  const desiredIds = new Set<string>();

  for (const blocker of desiredBlockers ?? []) {
    const payload = buildTaskBlockerPayload(taskId, blocker);
    const existingBlocker = blocker.id ? existingById.get(blocker.id) : null;

    if (existingBlocker) {
      desiredIds.add(existingBlocker.id);
      if (isTaskBlockerPayloadChanged(existingBlocker, payload)) {
        await persistence.updateTaskBlockerRecord(existingBlocker.id, payload, handleUnauthorized);
      }
    } else {
      const createdBlocker = await persistence.createTaskBlockerRecord(
        payload,
        handleUnauthorized,
      );
      desiredIds.add(createdBlocker.id);
    }
  }

  for (const blocker of existingBlockers) {
    if (!desiredIds.has(blocker.id)) {
      await persistence.deleteTaskBlockerRecord(blocker.id, handleUnauthorized);
    }
  }
}
