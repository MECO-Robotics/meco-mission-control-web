import {
  getTaskBlocksDependencies,
  getTaskOpenBlockersForTask,
  getTaskPlanningState,
  getTaskWaitingOnDependencies,
} from "../taskPlanning";
import type { BootstrapPayload } from "@/types";

const bootstrap = {
  seasons: [],
  projects: [],
  workstreams: [],
  members: [],
  subsystems: [],
  disciplines: [],
  mechanisms: [],
  materials: [],
  artifacts: [],
  partDefinitions: [],
  partInstances: [
    {
      id: "part-instance-1",
      subsystemId: "subsystem-1",
      mechanismId: null,
      partDefinitionId: "part-def-1",
      name: "Clamp",
      quantity: 1,
      trackIndividually: false,
      status: "available",
    },
  ],
  events: [
    {
      id: "event-1",
      title: "Milestone",
      type: "demo",
      startDateTime: "2026-04-20T12:00:00.000Z",
      endDateTime: null,
      isExternal: false,
      description: "",
      projectIds: ["project-1"],
      relatedSubsystemIds: [],
    },
  ],
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
      id: "task-a",
      projectId: "project-1",
      workstreamId: null,
      workstreamIds: [],
      title: "Upstream task",
      summary: "",
      subsystemId: "subsystem-1",
      subsystemIds: ["subsystem-1"],
      disciplineId: "discipline-1",
      mechanismId: null,
      mechanismIds: [],
      partInstanceId: null,
      partInstanceIds: [],
      targetEventId: null,
      ownerId: null,
      assigneeIds: [],
      mentorId: null,
      startDate: "2026-04-20",
      dueDate: "2026-04-21",
      priority: "medium",
      status: "complete",
      dependencyIds: [],
      blockers: [],
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      estimatedHours: 2,
      actualHours: 0,
      requiresDocumentation: false,
      documentationLinked: false,
    },
    {
      id: "task-b",
      projectId: "project-1",
      workstreamId: null,
      workstreamIds: [],
      title: "Downstream task",
      summary: "",
      subsystemId: "subsystem-1",
      subsystemIds: ["subsystem-1"],
      disciplineId: "discipline-1",
      mechanismId: null,
      mechanismIds: [],
      partInstanceId: null,
      partInstanceIds: [],
      targetEventId: null,
      ownerId: null,
      assigneeIds: [],
      mentorId: null,
      startDate: "2026-04-20",
      dueDate: "2026-04-22",
      priority: "medium",
      status: "not-started",
      dependencyIds: [],
      blockers: [],
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      estimatedHours: 4,
      actualHours: 0,
      requiresDocumentation: false,
      documentationLinked: false,
    },
  ],
  taskDependencies: [
    {
      id: "task-dependency-task",
      taskId: "task-b",
      kind: "task",
      refId: "task-a",
      requiredState: "complete",
      dependencyType: "hard",
      createdAt: "2026-04-20T00:00:00.000Z",
    },
    {
      id: "task-dependency-part",
      taskId: "task-b",
      kind: "part_instance",
      refId: "part-instance-1",
      requiredState: "installed",
      dependencyType: "hard",
      createdAt: "2026-04-20T00:00:00.000Z",
    },
    {
      id: "task-dependency-event",
      taskId: "task-b",
      kind: "event",
      refId: "event-1",
      requiredState: "complete",
      dependencyType: "soft",
      createdAt: "2026-04-20T00:00:00.000Z",
    },
  ],
  taskBlockers: [
    {
      id: "blocker-1",
      blockedTaskId: "task-b",
      blockerType: "external",
      blockerId: null,
      description: "Waiting on vendor shipment",
      severity: "medium",
      status: "open",
      createdByMemberId: null,
      createdAt: "2026-04-20T00:00:00.000Z",
      resolvedAt: null,
    },
  ],
  workLogs: [],
  purchaseItems: [],
  manufacturingItems: [],
} satisfies BootstrapPayload;

test("task planning helpers surface structured dependency records", () => {
  const waitingOn = getTaskWaitingOnDependencies("task-b", bootstrap);
  const blocks = getTaskBlocksDependencies("task-a", bootstrap);

  expect(waitingOn).toHaveLength(1);
  expect(waitingOn[0]).toMatchObject({
    taskId: "task-b",
    kind: "part_instance",
    refId: "part-instance-1",
    dependencyType: "hard",
  });

  expect(blocks).toHaveLength(1);
  expect(blocks[0]).toMatchObject({
    taskId: "task-b",
    kind: "task",
    refId: "task-a",
    dependencyType: "hard",
  });
});

test("task planning keeps manual blockers separate from dependency waiting state", () => {
  expect(getTaskOpenBlockersForTask("task-b", bootstrap)).toHaveLength(1);
  expect(getTaskPlanningState(bootstrap.tasks[1], bootstrap, new Date("2026-04-20T12:00:00Z"))).toBe(
    "blocked",
  );

  const noBlockerBootstrap = {
    ...bootstrap,
    taskBlockers: [],
    tasks: bootstrap.tasks.map((task) =>
      task.id === "task-b" ? { ...task, blockers: [] } : task,
    ),
  } satisfies BootstrapPayload;

  expect(getTaskPlanningState(noBlockerBootstrap.tasks[1], noBlockerBootstrap)).toBe(
    "waiting-on-dependency",
  );
});
