import {
  getTaskBlocksDependencies,
  getTaskOpenBlockersForTask,
  getTaskPlanningState,
} from "../task/taskPlanning";
import { getTaskDependencyTargetOptions } from "../task/taskTargeting";
import { IconMapPin, IconParts, IconTasks } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";

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
      status: "ready",
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Milestone",
      type: "demo",
      startDateTime: "2026-04-20T12:00:00.000Z",
      endDateTime: null,
      isExternal: false,
      description: "",
      projectIds: ["project-1"],
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
      targetMilestoneId: null,
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
      targetMilestoneId: null,
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
      requiredState: "ready",
      dependencyType: "hard",
      createdAt: "2026-04-20T00:00:00.000Z",
    },
    {
      id: "task-dependency-milestone",
      taskId: "task-b",
      kind: "milestone",
      refId: "milestone-1",
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
  const blocks = getTaskBlocksDependencies("task-a", bootstrap);

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
});

test("dependency targets expose semantic icons for dependency menus", () => {
  const taskOptions = getTaskDependencyTargetOptions("task", {
    tasksById: {
      taskA: {
        ...bootstrap.tasks[0],
        id: "taskA",
        title: "Task A",
      },
    },
    milestonesById: {},
    partInstancesById: {},
    partDefinitionsById: {},
    formatIterationVersion: () => "1",
  });
  const milestoneOptions = getTaskDependencyTargetOptions("milestone", {
    tasksById: {},
    milestonesById: {
      milestoneBlocked: {
        id: "milestoneBlocked",
        title: "Blocked",
        type: "demo",
        status: "blocked",
        startDateTime: "2026-04-20T12:00:00.000Z",
        endDateTime: null,
        isExternal: false,
        description: "",
        projectIds: [],
      },
      milestoneNotReady: {
        id: "milestoneNotReady",
        title: "Not Ready",
        type: "demo",
        status: "not ready",
        startDateTime: "2026-04-20T12:00:00.000Z",
        endDateTime: null,
        isExternal: false,
        description: "",
        projectIds: [],
      },
      milestoneQa: {
        id: "milestoneQa",
        title: "QA",
        type: "demo",
        status: "qa",
        startDateTime: "2026-04-20T12:00:00.000Z",
        endDateTime: null,
        isExternal: false,
        description: "",
        projectIds: [],
      },
      milestoneReady: {
        id: "milestoneReady",
        title: "Ready",
        type: "demo",
        status: "ready",
        startDateTime: "2026-04-20T12:00:00.000Z",
        endDateTime: null,
        isExternal: false,
        description: "",
        projectIds: [],
      },
    },
    partInstancesById: {},
    partDefinitionsById: {},
    formatIterationVersion: () => "1",
  });

  const partOptions = getTaskDependencyTargetOptions("part_instance", {
    tasksById: {},
    milestonesById: {},
    partInstancesById: {
      partBlocked: {
        id: "partBlocked",
        subsystemId: "subsystem-1",
        mechanismId: null,
        partDefinitionId: "part-def-1",
        name: "Blocked part",
        quantity: 1,
        trackIndividually: false,
        status: "blocked",
      },
      partNotReady: {
        id: "partNotReady",
        subsystemId: "subsystem-1",
        mechanismId: null,
        partDefinitionId: "part-def-1",
        name: "Not ready part",
        quantity: 1,
        trackIndividually: false,
        status: "not ready",
      },
      partQa: {
        id: "partQa",
        subsystemId: "subsystem-1",
        mechanismId: null,
        partDefinitionId: "part-def-1",
        name: "QA part",
        quantity: 1,
        trackIndividually: false,
        status: "qa",
      },
      partReady: {
        id: "partReady",
        subsystemId: "subsystem-1",
        mechanismId: null,
        partDefinitionId: "part-def-1",
        name: "Ready part",
        quantity: 1,
        trackIndividually: false,
        status: "ready",
      },
    },
    partDefinitionsById: {
      "part-def-1": {
        id: "part-def-1",
        seasonId: "season-1",
        name: "Part def",
        partNumber: "P-1",
        revision: "A",
        iteration: 1,
        type: "part",
        source: "internal",
        materialId: null,
        description: "",
      },
    },
    formatIterationVersion: () => "1",
  });

  expect((taskOptions[0].icon as { type?: unknown } | null)?.type).toBe(IconTasks);
  expect(milestoneOptions.every((option) => (option.icon as { type?: unknown } | null)?.type === IconMapPin)).toBe(
    true,
  );
  expect(partOptions.every((option) => (option.icon as { type?: unknown } | null)?.type === IconParts)).toBe(true);
});

test("task planning accepts milestone and part-instance qa states as satisfied dependency targets", () => {
  const qaBootstrap = {
    ...bootstrap,
    milestones: [
      {
        ...bootstrap.milestones[0],
        status: "qa" as const,
      },
    ],
    partInstances: [
      {
        ...bootstrap.partInstances[0],
        status: "qa" as const,
      },
    ],
    taskDependencies: bootstrap.taskDependencies.map((dependency) => {
      if (dependency.id === "task-dependency-part") {
        return {
          ...dependency,
          requiredState: "qa",
        };
      }

      if (dependency.id === "task-dependency-milestone") {
        return {
          ...dependency,
          dependencyType: "hard" as const,
          requiredState: "qa",
        };
      }

      return dependency;
    }),
    taskBlockers: [],
  } satisfies BootstrapPayload;

  expect(getTaskPlanningState(qaBootstrap.tasks[1], qaBootstrap, new Date("2026-04-20T12:00:00Z"))).toBe(
    "ready",
  );
});
