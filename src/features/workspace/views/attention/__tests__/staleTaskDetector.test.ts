/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";
import { buildTaskLastUpdatedAtById } from "../attentionActionNowShared";
import { buildAttentionViewModel } from "../attentionViewModel";
import { detectStaleTasks } from "../staleTaskDetector";

const TODAY = new Date("2026-06-04T12:00:00.000Z");

function createTask(
  id: string,
  overrides: Partial<TaskRecord> = {},
): TaskRecord {
  const status = overrides.status ?? "not-started";

  return {
    actualHours: 0,
    artifactId: null,
    artifactIds: [],
    assigneeIds: ["member-1"],
    blockers: [],
    dependencyIds: [],
    disciplineId: "discipline-1",
    documentationLinked: false,
    dueDate: "2026-06-30",
    estimatedHours: 1,
    id,
    isBlocked: false,
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    mechanismId: null,
    mechanismIds: [],
    mentorId: null,
    ownerId: "member-1",
    partInstanceId: null,
    partInstanceIds: [],
    planningState: "ready",
    priority: "medium",
    projectId: "project-1",
    requiresDocumentation: false,
    startDate: "2026-05-01",
    status: status as TaskStatus,
    subsystemId: "subsystem-1",
    subsystemIds: ["subsystem-1"],
    summary: "",
    targetMilestoneId: null,
    title: id,
    workstreamId: "workstream-1",
    workstreamIds: ["workstream-1"],
    ...overrides,
  };
}

function createBootstrap(tasks: TaskRecord[]): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    members: [
      {
        email: "avery@example.test",
        elevated: false,
        id: "member-1",
        name: "Avery",
        role: "student",
        seasonId: "season-1",
      },
    ],
    projects: [
      {
        description: "",
        id: "project-1",
        name: "Robot",
        projectType: "robot",
        seasonId: "season-1",
        status: "active",
      },
    ],
    subsystems: [
      {
        description: "",
        id: "subsystem-1",
        isCore: true,
        iteration: 1,
        mentorIds: [],
        name: "Drive",
        parentSubsystemId: null,
        projectId: "project-1",
        responsibleEngineerId: null,
        risks: [],
      },
    ],
    tasks,
    workstreams: [
      {
        description: "",
        id: "workstream-1",
        name: "Build",
        projectId: "project-1",
      },
    ],
  };
}

describe("detectStaleTasks", () => {
  it("detects configurable no-update thresholds from derived task activity", () => {
    const task = createTask("task-no-update", { startDate: "2026-05-29" });
    const bootstrap = createBootstrap([task]);
    const lastUpdatedAtById = buildTaskLastUpdatedAtById(bootstrap);

    expect(
      detectStaleTasks({
        taskLastUpdatedAtById: lastUpdatedAtById,
        tasks: bootstrap.tasks,
        thresholds: { noUpdateDays: 7 },
        today: TODAY,
      }),
    ).toHaveLength(0);

    expect(
      detectStaleTasks({
        taskLastUpdatedAtById: lastUpdatedAtById,
        tasks: bootstrap.tasks,
        thresholds: { noUpdateDays: 5 },
        today: TODAY,
      })[0],
    ).toMatchObject({
      issueTypes: ["no-update"],
      primaryIssue: "no-update",
      task: { id: "task-no-update" },
    });
  });

  it("detects in-progress, waiting QA, and blocked tasks crossing their thresholds", () => {
    const inProgressTask = createTask("task-in-progress", {
      startDate: "2026-05-20",
      status: "in-progress",
    });
    const waitingQaTask = createTask("task-waiting-qa", {
      startDate: "2026-06-01",
      status: "waiting-for-qa",
    });
    const blockedTask = createTask("task-blocked", {
      isBlocked: true,
      planningState: "blocked",
      startDate: "2026-06-01",
      status: "in-progress",
    });
    const bootstrap: BootstrapPayload = {
      ...createBootstrap([inProgressTask, waitingQaTask, blockedTask]),
      taskBlockers: [
        {
          blockedTaskId: "task-blocked",
          blockerId: null,
          blockerType: "other",
          createdAt: "2026-05-30T00:00:00.000Z",
          createdByMemberId: null,
          description: "Waiting on shop access",
          id: "blocker-1",
          resolvedAt: null,
          severity: "medium",
          status: "open",
        },
      ],
    };

    const results = detectStaleTasks({
      taskBlockers: bootstrap.taskBlockers,
      taskLastUpdatedAtById: buildTaskLastUpdatedAtById(bootstrap),
      tasks: bootstrap.tasks,
      thresholds: {
        blockedDays: 4,
        inProgressDays: 10,
        noUpdateDays: 30,
        waitingQaDays: 3,
      },
      today: TODAY,
    });

    expect(Object.fromEntries(results.map((result) => [result.task.id, result.issueTypes]))).toEqual({
      "task-blocked": ["blocked-too-long"],
      "task-in-progress": ["in-progress-too-long"],
      "task-waiting-qa": ["waiting-qa-too-long"],
    });
  });

  it("treats fresh normalized task blockers as task activity for no-update checks", () => {
    const task = createTask("task-with-fresh-blocker", {
      startDate: "2026-05-01",
      status: "not-started",
    });
    const bootstrap: BootstrapPayload = {
      ...createBootstrap([task]),
      taskBlockers: [
        {
          blockedTaskId: task.id,
          blockerId: null,
          blockerType: "other",
          createdAt: "2026-06-04T09:00:00.000Z",
          createdByMemberId: null,
          description: "New mentor decision needed",
          id: "blocker-fresh",
          resolvedAt: null,
          severity: "medium",
          status: "open",
        },
      ],
    };

    expect(
      detectStaleTasks({
        taskBlockers: bootstrap.taskBlockers,
        taskLastUpdatedAtById: buildTaskLastUpdatedAtById(bootstrap),
        tasks: bootstrap.tasks,
        thresholds: { noUpdateDays: 5 },
        today: TODAY,
      }),
    ).toHaveLength(0);
  });
});

describe("stale task Action Required surfacing", () => {
  it("surfaces stale tasks in Flow summary, triage, and action-now results", () => {
    const bootstrap = createBootstrap([
      createTask("task-stale", {
        startDate: "2026-05-20",
        status: "not-started",
        title: "Update elevator task",
      }),
      createTask("task-in-progress", {
        startDate: "2026-05-20",
        status: "in-progress",
        title: "Finish intake assembly",
      }),
    ]);

    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap,
    });

    expect(
      viewModel.summaryGroups
        .flatMap((group) => group.cards)
        .find((card) => card.id === "stale-tasks"),
    ).toMatchObject({ label: "Stale tasks", value: 2 });
    expect(viewModel.triageGroups.find((group) => group.id === "stale-tasks")?.items).toHaveLength(2);
    expect(viewModel.actionNowItems.map((item) => item.recordId)).toEqual(
      expect.arrayContaining(["task-stale", "task-in-progress"]),
    );
  });
});
