/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { ReportsView } from "@/features/workspace/views/ReportsView";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const QA_TASK: TaskRecord = {
  id: "task-qa",
  projectId: "project-qa",
  workstreamId: null,
  workstreamIds: [],
  title: "QA task",
  summary: "Needs signature and review",
  subsystemId: "subsystem-1",
  subsystemIds: [],
  disciplineId: "design",
  mechanismId: null,
  mechanismIds: [],
  partInstanceId: null,
  partInstanceIds: [],
  targetMilestoneId: null,
  ownerId: null,
  assigneeIds: [],
  mentorId: null,
  startDate: "2026-01-01",
  dueDate: "2026-01-02",
  priority: "high",
  status: "waiting-for-qa",
  dependencyIds: [],
  blockers: [],
  linkedManufacturingIds: [],
  linkedPurchaseIds: [],
  estimatedHours: 1,
  actualHours: 0,
  requiresDocumentation: false,
  documentationLinked: false,
};

const ACTIVE_TASK: TaskRecord = {
  ...QA_TASK,
  id: "task-in-progress",
  title: "Active task",
  status: "in-progress",
};

const PAST_MILESTONE = {
  id: "milestone-past",
  title: "Past milestone",
  type: "practice" as const,
  startDateTime: "2000-01-01T00:00:00.000Z",
  endDateTime: "2000-01-01T01:00:00.000Z",
  isExternal: false,
  description: "past milestone",
  projectIds: [],
};

const FUTURE_MILESTONE = {
  id: "milestone-future",
  title: "Future milestone",
  type: "competition" as const,
  startDateTime: "2099-12-31T00:00:00.000Z",
  endDateTime: null,
  isExternal: false,
  description: "future milestone",
  projectIds: [],
};

function renderReportsView() {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    tasks: [QA_TASK, ACTIVE_TASK],
    milestones: [PAST_MILESTONE, FUTURE_MILESTONE],
  };

  return renderToStaticMarkup(
    React.createElement(ReportsView, {
      bootstrap,
      openCreateMilestoneReportModal: jest.fn(),
      openCreateQaReportModal: jest.fn(),
      openTaskDetailsModal: jest.fn(),
      view: "qa",
    }),
  );
}

describe("ReportsView", () => {
  it("shows QA waiting tasks in QA view", () => {
    const html = renderReportsView();

    expect(html).toContain("QA reports");
    expect(html).toContain("QA task");
    expect(html).toContain("Open task details");
    expect(html).not.toContain("Active task");
  });

  it("lists only past milestones in Milestone Results view", () => {
    const bootstrap: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      milestones: [PAST_MILESTONE, FUTURE_MILESTONE],
      tasks: EMPTY_BOOTSTRAP.tasks,
    };
    const html = renderToStaticMarkup(
      React.createElement(ReportsView, {
        bootstrap,
        openCreateMilestoneReportModal: jest.fn(),
        openCreateQaReportModal: jest.fn(),
        openTaskDetailsModal: jest.fn(),
        view: "milestone-results",
      }),
    );

    expect(html).toContain("Milestone results");
    expect(html).toContain(PAST_MILESTONE.title);
    expect(html).not.toContain(FUTURE_MILESTONE.title);
  });
});
