/// <reference types="jest" />

import { type TaskRelationPersistence } from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskBlockerRecord, TaskDependencyRecord } from "@/types/recordsExecution";

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
        workItemId: payload.workItemId ?? "task-1",
        sourceType: payload.sourceType ?? "task",
        kind: payload.kind ?? "work_item",
        refType: payload.refType ?? "task",
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
      workItemId: "task-1",
      sourceType: "task",
      kind: "work_item",
        refType: "task",
      refId: "task-upstream",
      requiredState: "complete",
      dependencyType: "hard",
        };
      },
    ),
    createTaskBlockerRecord: jest.fn(
      async (payload, onUnauthorized): Promise<TaskBlockerRecord> => {
        void onUnauthorized;
        return {
      id: "created-blocker",
      createdByMemberId: null,
      createdAt: "2026-05-01T00:00:00.000Z",
      resolvedAt: null,
      ...payload,
      blockerType: payload.issueType,
        };
      },
    ),
    updateTaskBlockerRecord: jest.fn(
      async (blockerId, payload, onUnauthorized): Promise<TaskBlockerRecord> => {
        void onUnauthorized;
        return {
      id: blockerId,
      blockedTaskId: payload.blockedTaskId ?? "task-1",
      blockerType: payload.issueType ?? "other",
      blockerId: payload.blockerId ?? null,
      description: payload.description ?? "",
      severity: payload.severity ?? "medium",
      status: payload.status ?? "open",
      createdByMemberId: null,
      createdAt: "2026-05-01T00:00:00.000Z",
      resolvedAt: null,
        };
      },
    ),
    deleteTaskBlockerRecord: jest.fn(
      async (blockerId, onUnauthorized): Promise<TaskBlockerRecord> => {
        void onUnauthorized;
        return {
      id: blockerId,
      blockedTaskId: "task-1",
      blockerType: "other",
      blockerId: null,
      description: "",
      severity: "medium",
      status: "open",
      createdByMemberId: null,
      createdAt: "2026-05-01T00:00:00.000Z",
      resolvedAt: null,
        };
      },
    ),
  };
}
