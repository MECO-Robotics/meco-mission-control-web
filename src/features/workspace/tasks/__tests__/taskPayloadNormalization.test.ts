/// <reference types="jest" />

import { normalizeTaskPayload } from "@/features/workspace/tasks/domain/taskPayloadNormalization";
import type { TaskPayload } from "@/types/payloads/task";

function createTaskPayload(): TaskPayload {
  return {
    artifactIds: [],
    projectId: "project-1",
    workstreamIds: [],
    title: "  Build intake  ",
    summary: "  Trim this summary  ",
    subsystemIds: ["subsystem-1"],
    disciplineId: "discipline-1",
    mechanismIds: [],
    partInstanceIds: [],
    targetRiskId: "  risk-1  ",
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
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    requiresDocumentation: false,
    documentationLinked: false,
    taskDependencies: [
      {
        kind: "work_item",
        refType: "task",
        refId: "  task-upstream  ",
        requiredState: "  complete  ",
        dependencyType: "hard",
      },
    ],
    taskBlockers: [
      {
        blockerType: "shipping-delay",
        blockerId: null,
        description: "  Waiting on vendor reply  ",
        severity: "medium",
      },
    ],
  };
}

describe("normalizeTaskPayload", () => {
  it("trims task text and deduplicates assignees", () => {
    const normalized = normalizeTaskPayload(createTaskPayload());

    expect(normalized.title).toBe("Build intake");
    expect(normalized.summary).toBe("Trim this summary");
    expect(normalized.targetRiskId).toBe("risk-1");
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
