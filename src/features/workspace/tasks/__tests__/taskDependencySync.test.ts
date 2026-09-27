/// <reference types="jest" />

import { createTaskRelationPersistence } from "./taskRelationPersistence";
import { syncTaskDependencies } from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskDependencyRecord } from "@/types/recordsExecution";

describe("task dependency sync", () => {
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
            requiredState: "ready",
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
        requiredState: "ready",
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
});
