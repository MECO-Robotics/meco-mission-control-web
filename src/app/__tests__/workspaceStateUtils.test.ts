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
      {
        id: "season-2",
        name: "2027",
        type: "season",
        startDate: "2027-01-01",
        endDate: "2027-12-31",
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
      {
        id: "project-season-2",
        seasonId: "season-2",
        name: "Future project",
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
      {
        id: "subsystem-season-2",
        projectId: "project-season-2",
        name: "Season 2 subsystem",
        color: "#2255aa",
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
    mechanisms: [
      {
        id: "mechanism-visible",
        subsystemId: "subsystem-visible",
        name: "Visible mechanism",
        description: "",
        iteration: 1,
      },
      {
        id: "mechanism-hidden",
        subsystemId: "subsystem-hidden",
        name: "Hidden mechanism",
        description: "",
        iteration: 1,
      },
    ],
    partInstances: [
      {
        id: "part-instance-visible",
        subsystemId: "subsystem-visible",
        mechanismId: "mechanism-visible",
        partDefinitionId: "part-definition-1",
        name: "Visible part instance",
        status: "ready",
        quantity: 1,
        trackIndividually: false,
      },
      {
        id: "part-instance-hidden-subsystem",
        subsystemId: "subsystem-hidden",
        mechanismId: "mechanism-hidden",
        partDefinitionId: "part-definition-1",
        name: "Hidden subsystem part instance",
        status: "ready",
        quantity: 1,
        trackIndividually: false,
      },
      {
        id: "part-instance-hidden-mechanism",
        subsystemId: "subsystem-visible",
        mechanismId: "mechanism-hidden",
        partDefinitionId: "part-definition-1",
        name: "Hidden mechanism part instance",
        status: "ready",
        quantity: 1,
        trackIndividually: false,
      },
    ],
    milestones: [
      {
        id: "milestone-visible",
        title: "Visible milestone",
        type: "deadline",
        startDateTime: "2026-04-20T00:00:00.000Z",
        endDateTime: "2026-04-22T00:00:00.000Z",
        status: "ready",
        isExternal: false,
        description: "",
        projectIds: ["project-visible"],
      },
      {
        id: "milestone-hidden",
        title: "Hidden milestone",
        type: "deadline",
        startDateTime: "2026-04-21T00:00:00.000Z",
        endDateTime: "2026-04-23T00:00:00.000Z",
        status: "ready",
        isExternal: false,
        description: "",
        projectIds: ["project-hidden"],
      },
      {
        id: "milestone-global",
        title: "Global milestone",
        type: "deadline",
        startDateTime: "2026-04-24T00:00:00.000Z",
        endDateTime: "2026-04-25T00:00:00.000Z",
        status: "ready",
        isExternal: false,
        description: "",
        projectIds: [],
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
      {
        ...baseTask,
        id: "task-season-2",
        projectId: "project-season-2",
        subsystemId: "subsystem-season-2",
        subsystemIds: ["subsystem-season-2"],
        title: "Season 2 task",
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
      {
        id: "dependency-global-milestone",
        taskId: "task-visible",
        kind: "milestone",
        refId: "milestone-global",
        requiredState: "complete",
        dependencyType: "soft",
        createdAt: "2026-04-20T00:00:00.000Z",
      },
      {
        id: "dependency-hidden-milestone",
        taskId: "task-visible",
        kind: "milestone",
        refId: "milestone-hidden",
        requiredState: "complete",
        dependencyType: "soft",
        createdAt: "2026-04-20T00:00:00.000Z",
      },
      {
        id: "dependency-visible-part",
        taskId: "task-visible",
        kind: "part_instance",
        refId: "part-instance-visible",
        requiredState: "ready",
        dependencyType: "hard",
        createdAt: "2026-04-20T00:00:00.000Z",
      },
      {
        id: "dependency-hidden-part",
        taskId: "task-visible",
        kind: "part_instance",
        refId: "part-instance-hidden-subsystem",
        requiredState: "ready",
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
        id: "blocker-hidden-milestone",
        blockedTaskId: "task-visible",
        blockerType: "milestone",
        blockerId: "milestone-hidden",
        description: "Waiting on hidden milestone",
        severity: "medium",
        status: "open",
        createdByMemberId: null,
        createdAt: "2026-04-20T00:00:00.000Z",
        resolvedAt: null,
      },
      {
        id: "blocker-hidden-part",
        blockedTaskId: "task-visible",
        blockerType: "part_instance",
        blockerId: "part-instance-hidden-subsystem",
        description: "Waiting on hidden part instance",
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
    workLogs: [
      {
        id: "worklog-visible",
        taskId: "task-visible",
        date: "2026-04-20",
        hours: 2,
        participantIds: [],
        notes: "",
      },
      {
        id: "worklog-hidden",
        taskId: "task-hidden",
        date: "2026-04-20",
        hours: 1,
        participantIds: [],
        notes: "",
      },
    ],
  };
}

describe("scopeBootstrapBySelection", () => {
  it("applies season and project scoping across core entities", () => {
    const scoped = scopeBootstrapBySelection(createBootstrap(), "season-1", "project-visible");

    expect(scoped.projects.map((project) => project.id)).toEqual(["project-visible"]);
    expect(scoped.subsystems.map((subsystem) => subsystem.id)).toEqual(["subsystem-visible"]);
    expect(scoped.mechanisms.map((mechanism) => mechanism.id)).toEqual(["mechanism-visible"]);
    expect(scoped.partInstances.map((partInstance) => partInstance.id)).toEqual([
      "part-instance-visible",
    ]);
    expect(scoped.tasks.map((task) => task.id)).toEqual(["task-visible"]);
  });

  it("filters task dependencies to only visible task, milestone, and part-instance targets", () => {
    const scoped = scopeBootstrapBySelection(createBootstrap(), "season-1", "project-visible");

    expect(scoped.tasks[0].dependencyIds).toEqual([]);
    expect((scoped.taskDependencies ?? []).map((dependency) => dependency.id)).toEqual([
      "dependency-global-milestone",
      "dependency-visible-part",
    ]);
  });

  it("keeps external blockers while filtering hidden scoped blockers", () => {
    const scoped = scopeBootstrapBySelection(createBootstrap(), "season-1", "project-visible");

    expect((scoped.taskBlockers ?? []).map((blocker) => blocker.id)).toEqual(["blocker-external"]);
  });

  it("filters work logs to scoped task ids", () => {
    const scoped = scopeBootstrapBySelection(createBootstrap(), "season-1", "project-visible");

    expect(scoped.workLogs.map((workLog) => workLog.id)).toEqual(["worklog-visible"]);
  });

  it("keeps milestones with no project ids visible", () => {
    const scoped = scopeBootstrapBySelection(createBootstrap(), "season-1", "project-visible");

    expect(scoped.milestones.map((milestone) => milestone.id)).toEqual([
      "milestone-visible",
      "milestone-global",
    ]);
  });
});
