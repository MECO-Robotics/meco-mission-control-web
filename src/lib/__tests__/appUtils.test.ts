/// <reference types="jest" />

import {
  buildEmptyArtifactPayload,
  buildEmptyManufacturingPayload,
  getPartDefinitionActiveSeasonIds,
  buildEmptyTaskPayload,
  buildEmptyWorkLogPayload,
  findMemberForSessionUser,
  getDefaultSubsystemId,
  getManufacturingPartInstanceOptions,
  getProjectTaskTargetLabel,
  isPartDefinitionActiveInSeason,
  inferManufacturingDraftFromPartSelection,
  joinList,
  setTaskPrimaryTargetSelection,
  splitList,
  taskToPayload,
  toggleTaskTargetSelection,
} from "@/lib/appUtils";
import { formatLocalDate, localTodayDate } from "@/lib/dateUtils";
import type {
  BootstrapPayload,
  EventRecord,
  PartDefinitionRecord,
  PartInstanceRecord,
  ProjectRecord,
  WorkstreamRecord,
} from "@/types";

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
    seasonId: "season-2026",
    name: "Bearing Block",
    partNumber: "BB-001",
    revision: "A",
    iteration: 1,
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
    projectIds: [projectA.id],
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
        iteration: 1,
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
        iteration: 1,
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [{ id: "discipline-design", code: "design", name: "Design" }],
    mechanisms: [
      {
        id: "mechanism-1",
        subsystemId: "subsystem-core",
        name: "Gearbox",
        description: "",
        iteration: 1,
      },
    ],
    materials: [],
    artifacts: [],
    partDefinitions: [partDefinition],
    partInstances: [partInstance],
    events: [event],
    reports: [],
    reportFindings: [],
    qaReports: [],
    testResults: [],
    qaFindings: [],
    testFindings: [],
    designIterations: [],
    risks: [],
    tasks: [
      {
        id: "task-1",
        projectId: projectA.id,
        workstreamId: workstreamA.id,
        workstreamIds: [workstreamA.id],
        title: "Initial task",
        summary: "",
        subsystemId: "subsystem-core",
        subsystemIds: ["subsystem-core"],
        disciplineId: "discipline-design",
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        targetEventId: null,
        ownerId: null,
        assigneeIds: [],
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
  afterEach(() => {
    jest.useRealTimers();
  });

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
          iteration: 1,
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

  it("reads part definition active season membership like roster entities", () => {
    const activeSeasonIds = getPartDefinitionActiveSeasonIds({
      seasonId: "season-2026",
      activeSeasonIds: ["season-2027"],
    });

    expect(activeSeasonIds.sort()).toEqual(["season-2026", "season-2027"].sort());
    expect(
      isPartDefinitionActiveInSeason(
        {
          seasonId: "season-2026",
          activeSeasonIds: ["season-2027"],
        },
        "season-2027",
      ),
    ).toBe(true);
    expect(
      isPartDefinitionActiveInSeason(
        {
          seasonId: "season-2026",
          activeSeasonIds: ["season-2027"],
        },
        "season-2028",
      ),
    ).toBe(false);
  });

  it("buildEmptyTaskPayload picks sensible defaults from bootstrap data", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 23, 30));
    const payload = buildEmptyTaskPayload(createBootstrap());

    expect(payload.projectId).toBe("project-a");
    expect(payload.workstreamId).toBeNull();
    expect(payload.workstreamIds).toEqual([]);
    expect(payload.subsystemId).toBe("subsystem-core");
    expect(payload.subsystemIds).toEqual(["subsystem-core"]);
    expect(payload.mechanismId).toBeNull();
    expect(payload.mechanismIds).toEqual([]);
    expect(payload.partInstanceId).toBeNull();
    expect(payload.partInstanceIds).toEqual([]);
    expect(payload.ownerId).toBe("lead-1");
    expect(payload.assigneeIds).toEqual(["lead-1"]);
    expect(payload.mentorId).toBe("mentor-1");
    expect(payload.targetEventId).toBe("event-1");
    expect(payload.startDate).toBe("2026-01-02");
    expect(payload.dueDate).toBe("2026-01-02");
    expect(payload.priority).toBe("medium");
    expect(payload.status).toBe("not-started");
    expect(payload.blockers).toEqual([]);
    expect(payload.taskBlockers).toEqual([]);
  });

  it("formats local date-only values without UTC conversion", () => {
    const localDate = new Date(2026, 0, 2, 23, 30);

    expect(formatLocalDate(localDate)).toBe("2026-01-02");
    expect(localTodayDate(localDate)).toBe("2026-01-02");
  });

  it("taskToPayload carries dependency records from bootstrap data", () => {
    const bootstrap = createBootstrap({
      taskDependencies: [
        {
          id: "task-dependency-1",
          upstreamTaskId: "task-upstream",
          downstreamTaskId: "task-1",
          dependencyType: "blocks",
          createdAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    });

    expect(taskToPayload(bootstrap.tasks[0], bootstrap).taskDependencies).toEqual([
      {
        id: "task-dependency-1",
        upstreamTaskId: "task-upstream",
        dependencyType: "blocks",
      },
    ]);
  });

  it("taskToPayload carries blocker strings from task data", () => {
    const bootstrap = createBootstrap();
    const task = {
      ...bootstrap.tasks[0],
      blockers: ["Waiting on mentor review", "Waiting on final assembly"],
    };

    expect(taskToPayload(task, bootstrap).blockers).toEqual([
      "Waiting on mentor review",
      "Waiting on final assembly",
    ]);
  });

  it("taskToPayload carries blocker records from bootstrap data", () => {
    const bootstrap = createBootstrap({
      taskBlockers: [
        {
          id: "task-blocker-1",
          blockedTaskId: "task-1",
          blockerType: "task",
          blockerId: "task-upstream",
          description: "Waiting on upstream task",
          severity: "high",
          status: "open",
          createdByMemberId: "mentor-1",
          createdAt: "2026-02-01T00:00:00.000Z",
          resolvedAt: null,
        },
      ],
    });

    expect(taskToPayload(bootstrap.tasks[0], bootstrap).taskBlockers).toEqual([
      {
        id: "task-blocker-1",
        blockerType: "task",
        blockerId: "task-upstream",
        description: "Waiting on upstream task",
        severity: "high",
      },
    ]);
  });

  it("buildEmptyManufacturingPayload derives material, subsystem, instance, and quantity from the default part", () => {
  const partDefinition: PartDefinitionRecord = {
    id: "part-def-bearing-block",
    seasonId: "season-2026",
    name: "Bearing Block",
    partNumber: "BB-001",
    revision: "A",
    iteration: 1,
      type: "custom",
      source: "Onshape",
      materialId: "material-aluminum",
      description: "",
    };
    const bootstrap = createBootstrap({
      materials: [
        {
          id: "material-polycarbonate",
          name: "Polycarbonate",
          category: "plastic",
          unit: "sheet",
          onHandQuantity: 1,
          reorderPoint: 1,
          location: "Rack",
          vendor: "",
          notes: "",
        },
        {
          id: "material-aluminum",
          name: "Aluminum 6061",
          category: "metal",
          unit: "bar",
          onHandQuantity: 4,
          reorderPoint: 1,
          location: "Rack",
          vendor: "",
          notes: "",
        },
      ],
      partDefinitions: [partDefinition],
      partInstances: [
        {
          id: "part-instance-unrelated",
          subsystemId: "subsystem-core",
          mechanismId: null,
          partDefinitionId: "part-def-other",
          name: "Unrelated Part",
          quantity: 2,
          trackIndividually: false,
          status: "planned",
        },
        {
          id: "part-instance-bearing-block",
          subsystemId: "subsystem-secondary",
          mechanismId: null,
          partDefinitionId: partDefinition.id,
          name: "Shooter Bearing Block",
          quantity: 4,
          trackIndividually: false,
          status: "planned",
        },
      ],
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 23, 30));

    (["cnc", "3d-print", "fabrication"] as const).forEach((process) => {
      const payload = buildEmptyManufacturingPayload(bootstrap, process);

      expect(payload.process).toBe(process);
      expect(payload.dueDate).toBe("2026-01-02");
      expect(payload.title).toBe(partDefinition.name);
      expect(payload.materialId).toBe("material-aluminum");
      expect(payload.material).toBe("Aluminum 6061");
      expect(payload.subsystemId).toBe("subsystem-secondary");
      expect(payload.partDefinitionId).toBe(partDefinition.id);
      expect(payload.partInstanceId).toBe("part-instance-bearing-block");
      expect(payload.partInstanceIds).toEqual(["part-instance-bearing-block"]);
      expect(payload.quantity).toBe(4);
      expect(payload.inHouse).toBe(process === "cnc");
    });
  });

  it("inferManufacturingDraftFromPartSelection updates an existing draft from the selected part", () => {
  const partDefinition: PartDefinitionRecord = {
    id: "part-def-bearing-block",
    seasonId: "season-2026",
    name: "Bearing Block",
    partNumber: "BB-001",
    revision: "A",
    iteration: 1,
      type: "custom",
      source: "Onshape",
      materialId: "material-aluminum",
      description: "",
    };
    const bootstrap = createBootstrap({
      materials: [
        {
          id: "material-aluminum",
          name: "Aluminum 6061",
          category: "metal",
          unit: "bar",
          onHandQuantity: 4,
          reorderPoint: 1,
          location: "Rack",
          vendor: "",
          notes: "",
        },
      ],
      partDefinitions: [partDefinition],
      partInstances: [
        {
          id: "part-instance-bearing-block",
          subsystemId: "subsystem-secondary",
          mechanismId: null,
          partDefinitionId: partDefinition.id,
          name: "Shooter Bearing Block",
          quantity: 4,
          trackIndividually: false,
          status: "planned",
        },
      ],
    });

    const payload = inferManufacturingDraftFromPartSelection(
      bootstrap,
      {
        title: "Old print",
        subsystemId: "subsystem-core",
        requestedById: null,
        process: "3d-print",
        dueDate: "2026-02-01",
        material: "PLA",
        materialId: null,
        partDefinitionId: null,
        partInstanceId: null,
        partInstanceIds: [],
        quantity: 1,
        status: "requested",
        mentorReviewed: false,
        inHouse: false,
        batchLabel: "",
      },
      partDefinition.id,
    );

    expect(payload.title).toBe(partDefinition.name);
    expect(payload.materialId).toBe("material-aluminum");
    expect(payload.material).toBe("Aluminum 6061");
    expect(payload.subsystemId).toBe("subsystem-secondary");
    expect(payload.partInstanceId).toBe("part-instance-bearing-block");
    expect(payload.quantity).toBe(4);
  });

  it("inferManufacturingDraftFromPartSelection clears stale material when the selected part has no material", () => {
    const bootstrap = createBootstrap({
      materials: [
        {
          id: "material-aluminum",
          name: "Aluminum 6061",
          category: "metal",
          unit: "bar",
          onHandQuantity: 4,
          reorderPoint: 1,
          location: "Rack",
          vendor: "",
          notes: "",
        },
      ],
    });
    const partDefinition = bootstrap.partDefinitions[0];

    const payload = inferManufacturingDraftFromPartSelection(
      bootstrap,
      {
        ...buildEmptyManufacturingPayload(bootstrap, "cnc"),
        material: "Aluminum 6061",
        materialId: "material-aluminum",
      },
      partDefinition.id,
    );

    expect(payload.materialId).toBeNull();
    expect(payload.material).toBe("");
  });

  it("lists manufacturing part instances for the selected part definition across subsystems", () => {
    const partDefinition = createBootstrap().partDefinitions[0];
    const bootstrap = createBootstrap({
      partInstances: [
        {
          id: "part-instance-core",
          subsystemId: "subsystem-core",
          mechanismId: "mechanism-1",
          partDefinitionId: partDefinition.id,
          name: "Drive Bearing Block",
          quantity: 2,
          trackIndividually: false,
          status: "planned",
        },
        {
          id: "part-instance-secondary",
          subsystemId: "subsystem-secondary",
          mechanismId: null,
          partDefinitionId: partDefinition.id,
          name: "Shooter Bearing Block",
          quantity: 4,
          trackIndividually: false,
          status: "planned",
        },
      ],
    });

    const options = getManufacturingPartInstanceOptions(bootstrap, {
      ...buildEmptyManufacturingPayload(bootstrap, "cnc"),
      subsystemId: "subsystem-core",
      partDefinitionId: partDefinition.id,
    });

    expect(options.map((option) => option.id)).toEqual([
      "part-instance-core",
      "part-instance-secondary",
    ]);
  });

  it("getProjectTaskTargetLabel rebrands subsystem targets by project type", () => {
    const bootstrap = createBootstrap();

    expect(getProjectTaskTargetLabel(bootstrap.projects[0])).toBe("Subsystems");
    expect(getProjectTaskTargetLabel(bootstrap.projects[1])).toBe("Workstreams");
  });

  it("findMemberForSessionUser matches the signed-in user by normalized email", () => {
    const bootstrap = createBootstrap();

    const member = findMemberForSessionUser(bootstrap.members, {
      email: " Student@MECO.TEST ",
    });

    expect(member?.id).toBe("student-1");
  });

  it("findMemberForSessionUser returns null when the signed-in user is not on the roster", () => {
    const bootstrap = createBootstrap();

    const member = findMemberForSessionUser(bootstrap.members, {
      email: "missing@meco.test",
    });

    expect(member).toBeNull();
  });

  it("toggleTaskTargetSelection treats workstream selection as a subsystem alias", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      workstreamId: null,
      workstreamIds: [],
      subsystemId: "",
      subsystemIds: [],
      mechanismId: null,
      mechanismIds: [],
      partInstanceId: null,
      partInstanceIds: [],
    };

    const next = toggleTaskTargetSelection(payload, bootstrap, {
      kind: "workstream",
      id: "subsystem-secondary",
    });

    expect(next.workstreamId).toBeNull();
    expect(next.workstreamIds).toEqual([]);
    expect(next.subsystemId).toBe("subsystem-secondary");
    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
  });

  it("setTaskPrimaryTargetSelection keeps the task on one subsystem and clears unrelated scope", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      subsystemId: "subsystem-core",
      subsystemIds: ["subsystem-core"],
      mechanismId: "mechanism-1",
      mechanismIds: ["mechanism-1"],
      partInstanceId: "part-instance-1",
      partInstanceIds: ["part-instance-1"],
    };

    const next = setTaskPrimaryTargetSelection(payload, bootstrap, "subsystem-secondary");

    expect(next.subsystemId).toBe("subsystem-secondary");
    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
    expect(next.mechanismId).toBeNull();
    expect(next.mechanismIds).toEqual([]);
    expect(next.partInstanceId).toBeNull();
    expect(next.partInstanceIds).toEqual([]);
  });

  it("toggleTaskTargetSelection selects implied mechanism and subsystem for a part instance", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      mechanismId: null,
      mechanismIds: [],
      partInstanceId: null,
      partInstanceIds: [],
    };

    const next = toggleTaskTargetSelection(payload, bootstrap, {
      kind: "part-instance",
      id: "part-instance-1",
    });

    expect(next.subsystemIds).toEqual(["subsystem-core"]);
    expect(next.mechanismId).toBe("mechanism-1");
    expect(next.mechanismIds).toEqual(["mechanism-1"]);
    expect(next.partInstanceId).toBe("part-instance-1");
    expect(next.partInstanceIds).toEqual(["part-instance-1"]);
  });

  it("toggleTaskTargetSelection removes child targets when a subsystem is deselected", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      subsystemId: "subsystem-core",
      subsystemIds: ["subsystem-core", "subsystem-secondary"],
      mechanismId: "mechanism-1",
      mechanismIds: ["mechanism-1"],
      partInstanceId: "part-instance-1",
      partInstanceIds: ["part-instance-1"],
    };

    const next = toggleTaskTargetSelection(payload, bootstrap, {
      kind: "subsystem",
      id: "subsystem-core",
    });

    expect(next.subsystemId).toBe("subsystem-secondary");
    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
    expect(next.mechanismId).toBeNull();
    expect(next.mechanismIds).toEqual([]);
    expect(next.partInstanceId).toBeNull();
    expect(next.partInstanceIds).toEqual([]);
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
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 23, 30));
    const payload = buildEmptyWorkLogPayload(createBootstrap(), "student-1");
    expect(payload.date).toBe("2026-01-02");
    expect(payload.participantIds).toEqual(["student-1"]);
  });

  it("buildEmptyWorkLogPayload falls back to first member for invalid preferred id", () => {
    const payload = buildEmptyWorkLogPayload(createBootstrap(), "missing");
    expect(payload.participantIds).toEqual(["lead-1"]);
  });
});
