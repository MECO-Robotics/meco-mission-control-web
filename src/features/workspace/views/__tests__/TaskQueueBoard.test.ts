/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskQueueView } from "@/features/workspace/views/taskQueue/TaskQueueView";
import { TaskQueueKanbanBoard } from "@/features/workspace/views/taskQueue/TaskQueueKanbanBoard";
import { filterTaskQueueTasks } from "@/features/workspace/views/taskQueue/taskQueueKanbanCard";
import { createTask, createTaskQueueBootstrap as createBootstrap } from "./taskQueueTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("Task Queue board", () => {
  it("renders every project beyond the former batch limit and groups blocked tasks", () => {
    const bootstrap = createBootstrap();
    bootstrap.tasks = bootstrap.tasks.map((task) =>
      task.status === "complete" ? { ...task, status: "not-started" } : task,
    );
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "outreach", name: "Outreach", projectType: "outreach" });
    bootstrap.workTypes.push({ id: "outreach:writing", projectType: "outreach", code: "writing", name: "Writing", isActive: true });
    bootstrap.workstreams.push({ id: "sponsor", projectId: "outreach", name: "Sponsor engagement", description: "", color: "#335577", isArchived: false });
    bootstrap.tasks.push(createTask(17, { projectId: "outreach", workTypeId: "outreach:writing", subsystemIds: [], workstreamIds: ["sponsor"], status: "not-started" }));
    bootstrap.tasks.push(createTask(18, { status: "unrecorded" }));
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueView, {
        activePersonFilter: [],
        bootstrap,
        workTypesById: { "work-type-design": bootstrap.workTypes[0] },
        isAllProjectsView: true,
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
    expect(markup).toContain("task-queue-board-card-due");
    expect(markup).toContain("workspace-topbar-zoom-controls");
    expect(markup).toContain("workspace-topbar-zoom-label");
    expect(markup).toContain("100%");
    expect(markup).toContain("workspace-topbar-zoom-slot-actions");
    expect(markup).toContain("task-queue-board-column-header-icon");
    expect(markup).toContain("timeline-task-status-logo-signal-not-started");
    expect(markup).toContain("timeline-task-status-logo-signal-unrecorded");
    expect(markup).toContain("timeline-task-status-logo-signal-in-progress");
    expect(markup).toContain("timeline-task-status-logo-signal-waiting-for-qa");
    expect(markup).toContain("timeline-task-status-logo-signal-complete");
    expect(markup).toContain("timeline-task-status-logo-signal-blocked");
    expect(markup).toContain("timeline-task-status-logo-signal-waiting-on-dependency");
    expect(markup.match(/class="task-queue-board-state-label"/g)).toHaveLength(7);
    expect(markup).toContain('aria-expanded="true" class="kanban-project-toggle"');
    expect(markup).toContain('>Robot</span></button></h3>');
    expect(markup).not.toContain("table-pagination");
    expect(markup).not.toContain("Unknown project");
    expect(markup).not.toContain("task-queue-board-card-priority-accented");
    expect(markup).toContain('aria-label="Critical priority"');
    expect(markup).toContain('aria-label="Low priority"');
    expect(markup).toContain('data-priority="critical"');
    expect(markup).toContain('data-priority="low"');
    expect(markup).not.toContain('aria-label="Design discipline"');
    expect(markup).toContain('aria-label="Alex Builder"');
    expect(markup).toContain('src="https://example.com/alex.png"');
    expect(markup).toContain("profile-avatar-fallback");
    expect(markup).toContain(">Q<");
    expect(markup).toContain('data-board-state="blocked"');
    expect(markup.match(/data-board-state="blocked"/g)).toHaveLength(1);
    expect(markup).toContain('data-board-state="waiting-on-dependency"');
    expect(markup.match(/data-board-state="waiting-on-dependency"/g)).toHaveLength(1);
    expect(markup.match(/data-board-state=/g)).toHaveLength(18);
    expect(markup).toContain('data-board-state="unrecorded"');
    expect(markup).toContain("Task 16");
    expect(markup).toContain("Task 17");
    expect(markup).toContain('aria-label="Outreach"');
  });

  it("defaults to all task statuses, shows explicitly selected completed tasks, and clears back to all tasks", () => {
    const bootstrap = createBootstrap();
    const filters = {
      activePersonFilter: [],
      disciplineFilter: [],
      isAllProjectsView: false,
      ownerFilter: [],
      priorityFilter: [],
      projectFilter: [],
      searchFilter: "",
      subsystemFilter: [],
      subsystemIterationFilter: [],
      showSubsystemIterationFilter: false,
      subsystemsById: {},
    };
    const activeTasks = filterTaskQueueTasks(bootstrap.tasks, bootstrap, {
      ...filters,
      statusFilter: [],
    });
    const completedTasks = filterTaskQueueTasks(bootstrap.tasks, bootstrap, {
      ...filters,
      statusFilter: ["complete"],
    });
    const clearedTasks = filterTaskQueueTasks(bootstrap.tasks, bootstrap, {
      ...filters,
      statusFilter: [],
    });

    expect(activeTasks.length).toBeGreaterThan(0);
    expect(activeTasks.some((task) => task.status !== "complete")).toBe(true);
    expect(activeTasks.some((task) => task.status === "complete")).toBe(true);
    expect(completedTasks.length).toBeGreaterThan(0);
    expect(completedTasks.every((task) => task.status === "complete")).toBe(true);
    expect(clearedTasks.map((task) => task.id)).toEqual(activeTasks.map((task) => task.id));
  });

  it("renders task zoom with the shared workspace topbar controls", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueView, {
        activePersonFilter: [],
        bootstrap,
        workTypesById: { "work-type-design": bootstrap.workTypes[0] },
        isAllProjectsView: false,
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
    expect(markup).toContain('title="Task 1"');
    expect(markup).toContain('title="Task 5"');
    expect(markup).not.toContain('title="Task 14"');
  });

  it("keeps the focused kanban view in the same order passed in by filters and sort", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueKanbanBoard, {
        groupBy: "team",
        bootstrap,
        focusedState: "not-started",
        membersById: {
          "member-1": bootstrap.members[0],
          "member-2": bootstrap.members[1],
        },
        onClearFocus: jest.fn(),
        onFocusState: jest.fn(),
        openEditTaskModal: jest.fn(),
        projectsById: { "project-1": bootstrap.projects[0] },
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

  it("enables drag-drop reassignment for task cards on direct status columns", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueKanbanBoard, {
        groupBy: "team",
        bootstrap,
        focusedState: null,
        membersById: {
          "member-1": bootstrap.members[0],
          "member-2": bootstrap.members[1],
        },
        onClearFocus: jest.fn(),
        onFocusState: jest.fn(),
        onReassignTaskStatus: jest.fn(),
        openEditTaskModal: jest.fn(),
        projectsById: { "project-1": bootstrap.projects[0] },
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
  it.each([null, "in-progress"] as const)("groups subsystem lanes with unique totals in focus %s", (focusedState) => {
    const bootstrap = createBootstrap();
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "arm", name: "Arm" });
    const markup = renderToStaticMarkup(React.createElement(TaskQueueKanbanBoard, {
      groupBy: "subsystem", bootstrap, focusedState,
      membersById: {}, projectsById: { "project-1": bootstrap.projects[0] },
      subsystemsById: {}, workstreamsById: {},
      onClearFocus: jest.fn(), onFocusState: jest.fn(), openEditTaskModal: jest.fn(),
      tasks: [
        createTask(1, { status: "in-progress", subsystemIds: ["subsystem-1", "arm"] }),
        createTask(2, { status: "in-progress", subsystemIds: ["arm"] }),
      ],
    }));
    expect(markup).toContain("Drive");
    expect(markup).toContain("Arm");
    expect(markup).not.toContain("Design");
    expect(markup.match(/data-kanban-item-id="task-1"/g) ?? markup.match(/title="Task 1"/g)).toHaveLength(2);
    expect(markup).toContain('task-queue-board-column-count kanban-swimlane-cell-count">1</span>');
    expect(markup).toContain('task-queue-board-column-count kanban-swimlane-cell-count">2</span>');
    expect(markup).toContain(focusedState ? 'task-queue-board-focused-count">2</span>' : 'task-queue-board-column-count">2</span>');
  });

});
