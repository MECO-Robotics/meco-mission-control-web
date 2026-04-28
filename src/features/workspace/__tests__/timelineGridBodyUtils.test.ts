/// <reference types="jest" />

import { getTaskDependencyCounts } from "@/features/workspace/views/timeline/timelineGridBodyUtils";

describe("getTaskDependencyCounts", () => {
  it("counts incoming and outgoing task dependencies for a task", () => {
    const counts = getTaskDependencyCounts("task-target", [
      {
        id: "dependency-1",
        upstreamTaskId: "task-upstream-1",
        downstreamTaskId: "task-target",
        dependencyType: "blocks",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-2",
        upstreamTaskId: "task-upstream-2",
        downstreamTaskId: "task-target",
        dependencyType: "blocks",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-3",
        upstreamTaskId: "task-target",
        downstreamTaskId: "task-downstream",
        dependencyType: "blocks",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-4",
        upstreamTaskId: "task-other",
        downstreamTaskId: "task-unrelated",
        dependencyType: "blocks",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ]);

    expect(counts).toEqual({
      incoming: 2,
      outgoing: 1,
    });
  });
});
