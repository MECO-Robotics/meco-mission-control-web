import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { readCssTree } from "@/testUtils/readCssTree";

export function readAppCss() {
  return readCssTree("src/app/App.css");
}

export function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    seasons: [
      {
        id: "season-1",
        name: "2026",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ],
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Ada",
        email: "ada@example.com",
        role: "lead",
        elevated: true,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drivebase",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [
      {
        id: "discipline-1",
        code: "design",
        name: "Design",
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        workstreamId: null,
        workstreamIds: [],
        title: "Frame rail layout",
        summary: "",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        disciplineId: "discipline-1",
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        targetMilestoneId: null,
        ownerId: "member-1",
        assigneeIds: ["member-1"],
        mentorId: null,
        startDate: "2026-04-06",
        dueDate: "2026-04-10",
        priority: "high",
        status: "in-progress",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 4,
        actualHours: 1,
        requiresDocumentation: false,
        documentationLinked: false,
      },
    ],
  };
}

export function createBootstrapWithEmptySubsystem(): BootstrapPayload {
  const bootstrap = createBootstrap();

  return {
    ...bootstrap,
    subsystems: [
      ...bootstrap.subsystems,
      {
        id: "subsystem-empty",
        projectId: "project-1",
        name: "Controls",
        description: "",
        iteration: 1,
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
  };
}

export function createBootstrapWithoutTasks(): BootstrapPayload {
  return {
    ...createBootstrap(),
    tasks: [],
  };
}

export function createTimelineMilestone(
  overrides: Partial<BootstrapPayload["milestones"][number]>,
): BootstrapPayload["milestones"][number] {
  return {
    id: "milestone-1",
    title: "Design review",
    type: "internal-review",
    startDateTime: "2026-04-08T09:00:00.000Z",
    endDateTime: null,
    isExternal: false,
    description: "",
    projectIds: ["project-1"],
    ...overrides,
  };
}

export function createBootstrapWithDependency(): BootstrapPayload {
  const bootstrap = createBootstrap();

  return {
    ...bootstrap,
    tasks: [
      ...bootstrap.tasks,
      {
        ...bootstrap.tasks[0],
        id: "task-2",
        title: "Bumper mount drill pattern",
        startDate: "2026-04-11",
        dueDate: "2026-04-14",
        status: "not-started",
        dependencyIds: ["dep-1"],
      },
    ],
    taskDependencies: [
      {
        id: "dep-1",
        taskId: "task-2",
        kind: "task",
        refId: "task-1",
        dependencyType: "hard",
        createdAt: "2026-04-01T00:00:00.000Z",
      },
    ],
  };
}

export function createBootstrapWithTaskRows(taskCount: number): BootstrapPayload {
  const bootstrap = createBootstrap();
  const baseTask = bootstrap.tasks[0];

  return {
    ...bootstrap,
    tasks: Array.from({ length: taskCount }, (_, index) => ({
      ...baseTask,
      id: `task-${index + 1}`,
      title: `Frame rail layout ${index + 1}`,
    })),
  };
}

export function createBootstrapWithScopedOverflowTasks(): BootstrapPayload {
  const bootstrap = createBootstrap();
  const baseTask = bootstrap.tasks[0];

  return {
    ...bootstrap,
    tasks: [
      {
        ...baseTask,
        id: "task-spills-left",
        title: "March carry-in",
        startDate: "2026-03-25",
        dueDate: "2026-04-03",
      },
      {
        ...baseTask,
        id: "task-spills-right",
        title: "May carry-out",
        startDate: "2026-04-28",
        dueDate: "2026-05-05",
      },
      {
        ...baseTask,
        id: "task-spills-both",
        title: "Full scoped span",
        startDate: "2026-03-25",
        dueDate: "2026-05-05",
      },
      {
        ...baseTask,
        id: "task-contained",
        title: "Contained scoped task",
        startDate: "2026-04-12",
        dueDate: "2026-04-14",
      },
    ],
  };
}

export const membersById = {
  "member-1": {
    id: "member-1",
    name: "Ada",
    email: "ada@example.com",
    role: "lead" as const,
    elevated: true,
    seasonId: "season-1",
  },
};
