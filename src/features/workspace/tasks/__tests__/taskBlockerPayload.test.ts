/// <reference types="jest" />

import { buildTaskBlockerPayload } from "@/features/workspace/tasks/domain/taskPayloadNormalization";

describe("buildTaskBlockerPayload", () => {
  it("keeps a part relationship while changing its issue category", () => {
    expect(buildTaskBlockerPayload("task-1", {
      blockerType: "broken-part", blockerId: "part-1", sourceKind: "part_instance",
      description: "Replacement needed", severity: "high",
    })).toEqual(expect.objectContaining({
      blockerType: "part_instance", issueType: "broken-part", blockerId: "part-1",
    }));
  });
  it("respects an explicitly changed type on an external blocker", () => {
    expect(buildTaskBlockerPayload("task-1", {
      blockerType: "broken-part",
      blockerId: null,
      description: "Broken replacement",
      severity: "high",
      sourceKind: "external",
    }).issueType).toBe("broken-part");
  });
  it("preserves an external kind during unrelated blocker edits", () => {
    expect(buildTaskBlockerPayload("task-1", {
      id: "blocker-1",
      blockerType: "external",
      blockerId: null,
      description: "  Updated vendor ETA  ",
      severity: "high",
      sourceKind: "external",
    })).toEqual(expect.objectContaining({
      blockerType: "external",
      blockerId: null,
      description: "Updated vendor ETA",
    }));
  });
});
