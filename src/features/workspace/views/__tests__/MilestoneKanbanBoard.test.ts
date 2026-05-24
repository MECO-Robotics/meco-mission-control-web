/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { MilestoneKanbanBoard } from "@/features/workspace/views/milestones/MilestoneKanbanBoard";
import type { MilestoneStatus } from "@/types/common";
import type { MilestoneRecord } from "@/types/recordsExecution";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const milestone: MilestoneRecord = {
  id: "milestone-1",
  title: "Design review",
  type: "deadline",
  status: "not ready",
  startDateTime: "2026-03-12T14:00:00.000Z",
  endDateTime: null,
  isExternal: false,
  description: "Subsystem review",
  projectIds: ["project-1"],
};

interface CapturedKanbanColumnsProps {
  renderItem: (
    item: MilestoneRecord,
    state: MilestoneStatus,
  ) => React.ReactNode;
  onItemDrop?: (
    item: MilestoneRecord,
    targetState: MilestoneStatus,
    sourceState: MilestoneStatus,
  ) => void | Promise<void>;
}

const mockKanbanColumns = jest.fn((props: CapturedKanbanColumnsProps) => {
  void props;
  return null;
});

jest.mock("@/features/workspace/views/kanban/KanbanColumns", () => ({
  KanbanColumns: (props: CapturedKanbanColumnsProps) => mockKanbanColumns(props),
}));

function renderBoard(onMilestoneDragBlocked = jest.fn()) {
  mockKanbanColumns.mockClear();
  renderToStaticMarkup(
    React.createElement(MilestoneKanbanBoard, {
      bootstrap: EMPTY_BOOTSTRAP,
      milestones: [milestone],
      onMilestoneDragBlocked,
      onOpenMilestone: jest.fn(),
      projectLabelByMilestoneId: {},
      searchFilter: "",
    }),
  );

  const firstCall = mockKanbanColumns.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected KanbanColumns to render");
  }

  return firstCall[0];
}

describe("MilestoneKanbanBoard", () => {
  it("does not expose drag-drop milestone reassignment", () => {
    const kanbanProps = renderBoard();

    expect(kanbanProps.onItemDrop).toBeUndefined();
  });

  it("blocks milestone drag attempts with an error message", () => {
    const onMilestoneDragBlocked = jest.fn();
    const kanbanProps = renderBoard(onMilestoneDragBlocked);
    const renderedItem = kanbanProps.renderItem(milestone, "not ready");
    if (!React.isValidElement(renderedItem)) {
      throw new Error("Expected milestone card to render as an element");
    }
    const renderedCard = renderedItem as React.ReactElement<{
      onDragStart: (event: { preventDefault: () => void }) => void;
    }>;
    const preventDefault = jest.fn();

    renderedCard.props.onDragStart({ preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onMilestoneDragBlocked).toHaveBeenCalledWith(
      "Milestone drag reassignment is disabled. Open the milestone to change its status.",
    );
  });

  it("blocks pointer drag attempts before native drag starts", () => {
    const onMilestoneDragBlocked = jest.fn();
    const kanbanProps = renderBoard(onMilestoneDragBlocked);
    const renderedItem = kanbanProps.renderItem(milestone, "not ready");
    if (!React.isValidElement(renderedItem)) {
      throw new Error("Expected milestone card to render as an element");
    }
    const renderedCard = renderedItem as React.ReactElement<{
      onPointerDown: (event: { button: number; clientX: number; clientY: number }) => void;
      onPointerMove: (event: { clientX: number; clientY: number; preventDefault: () => void }) => void;
    }>;
    const preventDefault = jest.fn();

    renderedCard.props.onPointerDown({ button: 0, clientX: 10, clientY: 10 });
    renderedCard.props.onPointerMove({ clientX: 40, clientY: 14, preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onMilestoneDragBlocked).toHaveBeenCalledWith(
      "Milestone drag reassignment is disabled. Open the milestone to change its status.",
    );
  });
});
