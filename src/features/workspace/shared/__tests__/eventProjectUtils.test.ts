/// <reference types="jest" />

import {
  getEventProjectIds,
  getMilestoneSubsystemOptions,
  reconcileMilestoneSubsystemIds,
} from "@/features/workspace/shared/eventProjectUtils";
import type { BootstrapPayload, EventRecord } from "@/types";

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

function createEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: "event-1",
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

describe("event project helpers", () => {
  it("uses explicit event projects before falling back to subsystem projects", () => {
    expect(
      getEventProjectIds(
        createEvent({
          projectIds: ["project-b"],
          relatedSubsystemIds: ["subsystem-a"],
        }),
        subsystemsById,
      ),
    ).toEqual(["project-b"]);

    expect(
      getEventProjectIds(
        createEvent({
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
