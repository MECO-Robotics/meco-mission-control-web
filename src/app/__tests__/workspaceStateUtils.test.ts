/// <reference types="jest" />

import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";

const baseTask: BootstrapPayload["tasks"][number] = {
  id: "task-visible",
  projectId: "project-visible",
  workstreamId: null,
  workstreamIds: [],
  title: "Visible task",
  summary: "",
  subsystemId: "subsystem-visible",
  subsystemIds: ["subsystem-visible"],
  disciplineId: "discipline-visible",
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
  estimatedHours: 1,
  actualHours: 0,
  requiresDocumentation: false,
  documentationLinked: false,
};

function createBootstrap(): BootstrapPayload {
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
        id: "project-visible",
        seasonId: "season-1",
        name: "Visible project",
        projectType: "robot",
        description: "",
        status: "active",
      },
      {
        id: "project-hidden",
        seasonId: "season-1",
        name: "Hidden project",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    subsystems: [
      {
        id: "subsystem-visible",
        projectId: "project-visible",
        name: "Visible subsystem",
        color: "#123456",
        description: "",
        photoUrl: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
      {
        id: "subsystem-hidden",
        projectId: "project-hidden",
        name: "Hidden subsystem",
        color: "#654321",
        description: "",
        photoUrl: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    tasks: [
      {
        ...baseTask,
        id: "task-visible",
        dependencyIds: ["task-hidden"],
      },
      {
        ...baseTask,
        id: "task-hidden",
        projectId: "project-hidden",
        subsystemId: "subsystem-hidden",
        subsystemIds: ["subsystem-hidden"],
        title: "Hidden task",
        status: "in-progress",
      },
    ],
    taskDependencies: [
      {
        id: "dependency-hidden-upstream",
        taskId: "task-visible",
        kind: "task",
        refId: "task-hidden",
        requiredState: "complete",
        dependencyType: "hard",
        createdAt: "2026-04-20T00:00:00.000Z",
      },
    ],
    taskBlockers: [
      {
        id: "blocker-hidden-task",
        blockedTaskId: "task-visible",
        blockerType: "task",
        blockerId: "task-hidden",
        description: "Waiting on hidden task",
        severity: "medium",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-04-20T00:00:00.000Z",
        resolvedAt: null,
      },
      {
        id: "blocker-external",
        blockedTaskId: "task-visible",
        blockerType: "external",
        blockerId: null,
        description: "Waiting on vendor",
        severity: "medium",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-04-20T00:00:00.000Z",
        resolvedAt: null,
      },
    ],
  };
}

describe("scopeBootstrapBySelection", () => {
  it("removes dependency and blocker endpoints that are outside the visible task scope", () => {
    const scoped = scopeBootstrapBySelection(createBootstrap(), "season-1", "project-visible");

    expect(scoped.tasks).toHaveLength(1);
    expect(scoped.tasks[0].dependencyIds).toEqual([]);
    expect(scoped.taskDependencies).toEqual([]);
    expect((scoped.taskBlockers ?? []).map((blocker) => blocker.id)).toEqual(["blocker-external"]);
  });
});
