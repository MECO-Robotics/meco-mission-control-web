import type { TaskDependencyDraft, TaskDependencyPayload } from "@/types/payloads/task";
import type { TaskDependencyRecord } from "@/types/recordsExecution";
import { buildTaskDependencyPayload, isTaskDependencyPayloadChanged } from "@/features/workspace/tasks/domain/taskPayloadNormalization";

type HandleUnauthorized = (() => void) | undefined;

export interface TaskRelationPersistence {
  createTaskDependencyRecord: (payload: TaskDependencyPayload, onUnauthorized?: HandleUnauthorized) => Promise<TaskDependencyRecord>;
  updateTaskDependencyRecord: (dependencyId: string, payload: Partial<TaskDependencyPayload>, onUnauthorized?: HandleUnauthorized) => Promise<TaskDependencyRecord>;
  deleteTaskDependencyRecord: (dependencyId: string, onUnauthorized?: HandleUnauthorized) => Promise<TaskDependencyRecord>;
}

export async function syncTaskDependencies(
  params: {
    taskId: string;
    canPersist?: () => boolean;
    desiredDependencies: TaskDependencyDraft[] | undefined;
    existingDependencies: TaskDependencyRecord[];
    handleUnauthorized: HandleUnauthorized;
    onPersisted?: (draft: TaskDependencyDraft, record: TaskDependencyRecord) => void;
    onDeleted?: (id: string) => void;
  },
  persistence: TaskRelationPersistence,
) {
  const { taskId, desiredDependencies, existingDependencies, handleUnauthorized } = params;
  const existingById = new Map(existingDependencies.map((dependency) => [dependency.id, dependency] as const));
  const desiredIds = new Set<string>();

  for (const dependency of desiredDependencies ?? []) {
    if (params.canPersist && !params.canPersist()) return false;
    if (!dependency.refId.trim()) continue;
    const payload = buildTaskDependencyPayload(taskId, dependency);
    const existingDependency = dependency.id ? existingById.get(dependency.id) : null;
    if (existingDependency) {
      desiredIds.add(existingDependency.id);
      if (isTaskDependencyPayloadChanged(existingDependency, payload)) {
        params.onPersisted?.(dependency, await persistence.updateTaskDependencyRecord(existingDependency.id, payload, handleUnauthorized));
      }
    } else {
      const created = await persistence.createTaskDependencyRecord(payload, handleUnauthorized);
      desiredIds.add(created.id);
      params.onPersisted?.(dependency, created);
    }
  }

  for (const dependency of existingDependencies) {
    if (params.canPersist && !params.canPersist()) return false;
    if (!desiredIds.has(dependency.id)) {
      await persistence.deleteTaskDependencyRecord(dependency.id, handleUnauthorized);
      params.onDeleted?.(dependency.id);
    }
  }
  return !params.canPersist || params.canPersist();
}
