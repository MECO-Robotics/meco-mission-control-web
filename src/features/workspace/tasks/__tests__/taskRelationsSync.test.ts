/// <reference types="jest" />

import { normalizeTaskPayload } from "@/features/workspace/tasks/domain/taskPayloadNormalization";
import {
  syncTaskBlockers,
  syncTaskDependencies,
  type TaskRelationPersistence,
} from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskPayload } from "@/types/payloads";
import type { TaskBlockerRecord, TaskDependencyRecord } from "@/types/recordsExecution";

function createTaskPayload(): TaskPayload {
  return {
    projectId: "project-1",
    workstreamId: null,
    workstreamIds: [],
    title: "  Build intake  ",
    summary: "  Trim this summary  ",
    subsystemId: "subsystem-1",
    subsystemIds: ["subsystem-1"],
    disciplineId: "discipline-1",
    mechanismId: null,
    mechanismIds: [],
    partInstanceId: null,
    partInstanceIds: [],
    targetMilestoneId: null,
    photoUrl: "",
    ownerId: null,
    assigneeIds: ["member-1", "member-1", "member-2"],
    mentorId: null,
    startDate: "2026-05-01",
    dueDate: "2026-05-03",
    priority: "medium",
    status: "not-started",
    estimatedHours: 3,
    actualHours: 0,
    blockers: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    requiresDocumentation: false,
    documentationLinked: false,
    taskDependencies: [
      {
        kind: "task",
        refId: "  task-upstream  ",
        requiredState: "  complete  ",
        dependencyType: "hard",
      },
    ],
    taskBlockers: [
      {
        blockerType: "external",
        blockerId: null,
        description: "  Waiting on vendor reply  ",
        severity: "medium",
      },
    ],
  };
}

function createTaskRelationPersistence(): TaskRelationPersistence {
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
        requiredState: payload.requiredState,
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
    createTaskBlockerRecord: jest.fn(
      async (payload, onUnauthorized): Promise<TaskBlockerRecord> => {
        void onUnauthorized;
        return {
      id: "created-blocker",
      createdByMemberId: null,
      createdAt: "2026-05-01T00:00:00.000Z",
      resolvedAt: null,
      ...payload,
        };
      },
    ),
    updateTaskBlockerRecord: jest.fn(
      async (blockerId, payload, onUnauthorized): Promise<TaskBlockerRecord> => {
        void onUnauthorized;
        return {
      id: blockerId,
      blockedTaskId: payload.blockedTaskId ?? "task-1",
      blockerType: payload.blockerType ?? "external",
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
      blockerType: "external",
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

describe("normalizeTaskPayload", () => {
  it("trims task text and deduplicates assignees", () => {
    const normalized = normalizeTaskPayload(createTaskPayload());

    expect(normalized.title).toBe("Build intake");
    expect(normalized.summary).toBe("Trim this summary");
    expect(normalized.assigneeIds).toEqual(["member-1", "member-2"]);
    expect(normalized.taskDependencies?.[0]).toMatchObject({
      refId: "task-upstream",
      requiredState: "complete",
    });
    expect(normalized.taskBlockers?.[0]).toMatchObject({
      description: "Waiting on vendor reply",
    });
  });
});

describe("task relation sync services", () => {
  const noopUnauthorized = () => undefined;

  it("syncs dependency records with create, update, and delete operations", async () => {
    const persistence = createTaskRelationPersistence();
    const existingDependencies: TaskDependencyRecord[] = [
      {
        id: "dep-keep",
        taskId: "task-1",
        kind: "task",
        refId: "task-upstream",
        requiredState: "complete",
        dependencyType: "hard",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "dep-update",
        taskId: "task-1",
        kind: "task",
        refId: "old-task",
        requiredState: "open",
        dependencyType: "hard",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "dep-remove",
        taskId: "task-1",
        kind: "milestone",
        refId: "milestone-2",
        requiredState: "complete",
        dependencyType: "soft",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
    ];

    await syncTaskDependencies(
      {
        taskId: "task-1",
        desiredDependencies: [
          {
            id: "dep-keep",
            kind: "task",
            refId: "task-upstream",
            requiredState: "complete",
            dependencyType: "hard",
          },
          {
            id: "dep-update",
            kind: "milestone",
            refId: " milestone-1 ",
            requiredState: " ready ",
            dependencyType: "soft",
          },
          {
            kind: "part_instance",
            refId: " part-1 ",
            dependencyType: "hard",
          },
        ],
        existingDependencies,
        handleUnauthorized: noopUnauthorized,
      },
      persistence,
    );

    expect(persistence.updateTaskDependencyRecord).toHaveBeenCalledTimes(1);
    expect(persistence.updateTaskDependencyRecord).toHaveBeenCalledWith(
      "dep-update",
      expect.objectContaining({
        taskId: "task-1",
        kind: "milestone",
        refId: "milestone-1",
        requiredState: "ready",
        dependencyType: "soft",
      }),
      noopUnauthorized,
    );
    expect(persistence.createTaskDependencyRecord).toHaveBeenCalledTimes(1);
    expect(persistence.createTaskDependencyRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "task-1",
        kind: "part_instance",
        refId: "part-1",
        requiredState: undefined,
        dependencyType: "hard",
      }),
      noopUnauthorized,
    );
    expect(persistence.deleteTaskDependencyRecord).toHaveBeenCalledTimes(1);
    expect(persistence.deleteTaskDependencyRecord).toHaveBeenCalledWith(
      "dep-remove",
      noopUnauthorized,
    );
  });

  it("syncs blocker records with create, update, and delete operations", async () => {
    const persistence = createTaskRelationPersistence();
    const existingBlockers: TaskBlockerRecord[] = [
      {
        id: "blocker-keep",
        blockedTaskId: "task-1",
        blockerType: "external",
        blockerId: null,
        description: "Waiting on parts",
        severity: "medium",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        resolvedAt: null,
      },
      {
        id: "blocker-update",
        blockedTaskId: "task-1",
        blockerType: "task",
        blockerId: "task-2",
        description: "Old detail",
        severity: "low",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        resolvedAt: null,
      },
      {
        id: "blocker-remove",
        blockedTaskId: "task-1",
        blockerType: "part_instance",
        blockerId: "part-2",
        description: "Remove this blocker",
        severity: "high",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        resolvedAt: null,
      },
    ];

    await syncTaskBlockers(
      {
        taskId: "task-1",
        desiredBlockers: [
          {
            id: "blocker-keep",
            blockerType: "external",
            blockerId: null,
            description: "Waiting on parts",
            severity: "medium",
          },
          {
            id: "blocker-update",
            blockerType: "milestone",
            blockerId: "milestone-1",
            description: "  Needs milestone handoff  ",
            severity: "high",
          },
          {
            blockerType: "external",
            blockerId: null,
            description: "  Supplier ETA unknown  ",
            severity: "low",
          },
        ],
        existingBlockers,
        handleUnauthorized: noopUnauthorized,
      },
      persistence,
    );

    expect(persistence.updateTaskBlockerRecord).toHaveBeenCalledTimes(1);
    expect(persistence.updateTaskBlockerRecord).toHaveBeenCalledWith(
      "blocker-update",
      expect.objectContaining({
        blockedTaskId: "task-1",
        blockerType: "milestone",
        blockerId: "milestone-1",
        description: "Needs milestone handoff",
        severity: "high",
        status: "open",
      }),
      noopUnauthorized,
    );
    expect(persistence.createTaskBlockerRecord).toHaveBeenCalledTimes(1);
    expect(persistence.createTaskBlockerRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        blockedTaskId: "task-1",
        blockerType: "external",
        blockerId: null,
        description: "Supplier ETA unknown",
        severity: "low",
        status: "open",
      }),
      noopUnauthorized,
    );
    expect(persistence.deleteTaskBlockerRecord).toHaveBeenCalledTimes(1);
    expect(persistence.deleteTaskBlockerRecord).toHaveBeenCalledWith(
      "blocker-remove",
      noopUnauthorized,
    );
  });
});
