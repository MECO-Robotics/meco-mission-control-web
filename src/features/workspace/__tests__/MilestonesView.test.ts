/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import {
  buildMilestoneSearchHighlightSegments,
  MilestoneSearchHighlight,
} from "@/features/workspace/views/milestones/MilestoneSearchHighlight";
import { buildMilestoneSearchSuggestions } from "@/features/workspace/views/milestones/milestonesViewUtils";
import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import type { BootstrapPayload } from "@/types/bootstrap";

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

  it("renders milestone filter and sort controls as icon overlays inside search", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
      }),
    );

    expect(markup).toContain("topbar-responsive-search-actions");
    expect(markup).toContain("--topbar-responsive-search-action-overlay-width:4rem");
    expect(markup).toContain("milestones-search-filter-menu");
    expect(markup).toContain("milestones-search-sort-menu");
    expect(markup).toContain('aria-label="Milestone filters"');
    expect(markup).toContain('aria-label="Sort milestones"');
    expect(markup).toContain("lucide-arrow-up-wide-narrow");
    expect(markup).not.toContain('aria-label="Sort direction"');
    expect(markup).not.toContain('class="toolbar-filter-value">Filters</span>');
    expect(markup).not.toContain('class="toolbar-filter-value">Sort</span>');
  });

  it("does not toggle milestone sort direction as a side effect of opening the sort menu", () => {
    const toolbarSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/milestones/MilestonesToolbar.tsx"),
      "utf8",
    );

    expect(toolbarSource).not.toContain("onButtonClick={() => setSortOrder");
    expect(toolbarSource).toContain('aria-label="Toggle milestone sort direction"');
  });

  it("closes milestone suggestions when keyboard focus moves into search actions", () => {
    const searchControlSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/milestones/MilestonesSearchControl.tsx"),
      "utf8",
    );

    expect(searchControlSource).toMatch(
      /target\.closest\("\.topbar-responsive-search-actions"\)\) \{[\s\S]*setIsSuggestionsOpen\(false\);[\s\S]*return;/,
    );
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

  it("builds contextual suggestions for milestone search matches", () => {
    const bootstrap = createBootstrap();
    const suggestions = buildMilestoneSearchSuggestions({
      milestones: bootstrap.milestones,
      projectLabelByMilestoneId: {
        "milestone-1": "Robot",
        "milestone-2": "Robot",
      },
      searchFilter: "robot",
    });

    expect(suggestions).toEqual([
      expect.objectContaining({
        context: expect.stringContaining("Competition"),
        description: "Competition readiness checkpoint",
        id: "milestone-1",
        title: "Regional",
      }),
      expect.objectContaining({
        context: expect.stringContaining("Blocked"),
        id: "milestone-2",
        title: "Design review",
      }),
    ]);
    expect(suggestions[0]?.context).toContain("Robot");
    expect(suggestions[0]?.context).toContain("Mar 10");
  });

  it("highlights milestone search keywords without changing the visible text", () => {
    expect(buildMilestoneSearchHighlightSegments("Robot robot readiness", "robot")).toEqual([
      { highlighted: true, text: "Robot" },
      { highlighted: false, text: " " },
      { highlighted: true, text: "robot" },
      { highlighted: false, text: " readiness" },
    ]);

    const markup = renderToStaticMarkup(
      React.createElement(MilestoneSearchHighlight, {
        searchFilter: "robot",
        text: "Robot checkpoint",
      }),
    );

    expect(markup).toContain('<mark class="milestone-search-highlight">Robot</mark>');
    expect(markup).toContain(" checkpoint");
  });
});
