import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { MaterialRecord, PartDefinitionRecord, PartInstanceRecord } from "@/types/recordsInventory";
import type { ProjectRecord, SubsystemRecord, WorkstreamRecord } from "@/types/recordsOrganization";

function createProject(overrides: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: "project-a",
    seasonId: "season-2026",
    name: "Robot",
    projectType: "robot",
    description: "Main robot build",
    status: "active",
    ...overrides,
  };
}

function createWorkstream(overrides: Partial<WorkstreamRecord>): WorkstreamRecord {
  return {
    id: "workstream-a",
    projectId: "project-a",
    name: "Drivetrain",
    description: "Drive work",
    ...overrides,
  };
}

export function createSubsystem(overrides: Partial<SubsystemRecord> = {}): SubsystemRecord {
  return {
    id: "subsystem-core",
    projectId: "project-a",
    name: "Drive",
    description: "",
    iteration: 1,
    isCore: true,
    parentSubsystemId: null,
    responsibleEngineerId: null,
    mentorIds: [],
    layoutX: null,
    layoutY: null,
    layoutZone: "unplaced",
    layoutView: "top",
    sortOrder: null,
    ...overrides,
  };
}

export function createMaterial(overrides: Partial<MaterialRecord> = {}): MaterialRecord {
  return {
    id: "material-aluminum",
    name: "Aluminum 6061",
    category: "metal",
    unit: "bar",
    onHandQuantity: 4,
    reorderPoint: 1,
    location: "Rack",
    preferredVendorId: null,
    notes: "",
    ...overrides,
  };
}

export function createPartDefinition(overrides: Partial<PartDefinitionRecord> = {}): PartDefinitionRecord {
  return {
    id: "part-def-1",
    seasonId: "season-2026",
    name: "Bearing Block",
    partNumber: "BB-001",
    revision: "A",
    iteration: 1,
    type: "custom",
    defaultAcquisitionMethod: "manufacture",
    materialId: null,
    description: "",
    ...overrides,
  };
}

export function createPartInstance(overrides: Partial<PartInstanceRecord> = {}): PartInstanceRecord {
  return {
    id: "part-instance-1",
    intendedSubsystemId: "subsystem-core",
    intendedMechanismId: "mechanism-1",
    partDefinitionId: "part-def-1",
    location: { kind: "installed", subsystemId: "subsystem-core", mechanismId: "mechanism-1" },
    ...overrides,
  };
}

function createMilestone(overrides: Partial<MilestoneRecord>): MilestoneRecord {
  return {
    id: "milestone-1",
    seasonId: "season-2026",
    title: "Regional",
    type: "competition",
    status: "planned",
    startAt: "2026-03-10T14:00:00.000Z",
    endAt: null,
    description: "",
    projectIds: ["project-a"],
    ...overrides,
  };
}

export function createBootstrap(overrides: Partial<BootstrapPayload> = {}): BootstrapPayload {
  const projectA = createProject({});
  const projectB = createProject({
    id: "project-b",
    name: "Outreach",
    projectType: "outreach",
    description: "Outreach work",
  });

  const workstreamA = createWorkstream({});
  const workstreamB = createWorkstream({
    id: "workstream-b",
    projectId: projectB.id,
    name: "Media",
    description: "Media work",
  });

  const partDefinition = createPartDefinition({});
  const milestone = createMilestone({});
  const partInstance = createPartInstance({
    partDefinitionId: partDefinition.id,
    intendedSubsystemId: "subsystem-core",
    intendedMechanismId: "mechanism-1",
  });

  const base: BootstrapPayload = {
    seasons: [
      {
        id: "season-2026",
        teamId: "team-1",
        name: "2026 Season",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-04-30",
      },
    ],
    projects: [projectA, projectB],
    workTypes: [
      { id: "robot:design", projectType: "robot", code: "design", name: "Design", isActive: true },
      { id: "outreach:planning", projectType: "outreach", code: "planning", name: "Planning", isActive: true },
    ],
    responsibleGroups: [],
    workstreams: [workstreamA, workstreamB],
    vendors: [],
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
      createSubsystem({}),
      createSubsystem({
        id: "subsystem-secondary",
        projectId: projectA.id,
        name: "Shooter",
        isCore: false,
      }),
    ],
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
    milestones: [milestone],
    reports: [],
    qaRequests: [],
    designIterations: [],
    risks: [],
    tasks: [
      {
        id: "task-1",
        projectId: projectA.id,
        workTypeId: "robot:design",
        responsibleGroupId: null,
        workstreamIds: [workstreamA.id],
        title: "Initial task",
        summary: "",
        subsystemIds: ["subsystem-core"],
        mechanismIds: [],
        partInstanceIds: [],
        scheduleRefs: [],
        requestedById: null,
        ownerId: null,
        assigneeIds: [],
        mentorId: null,
        startDate: "2026-02-01",
        dueDate: "2026-02-01",
        priority: "medium",
        status: "not-started",

        manufacturingDetails: null,
        checklistItems: [],
        estimatedHours: 2,
        actualHours: 0,
        requiresDocumentation: false,
      },
    ],
    workLogs: [],
    purchaseItems: [],
    manufacturingProcesses: [],
    taskDependencies: [],
    events: [],
    meetings: [],
    attendanceRecords: [],
    milestoneRequirements: [],
    qaFindings: [],
    testFindings: [],
    testResults: [],
    ...overrides,
  };

  return {
    ...base,
    ...overrides,
    qaRequests: overrides.qaRequests ?? base.qaRequests,
  };
}
