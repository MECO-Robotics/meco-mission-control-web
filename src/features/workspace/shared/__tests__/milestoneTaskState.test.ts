import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, MilestoneRequirementRecord, TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { getMilestoneTaskBoardState, getMilestoneTaskBoardStateForMilestone, getMilestoneTaskBoardStateIconStatus, getMilestoneTaskBoardStateLabel, getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";

function createTask(
  id: string,
  status: TaskRecord["status"],
  milestoneId: string,
  overrides: Partial<TaskRecord> = {},
): TaskRecord {
  return {
    id,
    projectId: "project-1",
    workstreamId: null,
    workstreamIds: [],
    subsystemId: "subsystem-1",
    subsystemIds: ["subsystem-1"],
    disciplineId: "discipline-1",
    mechanismId: null,
    mechanismIds: [],
    partInstanceId: null,
    partInstanceIds: [],
    title: id,
    summary: id,
    status,
    ownerId: null,
    assigneeIds: [],
    mentorId: null,
    startDate: "2026-01-01",
    dueDate: "2026-01-02",
    priority: "medium",
    targetMilestoneId: milestoneId,
    dependencyIds: [],
    blockers: [],
    isBlocked: false,
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    estimatedHours: 0,
    actualHours: 0,
    requiresDocumentation: false,
    documentationLinked: false,
    ...overrides,
  };
}

function createBootstrap({
  tasks,
  milestones = [
    {
      id: "milestone-1",
      title: "Milestone 1",
      type: "deadline",
      status: "not ready",
      startDateTime: "2026-01-01T00:00:00.000Z",
      endDateTime: null,
      isExternal: false,
      description: "",
      projectIds: ["project-1"],
    },
  ],
  subsystems = [],
  milestoneRequirements = [],
  taskDependencies = [],
  taskBlockers = [],
}: {
  tasks: TaskRecord[];
  milestones?: MilestoneRecord[];
  subsystems?: BootstrapPayload["subsystems"];
  milestoneRequirements?: MilestoneRequirementRecord[];
  taskDependencies?: BootstrapPayload["taskDependencies"];
  taskBlockers?: BootstrapPayload["taskBlockers"];
}): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    milestones,
    subsystems,
    milestoneRequirements,
    tasks,
    taskDependencies,
    taskBlockers,
  };
}

describe("milestoneTaskState", () => {
  it.each([
    {
      name: "not-started",
      expected: "not-started",
      tasks: [createTask("task-1", "not-started", "milestone-1")],
    },
    {
      name: "complete",
      expected: "complete",
      tasks: [
        createTask("task-1", "complete", "milestone-1"),
        createTask("task-2", "complete", "milestone-1"),
      ],
    },
    {
      name: "waiting-for-qa",
      expected: "waiting-for-qa",
      tasks: [
        createTask("task-1", "complete", "milestone-1"),
        createTask("task-2", "waiting-for-qa", "milestone-1"),
      ],
    },
    {
      name: "waiting-on-dependency",
      expected: "waiting-on-dependency",
      tasks: [
        createTask("task-1", "not-started", "milestone-1"),
        createTask("task-2", "not-started", "milestone-1"),
      ],
      taskDependencies: [
        {
          id: "task-2:dependency:1",
          taskId: "task-2",
          kind: "task" as const,
          refId: "task-1",
          requiredState: "complete",
          dependencyType: "hard" as const,
          createdAt: "2026-01-01T00:00:00.000Z",
        } satisfies TaskDependencyRecord,
      ] as TaskDependencyRecord[],
    },
    {
      name: "in-progress",
      expected: "in-progress",
      tasks: [
        createTask("task-1", "in-progress", "milestone-1"),
        createTask("task-2", "not-started", "milestone-1"),
      ],
    },
    {
      name: "blocked",
      expected: "blocked",
      tasks: [
        createTask("task-1", "in-progress", "milestone-1"),
        createTask("task-2", "not-started", "milestone-1", {
          blockers: ["Waiting on hardware"],
        }),
      ],
    },
  ])("returns $expected for $name milestone states", ({ expected, tasks, taskDependencies }) => {
    const bootstrap = createBootstrap({ tasks, taskDependencies: taskDependencies ?? [] });
    const state = getMilestoneTaskBoardState(tasks, bootstrap);

    expect(state).toBe(expected);
    expect(getMilestoneTaskBoardStateLabel(state)).toBe(
      expected === "not-started"
        ? "Not started"
        : expected === "in-progress"
          ? "In progress"
          : expected === "blocked"
            ? "Blocked"
            : expected === "waiting-on-dependency"
              ? "Waiting on dependency"
              : expected === "waiting-for-qa"
                ? "Waiting for QA"
                : "Complete",
    );
    expect(getMilestoneTaskBoardStateIconStatus(state)).toBe(
      expected === "blocked" || expected === "waiting-on-dependency" ? "not-started" : expected,
    );
  });

  it("includes iteration-scoped tasks when resolving a milestone", () => {
    const milestone: MilestoneRecord = {
      id: "milestone-iteration",
      title: "Iteration milestone",
      type: "deadline",
      status: "not ready",
      startDateTime: "2026-01-01T00:00:00.000Z",
      endDateTime: null,
      isExternal: false,
      description: "",
      projectIds: ["project-1"],
    };
    const milestoneRequirements: MilestoneRequirementRecord[] = [
      {
        id: "milestone-iteration:requirement:1",
        milestoneId: "milestone-iteration",
        targetType: "subsystem",
        targetId: "subsystem-iteration",
        conditionType: "iteration",
        conditionValue: "iteration = 3",
        required: true,
        sortOrder: 1,
        notes: "",
      },
    ];
    const subsystems = [
      {
        id: "subsystem-iteration",
        projectId: "project-1",
        name: "Iteration subsystem",
        description: "",
        iteration: 3,
        isArchived: false,
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
      {
        id: "subsystem-other",
        projectId: "project-1",
        name: "Other subsystem",
        description: "",
        iteration: 1,
        isArchived: false,
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ] satisfies BootstrapPayload["subsystems"];
    const bootstrap = createBootstrap({
      tasks: [
        createTask("task-1", "in-progress", "milestone-iteration", {
          targetMilestoneId: null,
          subsystemId: "subsystem-iteration",
          subsystemIds: ["subsystem-iteration"],
        }),
        createTask("task-2", "not-started", "milestone-iteration", {
          targetMilestoneId: null,
          subsystemId: "subsystem-other",
          subsystemIds: ["subsystem-other"],
        }),
      ],
      milestones: [milestone],
      milestoneRequirements,
      subsystems,
    });

    expect(getMilestoneTasksForState(milestone, bootstrap).map((task) => task.id)).toEqual([
      "task-1",
    ]);
    expect(getMilestoneTaskBoardStateForMilestone(milestone, bootstrap)).toBe("in-progress");
  });
});
