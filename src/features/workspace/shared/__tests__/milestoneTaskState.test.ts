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
    workstreamIds: [],
    subsystemIds: ["subsystem-1"],
    workTypeId: "work-type-design",
    responsibleGroupId: null,
    mechanismIds: [],
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
    scheduleRefs: [{ kind: "milestone", id: milestoneId }],
    requestedById: null,

    isBlocked: false,
    checklistItems: [],
    manufacturingDetails: null,
    estimatedHours: 0,
    actualHours: 0,
    requiresDocumentation: false,
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
      status: "planned",
      seasonId: "season-1",
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: null,
      description: "",
      projectIds: ["project-1"],
    },
  ],
  subsystems = [],
  artifacts = [],
  milestoneRequirements = [],
  taskDependencies = [],
  risks = [],
}: {
  tasks: TaskRecord[];
  milestones?: MilestoneRecord[];
  subsystems?: BootstrapPayload["subsystems"];
  artifacts?: BootstrapPayload["artifacts"];
  milestoneRequirements?: MilestoneRequirementRecord[];
  taskDependencies?: BootstrapPayload["taskDependencies"];
  risks?: BootstrapPayload["risks"];
}): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    milestones,
    subsystems,
    artifacts,
    milestoneRequirements,
    tasks,
    taskDependencies,
    risks,
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
      risks: [{
        id: "risk-1", projectId: "project-1", title: "Waiting", detail: "Waiting on hardware",
        category: "inventory" as const, severity: "medium" as const, status: "open" as const,
        blocksWork: true, source: { kind: "manual" as const },
        relatedTargets: [{ kind: "task" as const, id: "task-2" }], mitigationTaskId: null,
        ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", resolvedAt: null,
      }],
      expected: "blocked",
      tasks: [
        createTask("task-1", "in-progress", "milestone-1"),
        createTask("task-2", "not-started", "milestone-1", {
        }),
      ],
    },
  ])("returns $expected for $name milestone states", ({ expected, tasks, taskDependencies, risks }) => {
    const bootstrap = createBootstrap({ tasks, taskDependencies: taskDependencies ?? [], risks });
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
      status: "planned",
      seasonId: "season-1",
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: null,
      description: "",
      projectIds: ["project-1"],
    };
    const milestoneRequirements: MilestoneRequirementRecord[] = [
      {
        id: "milestone-iteration:requirement:1",
        milestoneId: "milestone-iteration",
        targetRefs: [{ kind: "subsystem", id: "subsystem-iteration" }],
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
      },
    ] satisfies BootstrapPayload["subsystems"];
    const bootstrap = createBootstrap({
      tasks: [
        createTask("task-1", "in-progress", "milestone-iteration", {
          scheduleRefs: [],
          subsystemIds: ["subsystem-iteration"],
        }),
        createTask("task-2", "not-started", "milestone-iteration", {
          scheduleRefs: [],
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

  it("matches workflow-state requirements through typed artifact targets", () => {
    const milestone: MilestoneRecord = {
      id: "milestone-artifact-state", title: "Evidence milestone", type: "deadline", status: "planned",
      seasonId: "season-1", startAt: "2026-01-01T00:00:00.000Z", endAt: null, description: "", projectIds: ["project-1"],
    };
    const task = createTask("task-evidence", "in-progress", milestone.id, { scheduleRefs: [], subsystemIds: [] });
    const bootstrap = createBootstrap({
      tasks: [task],
      milestones: [milestone],
      artifacts: [{
        id: "artifact-published", projectId: "project-1", targetRefs: [{ kind: "task", id: task.id }],
        kind: "document", title: "Build evidence", summary: "", status: "published", uri: "https://example.test/evidence", updatedAt: "2026-01-01T00:00:00.000Z",
      }],
      milestoneRequirements: [{
        id: "requirement-published", milestoneId: milestone.id,
        targetRefs: [{ kind: "artifact", id: "artifact-published" }], conditionType: "workflow-state",
        conditionValue: "state=COMPLETE", required: true, sortOrder: 1, notes: "",
      }],
    });

    expect(getMilestoneTasksForState(milestone, bootstrap).map(({ id }) => id)).toEqual([task.id]);
  });
});
