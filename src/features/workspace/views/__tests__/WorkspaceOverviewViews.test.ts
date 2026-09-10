/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { HomeView } from "@/features/workspace/views/overview";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const fixedToday = new Date("2026-05-17T12:00:00");

function createOverviewBootstrap() {
  const base = createBootstrap();
  const [project] = base.projects;
  const [workstream] = base.workstreams;
  const [subsystem] = base.subsystems;
  const [discipline] = base.disciplines;

  return createBootstrap({
    tasks: [
      {
        ...base.tasks[0],
        id: "task-overdue",
        title: "Finish bellypan CAD",
        projectId: project.id,
        workstreamId: workstream.id,
        workstreamIds: [workstream.id],
        subsystemId: subsystem.id,
        subsystemIds: [subsystem.id],
        disciplineId: discipline.id,
        dueDate: "2026-05-16",
        priority: "critical",
        planningState: "overdue",
      },
      {
        ...base.tasks[0],
        id: "task-today",
        title: "Wire intake sensor",
        projectId: project.id,
        workstreamId: workstream.id,
        workstreamIds: [workstream.id],
        subsystemId: subsystem.id,
        subsystemIds: [subsystem.id],
        disciplineId: discipline.id,
        dueDate: "2026-05-17",
        priority: "high",
        status: "in-progress",
      },
      {
        ...base.tasks[0],
        id: "task-soon",
        title: "Review shooter checklist",
        projectId: project.id,
        workstreamId: workstream.id,
        workstreamIds: [workstream.id],
        subsystemId: subsystem.id,
        subsystemIds: [subsystem.id],
        disciplineId: discipline.id,
        dueDate: "2026-05-19",
        priority: "medium",
      },
      {
        ...base.tasks[0],
        id: "task-later",
        title: "Later media recap",
        projectId: project.id,
        workstreamId: workstream.id,
        workstreamIds: [workstream.id],
        subsystemId: subsystem.id,
        subsystemIds: [subsystem.id],
        disciplineId: discipline.id,
        dueDate: "2026-06-15",
        priority: "low",
      },
    ],
    milestones: [
      {
        ...base.milestones[0],
        id: "milestone-soon",
        title: "Drive practice deadline",
        startDateTime: "2026-05-20T18:00:00.000Z",
      },
    ],
    risks: [
      {
        id: "risk-high",
        title: "Battery cart not inspected",
        detail: "Inspection checklist is still open.",
        severity: "high",
        sourceType: "qa-report",
        sourceId: "report-1",
        attachmentType: "project",
        attachmentId: project.id,
        mitigationTaskId: null,
      },
    ],
  });
}

describe("Workspace overview views", () => {
  it("shows actionable near-term work and upcoming milestones", () => {
    const markup = renderToStaticMarkup(React.createElement(HomeView, {
      bootstrap: createOverviewBootstrap(), onOpenTask: jest.fn(), today: fixedToday,
    }));
    expect(markup).toContain("Priority work");
    expect(markup).toContain("Upcoming milestones");
    expect(markup).toContain("Drive practice deadline");
    expect(markup).toContain("Finish bellypan CAD");
    expect(markup).toContain("Wire intake sensor");
    expect(markup).not.toContain("Later media recap");
    expect(markup).not.toContain("Schedule pressure");
  });
  it("keeps completed tasks out of the priority list", () => {
    const bootstrap = createOverviewBootstrap();
    bootstrap.tasks = bootstrap.tasks.map(task => ({ ...task, status: "complete" }));
    const markup = renderToStaticMarkup(React.createElement(HomeView, {
      bootstrap, onOpenTask: jest.fn(), today: fixedToday,
    }));
    expect(markup).toContain("No near-term task deadlines.");
    expect(markup).not.toContain("Finish bellypan CAD");
    expect(markup).toContain("Drive practice deadline");
  });
});
