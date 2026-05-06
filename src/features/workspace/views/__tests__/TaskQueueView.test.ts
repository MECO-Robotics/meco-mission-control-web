/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { IconEdit, IconManufacturing, IconParts } from "@/components/shared/Icons";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TaskQueueKanbanBoard } from "@/features/workspace/views/taskQueue/TaskQueueKanbanBoard";
import { getTaskQueueCardContextLabel } from "@/features/workspace/views/taskQueue/taskQueueKanbanCardMeta";
import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE } from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";
import { getTaskQueueDisciplineIcon } from "@/features/workspace/views/taskQueue/taskQueueDisciplineBadge";
import { shouldHideTaskQueueSummary } from "@/features/workspace/views/taskQueue/taskQueueViewState";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

type Task = BootstrapPayload["tasks"][number];

function createTask(index: number, overrides: Partial<Task> = {}): Task {
  const day = String(index).padStart(2, "0");

  const task: Task = {
    id: `task-${index}`,
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
    title: `Task ${index}`,
    summary: `Summary ${index}`,
    targetMilestoneId: null,
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
    dependencyIds: [],
    blockers: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    estimatedHours: 0,
    actualHours: 0,
    requiresDocumentation: false,
    documentationLinked: false,
    ...overrides,
  };

  return {
    ...task,
    isBlocked: (task.blockers ?? []).length > 0,
  };
}

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    disciplines: [
      {
        id: "discipline-1",
        code: "design",
        name: "Design",
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
        risks: [],
      },
    ],
    tasks: Array.from({ length: 16 }, (_, index) => {
      const taskIndex = index + 1;

      return createTask(taskIndex, {
        ownerId: taskIndex === 2 ? "member-2" : "member-1",
        dependencyIds: taskIndex === 3 ? ["task-1"] : [],
        blockers: taskIndex === 4 ? ["Waiting on parts"] : [],
      });
    }),
  };
}

describe("TaskQueueView", () => {
  it("formats the kanban card context from subsystems or workflows when a project is selected", () => {
    const robotTask = createTask(1, {
      projectId: "project-robot",
      subsystemId: "subsystem-robot",
      subsystemIds: ["subsystem-robot"],
      workstreamId: null,
      workstreamIds: [],
    });
    const workflowTask = createTask(2, {
      projectId: "project-workflow",
      subsystemId: "subsystem-workflow",
      subsystemIds: [],
      workstreamId: "workstream-workflow",
      workstreamIds: ["workstream-workflow"],
    });

    expect(
      getTaskQueueCardContextLabel(
        robotTask,
        "robot",
        {
          "subsystem-robot": {
            id: "subsystem-robot",
            projectId: "project-robot",
            name: "Drive",
            color: "#224466",
            description: "",
            photoUrl: "",
            iteration: 1,
            isCore: true,
            parentSubsystemId: null,
            responsibleEngineerId: null,
            mentorIds: [],
            risks: [],
          },
        },
        {},
      ),
    ).toBe("Drive (v1)");

    expect(
      getTaskQueueCardContextLabel(
        workflowTask,
        "operations",
        {},
        {
          "workstream-workflow": {
            id: "workstream-workflow",
            projectId: "project-workflow",
            name: "Operations",
            description: "",
            color: "#000000",
            isArchived: false,
          },
        },
      ),
    ).toBe("Operations");
  });

  it("color-codes the kanban card context chip", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueKanbanBoard, {
        bootstrap,
        disciplinesById: { "discipline-1": bootstrap.disciplines[0] },
        focusedState: null,
        isNonRobotProject: false,
        membersById: {
          "member-1": bootstrap.members[0],
          "member-2": bootstrap.members[1],
        },
        onClearFocus: jest.fn(),
        onFocusState: jest.fn(),
        openEditTaskModal: jest.fn(),
        projectsById: { "project-1": bootstrap.projects[0] },
        taskQueueZoom: 1,
        showProjectContextOnCards: true,
        showProjectOnCards: false,
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
        tasks: [createTask(1)],
        workstreamsById: {},
      }),
    );

    expect(markup).toContain("task-queue-board-card-context-chip");
    expect(markup).toContain("task-queue-board-card-context-chip-due-style");
    expect(markup).toContain("--task-queue-board-card-context-accent:#224466");
    expect(markup).toContain("color-mix(in srgb, #224466 24%, transparent)");
    expect(markup).toContain("Drive (v1)");
    expect(markup).toContain("task-queue-board-card-discipline");
    expect(markup).toContain('aria-label="Design discipline"');
    expect(
      markup.indexOf(
        "task-queue-board-card-priority",
        markup.indexOf("task-queue-board-card-meta-person-group"),
      ),
    ).toBeLessThan(markup.indexOf('aria-label="Design discipline"'));
    expect(markup.indexOf('aria-label="Design discipline"')).toBeLessThan(
      markup.indexOf("profile-avatar"),
    );
  });

  it("reuses the official discipline icons for task queue discipline options", () => {
    expect((getTaskQueueDisciplineIcon("design") as { type?: unknown } | null)?.type).toBe(IconEdit);
    expect((getTaskQueueDisciplineIcon("manufacturing") as { type?: unknown } | null)?.type).toBe(
      IconManufacturing,
    );
    expect((getTaskQueueDisciplineIcon("assembly") as { type?: unknown } | null)?.type).toBe(IconParts);
  });

  it("renders scouting as a simple binocular-style discipline icon", () => {
    const markup = renderToStaticMarkup(
      React.createElement(React.Fragment, null, getTaskQueueDisciplineIcon("scouting")),
    );

    expect(markup).toContain('viewBox="0 0 24 24"');
    expect(markup).toContain('cx="7" cy="12" r="4.8"');
    expect(markup).toContain('cx="17" cy="12" r="4.8"');
    expect(markup).toContain('stroke-opacity="0.6"');
    expect(markup).toContain('M5.6 10.3c.7-.5 1.4-.8 2.1-.8');
    expect(markup).toContain('M9.8 7.9h3.8');
  });

  it("renders the first lazy-load batch and groups blocked tasks into the blocked column", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueView, {
        activePersonFilter: [],
        bootstrap,
        disciplinesById: { "discipline-1": bootstrap.disciplines[0] },
        isAllProjectsView: false,
        isNonRobotProject: false,
        membersById: {
          "member-1": bootstrap.members[0],
          "member-2": bootstrap.members[1],
        },
        openCreateTaskModal: jest.fn(),
        openEditTaskModal: jest.fn(),
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
      }),
    );

    expect(markup).toContain("task-queue-board");
    expect(markup).toContain("task-queue-board-load-status");
    expect(markup).toContain("task-queue-board-load-sentinel");
    expect(markup).toContain("task-queue-board-card-due");
    expect(markup).toContain("task-queue-zoom-controls");
    expect(markup).toContain("task-queue-zoom-label");
    expect(markup).toContain("100%");
    expect(markup).toContain("task-queue-toolbar-inline-actions");
    expect(markup).toContain("task-queue-board-column-header-icon");
    expect(markup).toContain("timeline-task-status-logo-signal-not-started");
    expect(markup).toContain("timeline-task-status-logo-signal-in-progress");
    expect(markup).toContain("timeline-task-status-logo-signal-waiting-for-qa");
    expect(markup).toContain("timeline-task-status-logo-signal-complete");
    expect(markup).toContain("timeline-task-status-logo-signal-blocked");
    expect(markup).toContain("timeline-task-status-logo-signal-waiting-on-dependency");
    expect(markup).toContain("status-pill-danger");
    expect(markup).toContain("status-pill-info");
    expect(markup).toContain("status-pill-warning");
    expect(markup).toContain("status-pill-success");
    expect(markup).not.toContain("table-pagination");
    expect(markup).not.toContain("Unknown project");
    expect(markup).toContain("task-queue-board-card-priority-critical");
    expect(markup).toContain("task-queue-board-card-priority-high");
    expect(markup).toContain("task-queue-board-card-priority-medium");
    expect(markup).toContain("task-queue-board-card-priority-low");
    expect(markup).toContain("task-queue-board-card-discipline-accented");
    expect(markup).toContain("--task-queue-board-card-discipline-accent");
    expect(markup).toContain('aria-label="Critical priority"');
    expect(markup).toContain('aria-label="Low priority"');
    expect(markup.indexOf("task-queue-board-card-priority")).toBeLessThan(markup.indexOf("profile-avatar"));
    expect(markup).toContain('alt="Alex Builder profile picture"');
    expect(markup).toContain('src="https://example.com/alex.png"');
    expect(markup).toContain("profile-avatar-fallback");
    expect(markup).toContain(">Q<");
    expect(markup).toContain('data-board-state="blocked"');
    expect(markup.match(/data-board-state="blocked"/g)).toHaveLength(1);
    expect(markup).toContain('data-board-state="waiting-on-dependency"');
    expect(markup.match(/data-board-state="waiting-on-dependency"/g)).toHaveLength(1);
    expect(markup.match(/data-board-state=/g)).toHaveLength(TASK_QUEUE_LAZY_LOAD_BATCH_SIZE);
    expect(markup).not.toContain("Task 16");
  });

  it("hides task summaries once zoom is compact enough", () => {
    expect(shouldHideTaskQueueSummary(1)).toBe(false);
    expect(shouldHideTaskQueueSummary(0.9)).toBe(true);
    expect(shouldHideTaskQueueSummary(0.8)).toBe(true);
  });

  it("keeps the focused kanban view in the same order passed in by filters and sort", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueKanbanBoard, {
        bootstrap,
        disciplinesById: { "discipline-1": bootstrap.disciplines[0] },
        focusedState: "not-started",
        isNonRobotProject: false,
        membersById: {
          "member-1": bootstrap.members[0],
          "member-2": bootstrap.members[1],
        },
        onClearFocus: jest.fn(),
        onFocusState: jest.fn(),
        openEditTaskModal: jest.fn(),
        projectsById: { "project-1": bootstrap.projects[0] },
        taskQueueZoom: 1,
        showProjectContextOnCards: true,
        showProjectOnCards: true,
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
        tasks: [
          createTask(21, {
            title: "Zulu priority task",
            summary: "First in board order",
            dueDate: "2026-03-20",
            status: "not-started",
            priority: "medium",
          }),
          createTask(22, {
            title: "Alpha priority task",
            summary: "Second in board order",
            dueDate: "2026-03-01",
            status: "not-started",
            priority: "medium",
          }),
        ],
        workstreamsById: {},
      }),
    );

    expect(markup).toContain("Zulu priority task");
    expect(markup).toContain("Alpha priority task");
    expect(markup.indexOf("Zulu priority task")).toBeLessThan(markup.indexOf("Alpha priority task"));
    expect(markup).not.toContain('aria-label="Design discipline"');
  });
});
