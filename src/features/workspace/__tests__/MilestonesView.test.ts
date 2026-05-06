/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model";
import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
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
      {
        id: "member-2",
        name: "Jordan Mentor",
        email: "jordan@example.com",
        role: "mentor",
        elevated: true,
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
    milestones: [
      {
        id: "milestone-1",
        title: "Regional",
        type: "competition",
        status: "ready",
        startDateTime: "2026-03-10T14:00:00.000Z",
        endDateTime: null,
        isExternal: true,
        description: "Competition readiness checkpoint",
        projectIds: ["project-1"],
      },
      {
        id: "milestone-2",
        title: "Design review",
        type: "deadline",
        status: "blocked",
        startDateTime: "2026-03-12T14:00:00.000Z",
        endDateTime: null,
        isExternal: false,
        description: "Subsystem review",
        projectIds: ["project-1"],
      },
    ],
    milestoneRequirements: [
      {
        id: "milestone-2:scope:subsystem:subsystem-1",
        milestoneId: "milestone-2",
        targetType: "subsystem",
        targetId: "subsystem-1",
        conditionType: "iteration",
        conditionValue: "iteration = 1",
        required: true,
        sortOrder: 1,
        notes: "",
      },
    ],
    tasks: [
      {
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
        title: "Prep robot",
        summary: "Prepare for regional",
        status: "in-progress",
        ownerId: "member-1",
        assigneeIds: [],
        mentorId: null,
        startDate: "2026-03-01",
        dueDate: "2026-03-09",
        priority: "high",
        targetMilestoneId: "milestone-1",
        dependencyIds: [],
        blockers: [],
        isBlocked: false,
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 0,
        actualHours: 0,
        requiresDocumentation: false,
        documentationLinked: false,
      },
      {
        id: "task-2",
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
        title: "Review drawings",
        summary: "Prepare review deck",
        status: "not-started",
        ownerId: "member-2",
        assigneeIds: [],
        mentorId: null,
        startDate: "2026-03-02",
        dueDate: "2026-03-11",
        priority: "medium",
        targetMilestoneId: null,
        dependencyIds: [],
        blockers: [],
        isBlocked: false,
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 0,
        actualHours: 0,
        requiresDocumentation: false,
        documentationLinked: false,
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
  };
}

describe("MilestonesView", () => {
  it("renders milestones as kanban columns grouped by status", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
      }),
    );

    expect(markup).toContain("task-queue-board");
    expect(markup).toContain("milestone-board");
    expect(markup).toContain("task-queue-board-column");
    expect(markup).toContain("task-queue-board-card");
    expect(markup).toContain("Not started");
    expect(markup).toContain("In progress");
    expect(markup).toContain("task-queue-zoom-controls");
    expect(markup).toContain("task-queue-zoom-label");
    expect(markup).toContain("100%");
    expect(markup).toContain("--task-queue-board-column-width:calc(15.5rem * 1)");
    expect((markup.match(/task-queue-board-card-due/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(markup).toContain("task-queue-board-card-type-badge");
    expect(markup).toContain("Milestone type: Competition");
  });

  it("renders milestone type badges with the shared type palette", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
      }),
    );

    expect(markup).toContain("milestone-type-pill");
    expect(markup).toContain("Milestone type: Competition");
  });

  it("filters milestones to the active person via linked tasks", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        activePersonFilter: ["member-1"],
        bootstrap,
        isAllProjectsView: false,
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
      }),
    );

    expect(markup).toContain("Regional");
    expect(markup).toContain("Design review");
    expect(markup).toContain("Showing 2 milestones.");
  });

  it("falls back to the default style label when an milestone type is invalid", () => {
    const bootstrap = createBootstrap();
    bootstrap.milestones = [
      {
        ...bootstrap.milestones[0],
        id: "milestone-legacy",
        title: "Legacy milestone",
        type: "milestone" as never,
      },
    ];

    const render = () =>
      renderToStaticMarkup(
        React.createElement(MilestonesView, {
          activePersonFilter: [],
          bootstrap,
          isAllProjectsView: false,
          onDeleteTimelineMilestone: jest.fn(),
          onSaveTimelineMilestone: jest.fn(),
        }),
      );

    expect(render).not.toThrow();
    expect(render()).toContain("Internal review");
    expect(render()).toContain("Legacy milestone");
  });
});
