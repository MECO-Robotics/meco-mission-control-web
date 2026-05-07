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
    risks: [],
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
    vendor: "",
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
    source: "in-house",
    materialId: null,
    description: "",
    ...overrides,
  };
}

export function createPartInstance(overrides: Partial<PartInstanceRecord> = {}): PartInstanceRecord {
  return {
    id: "part-instance-1",
    subsystemId: "subsystem-core",
    mechanismId: "mechanism-1",
    partDefinitionId: "part-def-1",
    name: "Left Bearing Block",
    quantity: 1,
    trackIndividually: false,
    status: "not ready",
    ...overrides,
  };
}

function createMilestone(overrides: Partial<MilestoneRecord>): MilestoneRecord {
  return {
    id: "milestone-1",
    title: "Regional",
    type: "competition",
    startDateTime: "2026-03-10T14:00:00.000Z",
    endDateTime: null,
    isExternal: true,
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
    mechanismId: "mechanism-1",
    partDefinitionId: partDefinition.id,
    subsystemId: "subsystem-core",
    name: "Left Bearing Block",
  });

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
      createSubsystem({}),
      createSubsystem({
        id: "subsystem-secondary",
        projectId: projectA.id,
        name: "Shooter",
        isCore: false,
      }),
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
    milestones: [milestone],
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
        targetMilestoneId: null,
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
    ...overrides,
  };

  return {
    ...base,
    ...overrides,
  };
}
