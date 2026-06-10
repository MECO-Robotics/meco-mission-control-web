/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { TaskQueueKanbanBoard } from "@/features/workspace/views/taskQueue/TaskQueueKanbanBoard";
import type { TaskQueueBoardState } from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

interface CapturedKanbanColumnsProps {
  canDragItem?: (task: TaskRecord, state: TaskQueueBoardState) => boolean;
  canDropItem?: (
    task: TaskRecord,
    state: TaskQueueBoardState,
    sourceState: TaskQueueBoardState,
  ) => boolean;
  canDropState?: (state: TaskQueueBoardState) => boolean;
  onItemDrop?: (
    task: TaskRecord,
    targetState: TaskQueueBoardState,
    sourceState: TaskQueueBoardState,
  ) => void | Promise<void>;
}

const mockKanbanColumns = jest.fn((props: CapturedKanbanColumnsProps) => {
  void props;
  return null;
});

jest.mock("@/features/workspace/views/kanban/KanbanColumns", () => ({
  KanbanColumns: (props: CapturedKanbanColumnsProps) => mockKanbanColumns(props),
}));

const task: TaskRecord = {
  id: "task-1",
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
  title: "Wire Swerve Module",
  summary: "",
  targetMilestoneId: null,
  photoUrl: "",
  ownerId: "member-1",
  assigneeIds: [],
  mentorId: null,
  startDate: "2026-03-01",
  dueDate: "2026-03-02",
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
  isBlocked: false,
};

const bootstrap: BootstrapPayload = {
  ...EMPTY_BOOTSTRAP,
  disciplines: [{ id: "discipline-1", code: "design", name: "Design" }],
  members: [
    {
      id: "member-1",
      name: "Alex Builder",
      email: "alex@example.com",
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
  tasks: [task],
};

function renderBoard(
  onReassignTaskStatus: (task: TaskRecord, status: TaskStatus) => Promise<void>,
  openEditTaskModal = jest.fn(),
) {
  mockKanbanColumns.mockClear();
  renderToStaticMarkup(
    React.createElement(TaskQueueKanbanBoard, {
      bootstrap,
      disciplinesById: { "discipline-1": bootstrap.disciplines[0] },
      focusedState: null,
      isNonRobotProject: false,
      membersById: { "member-1": bootstrap.members[0] },
      onClearFocus: jest.fn(),
      onFocusState: jest.fn(),
      onReassignTaskStatus,
      openEditTaskModal,
      projectsById: { "project-1": bootstrap.projects[0] },
      taskQueueZoom: 1,
      showProjectContextOnCards: true,
      showProjectOnCards: true,
      subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
      tasks: [task],
      workstreamsById: {},
    }),
  );

  const firstCall = mockKanbanColumns.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected KanbanColumns to render");
  }

  return firstCall[0];
}

describe("TaskQueueKanbanBoard", () => {
  it("ignores repeated task status drops while a reassignment is pending", async () => {
    let resolveFirstChange!: () => void;
    const onReassignTaskStatus = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstChange = resolve;
        }),
    );
    const kanbanProps = renderBoard(onReassignTaskStatus);

    const firstDrop = kanbanProps.onItemDrop?.(task, "in-progress", "not-started");
    const secondDrop = kanbanProps.onItemDrop?.(task, "complete", "not-started");

    expect(onReassignTaskStatus).toHaveBeenCalledTimes(1);
    resolveFirstChange();
    await firstDrop;
    await secondDrop;
    expect(onReassignTaskStatus).toHaveBeenCalledWith(task, "in-progress");
  });

  it("opens task edit intent instead of status reassignment for pseudo-state drops", async () => {
    const onReassignTaskStatus = jest.fn(() => Promise.resolve());
    const openEditTaskModal = jest.fn();
    const kanbanProps = renderBoard(onReassignTaskStatus, openEditTaskModal);

    await kanbanProps.onItemDrop?.(task, "blocked", "not-started");
    await kanbanProps.onItemDrop?.(task, "waiting-on-dependency", "not-started");

    expect(onReassignTaskStatus).not.toHaveBeenCalled();
    expect(openEditTaskModal).toHaveBeenNthCalledWith(1, task, { intentState: "blocked" });
    expect(openEditTaskModal).toHaveBeenNthCalledWith(2, task, { intentState: "waiting-on-dependency" });
  });

  it("allows task reassignment between direct status columns only", () => {
    const onReassignTaskStatus = jest.fn(() => Promise.resolve());
    const kanbanProps = renderBoard(onReassignTaskStatus);

    expect(kanbanProps.canDropItem?.(task, "in-progress", "not-started")).toBe(true);
    expect(kanbanProps.canDropItem?.(task, "complete", "blocked")).toBe(false);
    expect(kanbanProps.canDropItem?.(task, "not-started", "not-started")).toBe(false);
  });

  it("allows pseudo-state columns as drag and drop targets", () => {
    const onReassignTaskStatus = jest.fn(() => Promise.resolve());
    const kanbanProps = renderBoard(onReassignTaskStatus);

    expect(kanbanProps.canDragItem?.(task, "blocked")).toBe(true);
    expect(kanbanProps.canDropState?.("blocked")).toBe(true);
    expect(kanbanProps.canDropState?.("waiting-on-dependency")).toBe(true);
    expect(kanbanProps.canDropItem?.(task, "blocked", "not-started")).toBe(true);
    expect(kanbanProps.canDropItem?.(task, "waiting-on-dependency", "not-started")).toBe(true);
  });
});
