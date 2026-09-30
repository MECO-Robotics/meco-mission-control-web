/// <reference types="jest" />

import { normalizeTaskPayload } from "@/features/workspace/tasks/domain/taskPayloadNormalization";
import type { TaskPayload } from "@/types/payloads/task";

function createTaskPayload(): TaskPayload {
  return {
    projectId: "project-1", workTypeId: "robot-design", responsibleGroupId: null, workstreamIds: [],
    title: "  Build intake  ", summary: "  Trim this summary  ", subsystemIds: ["subsystem-1"],
    mechanismIds: [], partInstanceIds: [], scheduleRefs: [], requestedById: null, photoUrl: "", ownerId: null,
    assigneeIds: ["member-1", "member-1", "member-2"], mentorId: null, startDate: "2026-05-01", dueDate: "2026-05-03",
    priority: "medium", status: "not-started", checklistItems: [], estimatedHours: 3,
    requiresDocumentation: false, manufacturingDetails: null,
    taskDependencies: [{ kind: "task", refId: "  task-upstream  ", requiredState: "  complete  ", dependencyType: "hard" }],
  };
}

describe("normalizeTaskPayload", () => {
  it("trims task text and dependency references and deduplicates assignees", () => {
    const normalized = normalizeTaskPayload(createTaskPayload());
    expect(normalized.title).toBe("Build intake");
    expect(normalized.summary).toBe("Trim this summary");
    expect(normalized.assigneeIds).toEqual(["member-1", "member-2"]);
    expect(normalized.taskDependencies?.[0]).toMatchObject({ refId: "task-upstream", requiredState: "complete" });
  });
});
