/// <reference types="jest" />

import {
  buildEmptyArtifactPayload,
  buildEmptyTaskPayload,
  buildEmptyWorkLogPayload,
  getDefaultSubsystemId,
  joinList,
  splitList,
} from "../appUtils";
import type {
  BootstrapPayload,
  EventRecord,
  PartDefinitionRecord,
  PartInstanceRecord,
  ProjectRecord,
  WorkstreamRecord,
} from "../../types";

function createBootstrap(overrides: Partial<BootstrapPayload> = {}): BootstrapPayload {
  const projectA: ProjectRecord = {
    id: "project-a",
    seasonId: "season-2026",
    name: "Robot",
    projectType: "robot",
    description: "Main robot build",
    status: "active",
  };

  const projectB: ProjectRecord = {
    id: "project-b",
    seasonId: "season-2026",
    name: "Outreach",
    projectType: "outreach",
    description: "Outreach work",
    status: "active",
  };

  const workstreamA: WorkstreamRecord = {
    id: "workstream-a",
    projectId: projectA.id,
    name: "Drivetrain",
    description: "Drive work",
  };

  const workstreamB: WorkstreamRecord = {
    id: "workstream-b",
    projectId: projectB.id,
    name: "Media",
    description: "Media work",
  };

  const partDefinition: PartDefinitionRecord = {
    id: "part-def-1",
    name: "Bearing Block",
    partNumber: "BB-001",
    revision: "A",
    type: "custom",
    source: "in-house",
    materialId: null,
    description: "",
  };

  const event: EventRecord = {
    id: "event-1",
    title: "Regional",
    type: "competition",
    startDateTime: "2026-03-10T14:00:00.000Z",
    endDateTime: null,
    isExternal: true,
    description: "",
    relatedSubsystemIds: [],
  };

  const partInstance: PartInstanceRecord = {
    id: "part-instance-1",
    subsystemId: "subsystem-core",
    mechanismId: "mechanism-1",
    partDefinitionId: partDefinition.id,
    name: "Left Bearing Block",
    quantity: 1,
    trackIndividually: false,
    status: "planned",
  };

  const base: BootstrapPayload = {
    seasons: [
      {
        id: "season-2026",
        name: "2026 Season",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-04-30",
      },
    ],
    projects: [projectA, projectB],
    workstreams: [workstreamA, workstreamB],
    members: [
      {
        id: "lead-1",
        name: "Lead Student",
        email: "lead@meco.test",
        role: "lead",
        elevated: true,
        seasonId: "season-2026",
      },
      {
        id: "mentor-1",
        name: "Mentor",
        email: "mentor@meco.test",
        role: "mentor",
        elevated: true,
        seasonId: "season-2026",
      },
      {
        id: "student-1",
        name: "Student",
        email: "student@meco.test",
        role: "student",
        elevated: false,
        seasonId: "season-2026",
      },
    ],
    subsystems: [
      {
        id: "subsystem-core",
        projectId: projectA.id,
        name: "Drive",
        description: "",
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
      {
        id: "subsystem-secondary",
        projectId: projectA.id,
        name: "Shooter",
        description: "",
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [{ id: "discipline-mech", code: "mechanical", name: "Mechanical" }],
    mechanisms: [{ id: "mechanism-1", subsystemId: "subsystem-core", name: "Gearbox", description: "" }],
    materials: [],
    artifacts: [],
    partDefinitions: [partDefinition],
    partInstances: [partInstance],
    events: [event],
    qaReports: [],
    testResults: [],
    risks: [],
    tasks: [
      {
        id: "task-1",
        projectId: projectA.id,
        workstreamId: workstreamA.id,
        title: "Initial task",
        summary: "",
        subsystemId: "subsystem-core",
        disciplineId: "discipline-mech",
        mechanismId: null,
        partInstanceId: null,
        targetEventId: null,
        ownerId: null,
        mentorId: null,
        startDate: "2026-02-01",
        dueDate: "2026-02-01",
        priority: "medium",
        status: "not-started",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 2,
        actualHours: 0,
        requiresDocumentation: false,
        documentationLinked: false,
      },
    ],
    workLogs: [],
    purchaseItems: [],
    manufacturingItems: [],
  };

  return {
    ...base,
    ...overrides,
  };
}

describe("appUtils", () => {
  it("splitList trims values and removes empty entries", () => {
    expect(splitList(" alpha, , beta ,gamma ,, ")).toEqual(["alpha", "beta", "gamma"]);
  });

  it("joinList returns a comma-separated label", () => {
    expect(joinList(["alpha", "beta", "gamma"])).toBe("alpha, beta, gamma");
  });

  it("getDefaultSubsystemId prefers the core subsystem", () => {
    const bootstrap = createBootstrap();
    expect(getDefaultSubsystemId(bootstrap)).toBe("subsystem-core");
  });

  it("getDefaultSubsystemId falls back to first subsystem when no core exists", () => {
    const bootstrap = createBootstrap({
      subsystems: [
        {
          id: "subsystem-a",
          projectId: "project-a",
          name: "Subsystem A",
          description: "",
          isCore: false,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          risks: [],
        },
      ],
    });

    expect(getDefaultSubsystemId(bootstrap)).toBe("subsystem-a");
  });

  it("buildEmptyTaskPayload picks sensible defaults from bootstrap data", () => {
    const payload = buildEmptyTaskPayload(createBootstrap());

    expect(payload.projectId).toBe("project-a");
    expect(payload.workstreamId).toBe("workstream-a");
    expect(payload.subsystemId).toBe("subsystem-core");
    expect(payload.mechanismId).toBe("mechanism-1");
    expect(payload.partInstanceId).toBe("part-instance-1");
    expect(payload.ownerId).toBe("lead-1");
    expect(payload.mentorId).toBe("mentor-1");
    expect(payload.targetEventId).toBe("event-1");
    expect(payload.priority).toBe("medium");
    expect(payload.status).toBe("not-started");
  });

  it("buildEmptyArtifactPayload clears workstream when it does not match project scope", () => {
    const payload = buildEmptyArtifactPayload(createBootstrap(), {
      projectId: "project-a",
      workstreamId: "workstream-b",
    });

    expect(payload.projectId).toBe("project-a");
    expect(payload.workstreamId).toBeNull();
  });

  it("buildEmptyWorkLogPayload uses a valid preferred participant id", () => {
    const payload = buildEmptyWorkLogPayload(createBootstrap(), "student-1");
    expect(payload.participantIds).toEqual(["student-1"]);
  });

  it("buildEmptyWorkLogPayload falls back to first member for invalid preferred id", () => {
    const payload = buildEmptyWorkLogPayload(createBootstrap(), "missing");
    expect(payload.participantIds).toEqual(["lead-1"]);
  });
});
