/// <reference types="jest" />

import {
  buildTaskDependencyCountsByTaskId,
  buildTimelineTaskStatusSignalByTaskId,
  getTaskDependencyCounts,
  getTaskDependencyCountsFromLookup,
  getTimelineTaskStatusSignal,
} from "@/features/workspace/views/timeline/timelineGridBodyUtils";
import type { BootstrapPayload } from "@/types/bootstrap";

const baseTask: BootstrapPayload["tasks"][number] = {
  id: "task-ready",
  projectId: "project-1",
  workstreamId: null,
  workstreamIds: [],
  title: "Ready task",
  summary: "",
  subsystemId: "subsystem-1",
  subsystemIds: ["subsystem-1"],
  disciplineId: "discipline-1",
  mechanismId: null,
  mechanismIds: [],
  partInstanceId: null,
  partInstanceIds: [],
  targetMilestoneId: null,
  ownerId: "member-1",
  assigneeIds: ["member-1"],
  mentorId: null,
  startDate: "2026-04-01",
  dueDate: "2026-04-03",
  priority: "medium",
  status: "not-started",
  dependencyIds: [],
  blockers: [],
  linkedManufacturingIds: [],
  linkedPurchaseIds: [],
  estimatedHours: 1,
  actualHours: 0,
  requiresDocumentation: false,
  documentationLinked: false,
};

describe("getTaskDependencyCounts", () => {
  it("counts incoming and outgoing task dependencies for a task", () => {
    const dependencies: Parameters<typeof getTaskDependencyCounts>[1] = [
      {
        id: "dependency-1",
        taskId: "task-target",
        kind: "task",
        refId: "task-upstream-1",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-2",
        taskId: "task-target",
        kind: "task",
        refId: "task-upstream-2",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-3",
        taskId: "task-downstream",
        kind: "task",
        refId: "task-target",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-4",
        taskId: "task-unrelated",
        kind: "task",
        refId: "task-other",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ];
    const counts = getTaskDependencyCounts("task-target", dependencies);

    expect(counts).toEqual({
      incoming: 2,
      outgoing: 1,
    });
  });

  it("builds a reusable dependency count lookup for timeline task bars", () => {
    const lookup = buildTaskDependencyCountsByTaskId([
      {
        id: "dependency-1",
        taskId: "task-b",
        kind: "task",
        refId: "task-a",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-2",
        taskId: "task-c",
        kind: "task",
        refId: "task-b",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "dependency-3",
        taskId: "task-c",
        kind: "task",
        refId: "task-a",
        dependencyType: "hard",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ]);

    expect(getTaskDependencyCountsFromLookup(lookup, "task-a")).toEqual({
      incoming: 0,
      outgoing: 2,
    });
    expect(getTaskDependencyCountsFromLookup(lookup, "task-b")).toEqual({
      incoming: 1,
      outgoing: 1,
    });
    expect(getTaskDependencyCountsFromLookup(lookup, "task-c")).toEqual({
      incoming: 2,
      outgoing: 0,
    });
    expect(getTaskDependencyCountsFromLookup(lookup, "task-unrelated")).toEqual({
      incoming: 0,
      outgoing: 0,
    });
  });

  it("prioritizes active blockers over dependency and status icons", () => {
    const bootstrap = {
      tasks: [
        { ...baseTask, id: "task-upstream", status: "in-progress" },
        { ...baseTask, id: "task-blocked", blockers: ["Waiting on material"] },
        { ...baseTask, id: "task-waiting", dependencyIds: ["task-upstream"] },
        { ...baseTask, id: "task-qa", status: "waiting-for-qa" },
      ],
      taskDependencies: [
        {
          id: "dependency-1",
        taskId: "task-waiting",
        kind: "task",
        refId: "task-upstream",
        dependencyType: "hard",
          createdAt: "2026-02-01T00:00:00.000Z",
        },
      ],
      taskBlockers: [
        {
          id: "blocker-1",
          blockedTaskId: "task-blocked",
          blockerType: "external",
          blockerId: null,
          description: "Waiting on material",
          severity: "medium",
          status: "open",
          createdByMemberId: null,
          createdAt: "2026-02-01T00:00:00.000Z",
          resolvedAt: null,
        },
      ],
    } as unknown as BootstrapPayload;

    const signals = buildTimelineTaskStatusSignalByTaskId(bootstrap);

    expect(signals["task-upstream"]).toBe("in-progress");
    expect(signals["task-blocked"]).toBe("blocked");
    expect(signals["task-waiting"]).toBe("waiting-on-dependency");
    expect(signals["task-qa"]).toBe("waiting-for-qa");
    expect(getTimelineTaskStatusSignal(bootstrap.tasks[1], bootstrap)).toBe("blocked");
  });
});
