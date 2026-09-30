/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";

type Task = BootstrapPayload["tasks"][number];

function createTask(index: number, overrides: Partial<Task> = {}): Task {
  const day = String(index).padStart(2, "0");

  const task: Task = {
    id: `task-${index}`,
    projectId: "project-1",
    workstreamIds: [],
    subsystemIds: ["subsystem-1"],
    workTypeId: "work-type-design",
    responsibleGroupId: null,
    manufacturingDetails: null,
    mechanismIds: [],
    partInstanceIds: [],
    title: `Task ${index}`,
    summary: `Summary ${index}`,
    scheduleRefs: [],
    requestedById: null,
    photoUrl: "",
    ownerId: "member-1",
    assigneeIds: [],
    mentorId: null,
    startDate: `2026-03-${day}`,
    dueDate: `2026-03-${day}`,
    priority:
      index % 4 === 0 ? "critical" : index % 4 === 1 ? "low" : index % 4 === 2 ? "medium" : "high",
    status:
      index === 1
        ? "not-started"
        : index === 2 || index === 3 || index === 7 || index === 11 || index === 15
          ? "in-progress"
          : index === 4 || index === 8 || index === 12 || index === 16
            ? "waiting-for-qa"
            : "complete",

    estimatedHours: 0,
    actualHours: 0,
    checklistItems: [],
    requiresDocumentation: false,
    ...overrides,
  };

  return {
    ...task,
    isBlocked: false,
  };
}

function createTaskQueueBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    workTypes: [
      {
        id: "work-type-design",
        projectType: "robot",
        code: "design",
        name: "Design",
        isActive: true,
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Alex Builder",
        email: "alex@example.com",
        photoUrl: "https://example.com/alex.png",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
      {
        id: "member-2",
        name: "Quinn Maker",
        email: "quinn@example.com",
        photoUrl: "",
        role: "student",
        elevated: false,
        seasonId: "season-1",
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
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drive",
        color: "#224466",
        description: "",
        photoUrl: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
      },
    ],
    taskDependencies: [{ id: "dependency-1", taskId: "task-3", kind: "task", refId: "task-1", requiredState: "complete", dependencyType: "hard", createdAt: "2026-01-01" }],
    risks: [{ id: "risk-1", projectId: "project-1", title: "Waiting on parts", detail: "Parts are not available", category: "supply", severity: "medium", status: "open", blocksWork: true, source: { kind: "manual" }, relatedTargets: [{ kind: "task", id: "task-4" }], mitigationTaskId: null, ownerGroupId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", resolvedAt: null }],
    tasks: Array.from({ length: 16 }, (_, index) => {
      const taskIndex = index + 1;

      return createTask(taskIndex, {
        ownerId: taskIndex === 2 ? "member-2" : "member-1",
      });
    }),
  };
}

export { createTask, createTaskQueueBootstrap };
