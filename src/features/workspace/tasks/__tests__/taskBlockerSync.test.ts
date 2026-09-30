/// <reference types="jest" />

import { createTaskRelationPersistence } from "./taskRelationPersistence";
import { syncTaskBlockers } from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskBlockerRecord } from "@/types/recordsExecution";

describe("task blocker sync", () => {
  const noopUnauthorized = () => undefined;

  it("syncs blocker records with create, update, and delete operations", async () => {
    const persistence = createTaskRelationPersistence();
    const existingBlockers: TaskBlockerRecord[] = [
      {
        id: "blocker-keep",
        blockedTaskId: "task-1",
        blockerType: "shipping-delay",
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
        blockerType: "design-issue",
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
        blockerType: "lost-part",
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
            blockerType: "shipping-delay",
            blockerId: null,
            description: "Waiting on parts",
            severity: "medium",
          },
          {
            id: "blocker-update",
            blockerType: "qa-failed",
            blockerId: "milestone-1",
            sourceKind: "milestone",
            description: "  Needs milestone handoff  ",
            severity: "high",
          },
          {
            blockerType: "manufacturing-unavailable",
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
        issueType: "qa-failed",
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
        issueType: "manufacturing-unavailable",
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
