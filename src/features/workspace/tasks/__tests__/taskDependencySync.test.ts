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
        workItemId: "task-1",
        sourceType: "task",
        kind: "work_item",
        refType: "task",
        refId: "task-upstream",
        requiredState: "complete",
        dependencyType: "hard",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "dep-update",
        workItemId: "task-1",
        sourceType: "task",
        kind: "work_item",
        refType: "task",
        refId: "old-task",
        requiredState: "open",
        dependencyType: "hard",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "dep-remove",
        workItemId: "task-1",
        sourceType: "task",
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
            kind: "work_item",
        refType: "task",
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
        workItemId: "task-1",
        sourceType: "task",
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
        workItemId: "task-1",
        sourceType: "task",
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

  it("persists manufacturing-owned dependencies on tasks through the canonical work API shape", async () => {
    const persistence = createTaskRelationPersistence();
    await syncTaskDependencies({
      taskId: "manufacturing-1",
      sourceType: "manufacturing",
      desiredDependencies: [{ kind: "work_item", refType: "task", refId: "task-1", requiredState: "complete", dependencyType: "hard" }],
      existingDependencies: [],
      handleUnauthorized: noopUnauthorized,
    }, persistence);

    expect(persistence.createTaskDependencyRecord).toHaveBeenCalledWith(expect.objectContaining({
      workItemId: "manufacturing-1",
      sourceType: "manufacturing",
      kind: "work_item",
      refType: "task",
      refId: "task-1",
    }), noopUnauthorized);
  });
});
