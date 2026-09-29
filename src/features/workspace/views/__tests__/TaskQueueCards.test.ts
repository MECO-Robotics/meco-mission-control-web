/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IconEdit, IconManufacturing, IconParts } from "@/components/shared/Icons";
import { TaskQueueCard } from "@/features/workspace/views/taskQueue/state/taskQueueKanbanCardView";
import { TaskQueueKanbanBoard } from "@/features/workspace/views/taskQueue/TaskQueueKanbanBoard";
import { readTaskSubsystemIds, readTaskWorkstreamIds } from "@/features/workspace/views/taskQueue/taskQueueKanbanCard";
import { getTaskQueueCardContextLabel } from "@/features/workspace/views/taskQueue/taskQueueKanbanCardMeta";
import { getTaskQueueDisciplineIcon } from "@/features/workspace/views/taskQueue/taskQueueDisciplineBadge";
import { createTask, createTaskQueueBootstrap as createBootstrap } from "./taskQueueTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("Task Queue cards", () => {
  it("normalizes subsystem and workstream IDs consistently", () => {
    const task = createTask(1, {
      subsystemIds: ["subsystem-1", "", "subsystem-1"],
      workstreamIds: ["workstream-1", "", "workstream-1"],
    });

    expect(readTaskSubsystemIds(task)).toEqual(["subsystem-1"]);
    expect(readTaskWorkstreamIds(task)).toEqual(["workstream-1"]);
  });

  it("uses local calendar days to color task card due dates", () => {
    const bootstrap = createBootstrap();
    const renderDueDateClass = (offsetDays: number) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + offsetDays);
      const dateValue = [dueDate.getFullYear(), dueDate.getMonth() + 1, dueDate.getDate()]
        .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
        .join("-");
      const markup = renderToStaticMarkup(React.createElement(TaskQueueCard, {
        bootstrap, task: createTask(1, { dueDate: dateValue }), disciplinesById: {}, membersById: {}, projectsById: {},
        subsystemsById: {}, workstreamsById: {}, isNonRobotProject: false, openEditTaskModal: jest.fn(),
        taskQueueZoom: 1, showProjectContextOnCards: false, showProjectOnCards: false,
      }));
      return markup.match(/task-detail-deadline-pill-(?:danger|warning|success)/)?.[0];
    };

    expect(renderDueDateClass(-1)).toBe("task-detail-deadline-pill-danger");
    expect(renderDueDateClass(0)).toBe("task-detail-deadline-pill-warning");
    expect(renderDueDateClass(1)).toBe("task-detail-deadline-pill-success");
  });

  it("keeps work-log hours and help signals without showing work-log notes on task cards", () => {
    const bootstrap = createBootstrap();
    bootstrap.workLogs = [
      { id: "old", taskId: "task-1", date: "2026-01-01", participantIds: ["member-1"], hours: 2, notes: "Need help with wiring" },
      { id: "new", taskId: "task-1", date: "2026-01-02", participantIds: ["member-1"], hours: 1.5, notes: "Prepared connector" },
      { id: "other", taskId: "task-2", date: "2026-01-03", participantIds: [], hours: 8, notes: "Unrelated" },
    ];
    const markup = renderToStaticMarkup(React.createElement(TaskQueueCard, {
      bootstrap, task: bootstrap.tasks[0], disciplinesById: {}, membersById: {}, projectsById: {},
      subsystemsById: {}, workstreamsById: {}, isNonRobotProject: false, openEditTaskModal: jest.fn(),
      taskQueueZoom: 1, showProjectContextOnCards: false, showProjectOnCards: false,
    }));
    expect(markup).toContain("3.5h logged");
    expect(markup).toContain("task-queue-board-card-header-side");
    expect(markup).toContain('task-queue-board-card-work-hours">3.5h logged</small>');
    expect(markup).not.toContain("Prepared connector");
    expect(markup).toContain("Help requested");
    expect(markup).not.toContain("Unrelated");
  });

  it("formats the kanban card context from subsystems or workflows when a project is selected", () => {
    const robotTask = createTask(1, {
      projectId: "project-robot",
      subsystemIds: ["subsystem-robot"],
      workstreamIds: [],
    });
    const workflowTask = createTask(2, {
      projectId: "project-workflow",
      subsystemIds: [],
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
        tasks: [createTask(1, { priority: "medium" })],
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
    expect(markup).not.toContain("task-queue-board-card-priority-medium");
    expect(markup).toContain("task-queue-board-card-priority-accented");
    expect(markup).toContain("--task-queue-board-card-priority-accent:#c58a00");
    expect(markup).toContain("Medium priority</span>");
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
});
