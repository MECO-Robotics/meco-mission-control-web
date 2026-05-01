/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { RisksView } from "@/features/workspace/views";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const memberOne = {
  id: "member-1",
  name: "Alex Builder",
  email: "alex@example.com",
  role: "student" as const,
  elevated: false,
  seasonId: "season-1",
};

const memberTwo = {
  ...memberOne,
  id: "member-2",
  name: "Blair Fabricator",
  email: "blair@example.com",
};

const baseTask: BootstrapPayload["tasks"][number] = {
  id: "task-1",
  projectId: "project-1",
  workstreamId: null,
  workstreamIds: [],
  subsystemId: "subsystem-1",
  subsystemIds: ["subsystem-1"],
  disciplineId: "",
  mechanismId: null,
  mechanismIds: [],
  partInstanceId: null,
  partInstanceIds: [],
  title: "Member one task",
  summary: "",
  targetEventId: null,
  photoUrl: "",
  ownerId: "member-1",
  assigneeIds: [],
  mentorId: null,
  startDate: "2026-04-20",
  dueDate: "2026-04-22",
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
};

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    members: [memberOne, memberTwo],
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
        color: "#123456",
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
    tasks: [
      baseTask,
      {
        ...baseTask,
        id: "task-2",
        title: "Member two task",
        ownerId: "member-2",
      },
    ],
    reports: [
      {
        id: "report-1",
        reportType: "QA",
        projectId: "project-1",
        workstreamId: null,
        taskId: "task-1",
        eventId: null,
        title: "QA one",
        summary: "",
        result: "pass",
        mentorApproved: true,
        createdByMemberId: "member-1",
        notes: "",
        reviewedAt: "2026-04-20",
        createdAt: "2026-04-20T00:00:00.000Z",
      },
      {
        id: "report-2",
        reportType: "QA",
        projectId: "project-1",
        workstreamId: null,
        taskId: "task-2",
        eventId: null,
        title: "QA two",
        summary: "",
        result: "pass",
        mentorApproved: true,
        createdByMemberId: "member-2",
        notes: "",
        reviewedAt: "2026-04-21",
        createdAt: "2026-04-21T00:00:00.000Z",
      },
    ],
    qaReports: [],
    risks: [
      {
        id: "risk-1",
        title: "Member one risk",
        detail: "Only Alex should see this",
        severity: "medium",
        sourceType: "qa-report",
        sourceId: "report-1",
        attachmentType: "project",
        attachmentId: "project-1",
        mitigationTaskId: "task-1",
      },
      {
        id: "risk-2",
        title: "Member two risk",
        detail: "Blair owns this",
        severity: "medium",
        sourceType: "qa-report",
        sourceId: "report-2",
        attachmentType: "project",
        attachmentId: "project-1",
        mitigationTaskId: "task-2",
      },
    ],
  };
}

describe("RisksView", () => {
  it("filters risk rows by the global active person filter", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RisksView, {
        activePersonFilter: ["member-1"],
        bootstrap: createBootstrap(),
        onCreateRisk: jest.fn(),
        onDeleteRisk: jest.fn(),
        onUpdateRisk: jest.fn(),
        view: "risks",
      }),
    );

    expect(markup).toContain("Member one risk");
    expect(markup).not.toContain("Member two risk");
  });
});
