import { getTaskDependencyTargetOptions, getTaskPartInstanceLabel } from "../task/taskTargeting";
import { IconMapPin, IconParts, IconTasks } from "@/components/shared/Icons";
import { bootstrap } from "./taskPlanningFixture";

test("part instance labels include a selected definition and fall back when it is missing", () => {
  const partInstance = bootstrap.partInstances[0];
  const formatVersion = (value: number | null | undefined) => `v${value ?? "?"}`;

  expect(
    getTaskPartInstanceLabel(
      partInstance,
      {
        "part-def-1": {
          id: "part-def-1",
          seasonId: "season-1",
          name: "Clamp body",
          partNumber: "P-1",
          revision: "A",
          iteration: 2,
          type: "part",
          source: "internal",
          materialId: null,
          description: "",
        },
      },
      formatVersion,
    ),
  ).toBe("Clamp (Clamp body (v2))");
  expect(getTaskPartInstanceLabel(partInstance, {}, formatVersion)).toBe("Clamp");
});

test("dependency targets expose semantic icons for dependency menus", () => {
  const taskOptions = getTaskDependencyTargetOptions("work_item", {
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
