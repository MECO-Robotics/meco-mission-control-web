/// <reference types="jest" />

import {
  getMilestoneProjectIds,
  getMilestoneSubsystemOptions,
  reconcileMilestoneSubsystemIds,
} from "@/features/workspace/shared/milestones";
import type { BootstrapPayload, MilestoneRecord } from "@/types";

const subsystems: BootstrapPayload["subsystems"] = [
  {
    id: "subsystem-a",
    projectId: "project-a",
    name: "Alpha",
    description: "",
    iteration: 1,
    isCore: true,
    parentSubsystemId: null,
    responsibleEngineerId: null,
    mentorIds: [],
    risks: [],
  },
  {
    id: "subsystem-b",
    projectId: "project-b",
    name: "Beta",
    description: "",
    iteration: 1,
    isCore: true,
    parentSubsystemId: null,
    responsibleEngineerId: null,
    mentorIds: [],
    risks: [],
  },
];

const subsystemsById = Object.fromEntries(
  subsystems.map((subsystem) => [subsystem.id, subsystem]),
) as Record<string, BootstrapPayload["subsystems"][number]>;

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
    relatedSubsystemIds: [],
    ...overrides,
  };
}

describe("milestone project helpers", () => {
  it("uses explicit milestone projects before falling back to subsystem projects", () => {
    expect(
      getMilestoneProjectIds(
        createMilestone({
          projectIds: ["project-b"],
          relatedSubsystemIds: ["subsystem-a"],
        }),
        subsystemsById,
      ),
    ).toEqual(["project-b"]);

    expect(
      getMilestoneProjectIds(
        createMilestone({
          relatedSubsystemIds: ["subsystem-a", "subsystem-b"],
        }),
        subsystemsById,
      ),
    ).toEqual(["project-a", "project-b"]);
  });

  it("filters subsystem options and selections to the chosen projects", () => {
    expect(
      getMilestoneSubsystemOptions(subsystems, ["project-b"]).map(
        (subsystem) => subsystem.id,
      ),
    ).toEqual(["subsystem-b"]);

    expect(
      reconcileMilestoneSubsystemIds(
        ["subsystem-a", "subsystem-b"],
        ["project-b"],
        subsystemsById,
      ),
    ).toEqual(["subsystem-b"]);
  });
});

