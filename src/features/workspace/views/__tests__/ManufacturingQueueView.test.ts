/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { CncView } from "@/features/workspace/views/manufacturing/CncView";
import { PrintsView } from "@/features/workspace/views/manufacturing/PrintsView";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const bootstrap: BootstrapPayload = {
  ...EMPTY_BOOTSTRAP,
  members: [
    {
      id: "member-1",
      name: "Student",
      email: "student@meco.test",
      role: "student",
      elevated: false,
      seasonId: "season-1",
    },
  ],
  subsystems: [
    {
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
  ],
  materials: [
    {
      id: "material-1",
      name: "Aluminum 6061",
      category: "metal",
      unit: "sheet",
      onHandQuantity: 1,
      reorderPoint: 1,
      location: "Rack",
      vendor: "",
      notes: "",
    },
  ],
};

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

describe("ManufacturingQueueView", () => {
  it("shows the in-house source column for CNC jobs only", () => {
    const cncMarkup = renderToStaticMarkup(
      React.createElement(CncView, {
        activePersonFilter: [],
        bootstrap,
        items: [manufacturingItem],
        membersById: { "member-1": bootstrap.members[0] },
        onCreate: jest.fn(),
        onEdit: jest.fn(),
        onQuickStatusChange: jest.fn(),
        showMentorQuickActions: true,
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
      }),
    );

    const printMarkup = renderToStaticMarkup(
      React.createElement(PrintsView, {
        activePersonFilter: [],
        bootstrap,
        items: [{ ...manufacturingItem, process: "3d-print" }],
        membersById: { "member-1": bootstrap.members[0] },
        onCreate: jest.fn(),
        onEdit: jest.fn(),
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
      }),
    );

    expect(cncMarkup).toContain("Outsourced");
    expect(cncMarkup).toContain("cnc-approve-job-button");
    expect(cncMarkup).toContain("cnc-complete-job-button");
    expect(printMarkup).not.toContain("Source");
    expect(printMarkup).not.toContain("Outsourced");
    expect(printMarkup).not.toContain("cnc-approve-job-button");
    expect(printMarkup).not.toContain("cnc-complete-job-button");
  });
});
