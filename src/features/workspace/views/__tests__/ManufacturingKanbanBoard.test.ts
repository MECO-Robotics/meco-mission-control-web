/// <reference types="jest" />

import * as React from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ManufacturingKanbanBoard } from "@/features/workspace/views/manufacturing/ManufacturingKanbanBoard";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { TaskRecord } from "@/types/recordsExecution";
import { createTask } from "@/features/workspace/views/__tests__/taskQueueTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const manufacturingItem: ManufacturingItemRecord = {
  id: "cnc-1",
  title: "Drive Plate",
  subsystemId: "subsystem-1",
  requestedById: "member-1",
  process: "cnc",
  dueDate: "2026-05-01",
  material: "Aluminum 6061",
  materialId: "material-1",
  partDefinitionId: null,
  partInstanceId: null,
  partInstanceIds: [],
  quantity: 1,
  status: "requested",
  mentorReviewed: false,
  batchLabel: "CNC-1",
  inHouse: false,
};

const membersById: MembersById = {
  "member-1": {
    id: "member-1",
    name: "Student",
    email: "student@meco.test",
    role: "student",
    elevated: false,
    seasonId: "season-1",
  },
};

const subsystemsById: SubsystemsById = {
  "subsystem-1": {
    id: "subsystem-1",
    projectId: "project-1",
    name: "Drive",
    description: "",
    iteration: 1,
    isCore: true,
    parentSubsystemId: null,
    responsibleEngineerId: null,
    mentorIds: [],
    risks: [],
  },
};

interface CapturedKanbanColumnsProps {
  renderItem?: (item: ManufacturingItemRecord, state: ManufacturingItemRecord["status"]) => ReactNode;
  onItemDrop?: (
    item: ManufacturingItemRecord,
    targetState: ManufacturingItemRecord["status"],
    sourceState: ManufacturingItemRecord["status"],
  ) => void | Promise<void>;
}

const mockKanbanColumns = jest.fn((props: CapturedKanbanColumnsProps) => {
  void props;
  return null;
});

jest.mock("@/features/workspace/views/kanban/KanbanColumns", () => ({
  KanbanColumns: (props: CapturedKanbanColumnsProps) => mockKanbanColumns(props),
}));

function renderBoard(
  onQuickStatusChange: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>,
  tasks: TaskRecord[] = [],
) {
  mockKanbanColumns.mockClear();
  renderToStaticMarkup(
    React.createElement(ManufacturingKanbanBoard, {
      items: [manufacturingItem],
      membersById,
      projectsById: { "project-1": { id: "project-1", name: "Robot Project" } },
      tasks,
      onEdit: jest.fn(),
      onQuickStatusChange,
      showMentorQuickActions: true,
      subsystemsById,
    }),
  );

  const firstCall = mockKanbanColumns.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected KanbanColumns to render");
  }

  return firstCall[0];
}

describe("ManufacturingKanbanBoard", () => {
  it("shows manufacturing type and priority on the card edge without the subsystem subtitle", () => {
    const kanbanProps = renderBoard(jest.fn().mockResolvedValue(undefined), [
      createTask(1, {
        linkedManufacturingIds: [manufacturingItem.id],
        priority: "high",
      }),
    ]);
    const card = kanbanProps.renderItem?.(manufacturingItem, "requested");
    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, card));

    expect(markup).toContain("Robot Project");
    expect(markup).toContain("task-queue-board-card-priority-accented");
    expect(markup).toContain('data-priority="high"');
    expect(markup).toContain("--task-queue-board-card-priority-accent:#e5484d");
    expect(markup).toContain("High priority</span>");
    expect(markup).not.toContain("task-queue-board-card-priority-high");
    expect(markup).toContain('aria-label="Manufacturing item"');
    expect(markup).toContain("requested-item-title");
    expect(markup).not.toContain("requested-item-subtitle");
    expect(markup).not.toContain("Drive / Student");
    expect(markup).toContain('title="Student"');
    expect(markup).toContain("profile-avatar-fallback");
  });

  it("ignores drag-drop status changes while a quick action is already pending", async () => {
    let resolveFirstChange!: () => void;
    const onQuickStatusChange = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstChange = resolve;
        }),
    );
    const kanbanProps = renderBoard(onQuickStatusChange);

    const firstDrop = kanbanProps.onItemDrop?.(manufacturingItem, "approved", "requested");
    const secondDrop = kanbanProps.onItemDrop?.(manufacturingItem, "complete", "requested");

    expect(onQuickStatusChange).toHaveBeenCalledTimes(1);
    resolveFirstChange();
    await firstDrop;
    await secondDrop;
    expect(onQuickStatusChange).toHaveBeenCalledWith(manufacturingItem, "approved");
  });
});
