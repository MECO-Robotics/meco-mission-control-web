/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ManufacturingKanbanBoard } from "@/features/workspace/views/manufacturing/ManufacturingKanbanBoard";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";

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
) {
  mockKanbanColumns.mockClear();
  renderToStaticMarkup(
    React.createElement(ManufacturingKanbanBoard, {
      items: [manufacturingItem],
      membersById,
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
