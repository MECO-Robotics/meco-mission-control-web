/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import {
  WORKLOG_ACTIVE_BOARD_COLUMNS,
  groupActiveWorklogCards,
} from "@/features/workspace/views/workLogs/workLogsActiveBoard";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord, WorkLogRecord } from "@/types/recordsExecution";

const student = {
  email: "student@meco.dev",
  elevated: false,
  id: "student-1",
  name: "Student One",
  role: "student" as const,
  seasonId: "season-1",
};

const secondStudent = {
  email: "second@meco.dev",
  elevated: false,
  id: "student-2",
  name: "Student Two",
  role: "student" as const,
  seasonId: "season-1",
};

function buildTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    actualHours: 0,
    artifactId: null,
    artifactIds: [],
    assigneeIds: [],
    blockers: [],
    dependencyIds: [],
    disciplineId: "discipline-1",
    documentationLinked: false,
    dueDate: "2026-05-10",
    estimatedHours: 4,
    id: "task-1",
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    mechanismId: null,
    mechanismIds: [],
    mentorId: null,
    ownerId: null,
    partInstanceId: null,
    partInstanceIds: [],
    priority: "medium",
    projectId: "project-1",
    requiresDocumentation: false,
    startDate: "2026-05-01",
    status: "in-progress",
    subsystemId: "subsystem-1",
    subsystemIds: ["subsystem-1"],
    summary: "",
    targetMilestoneId: null,
    title: "Drive CAD",
    workstreamId: null,
    workstreamIds: [],
    ...overrides,
  };
}

function buildWorkLog(overrides: Partial<WorkLogRecord> = {}): WorkLogRecord {
  return {
    date: "2026-05-01",
    hours: 1,
    id: "worklog-1",
    notes: "Initial update",
    participantIds: ["student-1"],
    taskId: "task-1",
    ...overrides,
  };
}

function buildBootstrap(overrides: Partial<BootstrapPayload> = {}): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    members: [student, secondStudent],
    projects: [
      {
        description: "",
        id: "project-1",
        name: "Robot",
        projectType: "robot",
        seasonId: "season-1",
        status: "active",
      },
      {
        description: "",
        id: "project-paused",
        name: "Paused project",
        projectType: "robot",
        seasonId: "season-1",
        status: "paused",
      },
    ],
    ...overrides,
  };
}

describe("workLogsActiveBoard", () => {
  it("groups cards by operational state and keeps need help as a flag", () => {
    const bootstrap = buildBootstrap({
      taskBlockers: [
        {
          blockedTaskId: "task-blocked",
          blockerId: null,
          blockerType: "external",
          createdAt: "2026-05-03T00:00:00.000Z",
          createdByMemberId: null,
          description: "Waiting on motor controller",
          id: "blocker-1",
          resolvedAt: null,
          severity: "high",
          status: "open",
        },
      ],
      tasks: [
        buildTask({
          id: "task-active",
          status: "in-progress",
          title: "Tune drivetrain",
        }),
        buildTask({
          id: "task-paused",
          projectId: "project-paused",
          status: "in-progress",
          title: "Paused intake",
        }),
        buildTask({
          id: "task-blocked",
          status: "in-progress",
          title: "Wire motor controller",
        }),
        buildTask({
          id: "task-qa",
          status: "waiting-for-qa",
          title: "Review shooter",
        }),
        buildTask({
          id: "task-closed",
          status: "complete",
          title: "Close climber",
        }),
      ],
      workLogs: [
        buildWorkLog({
          date: "2026-05-02",
          hours: 1,
          id: "worklog-active-old",
          notes: "Wiring started",
          taskId: "task-active",
        }),
        buildWorkLog({
          date: "2026-05-04",
          hours: 1.5,
          id: "worklog-active-new",
          notes: "Need help tuning PID",
          taskId: "task-active",
        }),
        buildWorkLog({ id: "worklog-paused", taskId: "task-paused" }),
        buildWorkLog({ id: "worklog-blocked", taskId: "task-blocked" }),
        buildWorkLog({ id: "worklog-qa", taskId: "task-qa" }),
        buildWorkLog({ id: "worklog-closed", taskId: "task-closed" }),
      ],
    });

    const board = groupActiveWorklogCards({
      activePersonFilter: [],
      bootstrap,
      membersById: {
        "student-1": student,
        "student-2": secondStudent,
      },
      search: "",
    });

    expect(WORKLOG_ACTIVE_BOARD_COLUMNS.map((column) => column.state)).toEqual([
      "active",
      "paused",
      "blocked",
      "waiting-qa",
      "closed",
    ]);
    expect(board.itemsByState.active.map((card) => card.task?.id)).toEqual(["task-active"]);
    expect(board.itemsByState.paused.map((card) => card.task?.id)).toEqual(["task-paused"]);
    expect(board.itemsByState.blocked.map((card) => card.task?.id)).toEqual(["task-blocked"]);
    expect(board.itemsByState["waiting-qa"].map((card) => card.task?.id)).toEqual(["task-qa"]);
    expect(board.itemsByState.closed.map((card) => card.task?.id)).toEqual(["task-closed"]);

    expect(board.itemsByState.active[0]).toMatchObject({
      blockerLabel: "No blocker",
      elapsedLabel: "2.5h elapsed",
      needsHelp: true,
      recentActivityLabel: "Recent: May 4 - Need help tuning PID",
      studentLabel: "Student One",
      taskLabel: "Tune drivetrain",
    });
    expect(board.itemsByState.blocked[0].blockerLabel).toBe(
      "Blocked: Waiting on motor controller",
    );
  });

  it("filters grouped cards by student and search text", () => {
    const bootstrap = buildBootstrap({
      tasks: [
        buildTask({
          id: "task-drive",
          title: "Drive gearbox",
        }),
        buildTask({
          id: "task-arm",
          title: "Arm gearbox",
        }),
      ],
      workLogs: [
        buildWorkLog({
          id: "worklog-drive",
          notes: "Gear mesh complete",
          participantIds: ["student-1"],
          taskId: "task-drive",
        }),
        buildWorkLog({
          id: "worklog-arm",
          notes: "Arm ratio review",
          participantIds: ["student-2"],
          taskId: "task-arm",
        }),
      ],
    });

    const board = groupActiveWorklogCards({
      activePersonFilter: ["student-2"],
      bootstrap,
      membersById: {
        "student-1": student,
        "student-2": secondStudent,
      },
      search: "ratio",
    });

    expect(board.itemsByState.active.map((card) => card.taskLabel)).toEqual(["Arm gearbox"]);
  });
});
