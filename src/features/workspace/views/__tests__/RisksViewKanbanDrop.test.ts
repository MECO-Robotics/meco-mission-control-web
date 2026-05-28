/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { RisksView } from "@/features/workspace/views/RisksView";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskSeverity } from "@/types/common";
import type { RiskPayload } from "@/types/payloads";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

interface CapturedKanbanColumnsProps {
  onItemDrop?: (
    risk: BootstrapPayload["risks"][number],
    targetState: RiskSeverity,
    sourceState: RiskSeverity,
  ) => void | Promise<void>;
}

const mockKanbanColumns = jest.fn((props: CapturedKanbanColumnsProps) => {
  void props;
  return null;
});

jest.mock("@/features/workspace/views/kanban/KanbanColumns", () => ({
  KanbanColumns: (props: CapturedKanbanColumnsProps) => mockKanbanColumns(props),
}));

const risk: BootstrapPayload["risks"][number] = {
  id: "risk-1",
  title: "Drive overheating",
  detail: "Motor controller temperature spike",
  severity: "medium",
  sourceType: "qa-report",
  sourceId: "report-1",
  attachmentType: "project",
  attachmentId: "project-1",
  mitigationTaskId: null,
};

const bootstrap: BootstrapPayload = {
  ...EMPTY_BOOTSTRAP,
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
  risks: [risk],
};

function renderView(onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>) {
  mockKanbanColumns.mockClear();
  renderToStaticMarkup(
    React.createElement(RisksView, {
      activePersonFilter: [],
      bootstrap,
      isAllProjectsView: true,
      onCreateRisk: jest.fn(),
      onDeleteRisk: jest.fn(),
      onUpdateRisk,
      view: "kanban",
    }),
  );

  const firstCall = mockKanbanColumns.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected KanbanColumns to render");
  }

  return firstCall[0];
}

describe("RisksView kanban drops", () => {
  it("ignores repeated risk severity drops while an update is pending", async () => {
    let resolveFirstChange!: () => void;
    const onUpdateRisk = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstChange = resolve;
        }),
    );
    const kanbanProps = renderView(onUpdateRisk);

    const firstDrop = kanbanProps.onItemDrop?.(risk, "high", "medium");
    const secondDrop = kanbanProps.onItemDrop?.(risk, "low", "medium");

    expect(onUpdateRisk).toHaveBeenCalledTimes(1);
    resolveFirstChange();
    await firstDrop;
    await secondDrop;
    expect(onUpdateRisk).toHaveBeenCalledWith(
      "risk-1",
      expect.objectContaining({ severity: "high" }),
    );
  });
});
