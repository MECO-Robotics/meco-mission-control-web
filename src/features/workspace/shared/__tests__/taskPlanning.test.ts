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
  partInstances: [],
  events: [],
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
      status: "in-progress",
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
      dependencyIds: ["task-a"],
      blockers: ["Waiting on vendor shipment"],
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      estimatedHours: 4,
      actualHours: 0,
      requiresDocumentation: false,
      documentationLinked: false,
    },
  ],
  taskDependencies: [],
  taskBlockers: [],
  workLogs: [],
  purchaseItems: [],
  manufacturingItems: [],
} satisfies BootstrapPayload;

test("task planning helpers surface legacy dependency and blocker arrays", () => {
  const waitingOn = getTaskWaitingOnDependencies("task-b", bootstrap);
  const blocks = getTaskBlocksDependencies("task-a", bootstrap);
  const blockers = getTaskOpenBlockersForTask("task-b", bootstrap);

  expect(waitingOn).toHaveLength(1);
  expect(waitingOn[0]).toMatchObject({
    upstreamTaskId: "task-a",
    downstreamTaskId: "task-b",
    dependencyType: "finish_to_start",
  });

  expect(blocks).toHaveLength(1);
  expect(blocks[0]).toMatchObject({
    upstreamTaskId: "task-a",
    downstreamTaskId: "task-b",
    dependencyType: "finish_to_start",
  });

  expect(blockers).toHaveLength(1);
  expect(blockers[0]).toMatchObject({
    blockedTaskId: "task-b",
    blockerType: "external",
    description: "Waiting on vendor shipment",
    status: "open",
  });

  expect(getTaskPlanningState(bootstrap.tasks[1], bootstrap, new Date("2026-04-20T12:00:00Z"))).toBe(
    "blocked",
  );
});
