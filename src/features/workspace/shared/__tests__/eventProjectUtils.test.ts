/// <reference types="jest" />

import { getMilestoneProjectIds } from "@/features/workspace/shared/events/eventProjectUtils";
import type { MilestoneRecord } from "@/types/recordsExecution";

function createMilestone(overrides: Partial<MilestoneRecord>): MilestoneRecord {
  return {
    id: "milestone-1",
    title: "Milestone",
    type: "demo",
    startDateTime: "2026-05-01T12:00:00",
    endDateTime: null,
    isExternal: false,
    description: "",
    projectIds: [],
    ...overrides,
  };
}

describe("milestone project helpers", () => {
  it("returns explicit milestone projects", () => {
    expect(
      getMilestoneProjectIds(
        createMilestone({
          projectIds: ["project-b"],
        }),
      ),
    ).toEqual(["project-b"]);

    expect(getMilestoneProjectIds(createMilestone({}))).toEqual([]);
  });
});
