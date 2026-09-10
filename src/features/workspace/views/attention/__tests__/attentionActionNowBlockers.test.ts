/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskBlockerType } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";
import { buildAttentionViewModel } from "../attentionViewModel";

function createTask(id: string, title: string): TaskRecord {
  return {
    id,
    projectId: "project-1",
    workstreamId: "workstream-1",
    workstreamIds: ["workstream-1"],
    title,
    summary: "",
    subsystemId: "subsystem-1",
    subsystemIds: ["subsystem-1"],
    disciplineId: "discipline-1",
    mechanismId: null,
    mechanismIds: [],
    partInstanceId: null,
    partInstanceIds: [],
    artifactId: null,
    artifactIds: [],
    targetMilestoneId: null,
    ownerId: "member-1",
    assigneeIds: ["member-1"],
    mentorId: null,
    startDate: "2026-01-01",
    dueDate: "2026-06-30",
    priority: "medium",
    status: "in-progress",
    planningState: "blocked",

    blockers: [],
    isBlocked: true,
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    estimatedHours: 2,
    actualHours: 0,
    requiresDocumentation: false,
    documentationLinked: false,
  };
}

function createBootstrap(): BootstrapPayload {
  const taskWithQaBlocker = createTask("task-qa", "Fix failed shooter QA");
  const taskWithOtherBlocker = createTask("task-other", "Clarify bumper blocker");
  const createBlocker = (
    taskId: string,
    blockerType: TaskBlockerType,
    description: string,
  ): NonNullable<BootstrapPayload["taskBlockers"]>[number] => ({
    id: `blocker-${taskId}`,
    blockedTaskId: taskId,
    blockerType,
    blockerId: null,
    description,
    severity: "medium",
    status: "open",
    createdByMemberId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    resolvedAt: null,
  });

  return {
    ...EMPTY_BOOTSTRAP,
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
    workstreams: [
      {
        id: "workstream-1",
        projectId: "project-1",
        name: "Build",
        description: "",
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Avery",
        email: "avery@example.test",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Shooter",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    tasks: [taskWithOtherBlocker, taskWithQaBlocker],
    taskBlockers: [
      createBlocker("task-other", "other", "Needs discussion"),
      createBlocker("task-qa", "qa-failed", "Failed compression check"),
    ],
  };
}

describe("Action Required blocker taxonomy", () => {
  it("ranks and exposes blocked task blocker types", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: createBootstrap(),
    });

    expect(viewModel.actionNowItems.map((item) => item.recordId)).toEqual([
      "task-qa",
      "task-other",
    ]);
    expect(viewModel.actionNowItems[0]).toMatchObject({
      blockerTypeLabel: "QA failed",
      title: "Fix failed shooter QA",
    });
  });

  it("allows Action Required filtering by blocker type label", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: createBootstrap(),
    });

    const qaFailedMatches = viewModel.actionNowItems.filter((item) =>
      [
        item.title,
        item.whyNow,
        item.nextAction,
        item.ownerLabel,
        item.statusLabel,
        item.severityLabel,
        item.blockerTypeLabel,
        item.contextLabel,
        item.sourceType,
      ]
        .join(" ")
        .toLowerCase()
        .includes("qa failed"),
    );

    expect(qaFailedMatches.map((item) => item.recordId)).toEqual(["task-qa"]);
  });
});
