/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TaskQueueKanbanBoard } from "@/features/workspace/views/taskQueue/TaskQueueKanbanBoard";
import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE } from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";
import { shouldHideTaskQueueSummary } from "@/features/workspace/views/taskQueue/taskQueueViewState";
import { createTask, createTaskQueueBootstrap as createBootstrap } from "./taskQueueTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("Task Queue board", () => {
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
    expect(markup).toContain("workspace-topbar-zoom-controls");
    expect(markup).toContain("workspace-topbar-zoom-label");
    expect(markup).toContain("100%");
    expect(markup).toContain("workspace-topbar-zoom-slot-actions");
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
    expect(markup).toContain("task-queue-board-card-priority-accented");
    expect(markup).toContain("--task-queue-board-card-priority-accent");
    expect(markup).not.toContain('aria-label="Critical priority"');
    expect(markup).not.toContain('aria-label="Low priority"');
    expect(markup).toContain("Critical priority</span>");
    expect(markup).toContain("Low priority</span>");
    expect(markup).toContain('data-priority="critical"');
    expect(markup).toContain('data-priority="low"');
    expect(markup).toContain('aria-label="Design discipline"');
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

  it("renders task zoom with the shared workspace topbar controls", () => {
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
    expect(markup).toContain('aria-label="Zoom out task queue"');
    expect(markup).toContain('aria-label="Zoom in task queue"');
    expect(markup).toContain('d="M8 11h6"');
    expect(markup).toContain('d="M11 8v6"');
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
    expect(markup).toContain('aria-label="Design discipline"');
  });

  it("enables drag-drop reassignment for task cards on direct status columns", () => {
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
        onReassignTaskStatus: jest.fn(),
        openEditTaskModal: jest.fn(),
        projectsById: { "project-1": bootstrap.projects[0] },
        taskQueueZoom: 1,
        showProjectContextOnCards: true,
        showProjectOnCards: true,
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
        tasks: [createTask(1)],
        workstreamsById: {},
      }),
    );

    expect(markup).toContain('draggable="true"');
    expect(markup).toContain('data-kanban-item-id="task-1"');
    expect(markup).toContain('data-kanban-drop-state="in-progress"');
    expect(markup).toContain('data-kanban-drop-enabled="true"');
    expect(markup).toContain('data-kanban-drop-state="blocked"');
    expect(markup).toContain('data-kanban-drop-state="waiting-on-dependency"');
  });
});
