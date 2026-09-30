/// <reference types="jest" />

import { type TaskRelationPersistence } from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskDependencyRecord } from "@/types/recordsExecution";

export function createTaskRelationPersistence(): TaskRelationPersistence {
  return {
    createTaskDependencyRecord: jest.fn(
      async (payload, onUnauthorized): Promise<TaskDependencyRecord> => {
        void onUnauthorized;
        return {
        id: "created-dependency",
        createdAt: "2026-05-01T00:00:00.000Z",
        ...payload,
        };
      },
    ),
    updateTaskDependencyRecord: jest.fn(
      async (dependencyId, payload, onUnauthorized): Promise<TaskDependencyRecord> => {
        void onUnauthorized;
        return {
        id: dependencyId,
        createdAt: "2026-05-01T00:00:00.000Z",
        taskId: payload.taskId ?? "task-1",
        kind: payload.kind ?? "task",
        refId: payload.refId ?? "task-upstream",
        requiredState: payload.requiredState ?? "complete",
        dependencyType: payload.dependencyType ?? "hard",
        };
      },
    ),
    deleteTaskDependencyRecord: jest.fn(
      async (dependencyId, onUnauthorized): Promise<TaskDependencyRecord> => {
        void onUnauthorized;
        return {
      id: dependencyId,
      createdAt: "2026-05-01T00:00:00.000Z",
      taskId: "task-1",
      kind: "task",
      refId: "task-upstream",
      requiredState: "complete",
      dependencyType: "hard",
        };
      },
    ),
  };
}
