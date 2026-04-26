/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { TimelineView } from "@/features/workspace/views/TimelineView";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    seasons: [
      {
        id: "season-1",
        name: "2026",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
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
    members: [
      {
        id: "member-1",
        name: "Ada",
        email: "ada@example.com",
        role: "lead",
        elevated: true,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drivebase",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [
      {
        id: "discipline-1",
        code: "mechanical",
        name: "Mechanical",
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        workstreamId: null,
        workstreamIds: [],
        title: "Frame rail layout",
        summary: "",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        disciplineId: "discipline-1",
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        targetEventId: null,
        ownerId: "member-1",
        assigneeIds: ["member-1"],
        mentorId: null,
        startDate: "2026-04-06",
        dueDate: "2026-04-10",
        priority: "high",
        status: "in-progress",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 4,
        actualHours: 1,
        requiresDocumentation: false,
        documentationLinked: false,
      },
    ],
  };
}

function createBootstrapWithEmptySubsystem(): BootstrapPayload {
  const bootstrap = createBootstrap();

  return {
    ...bootstrap,
    subsystems: [
      ...bootstrap.subsystems,
      {
        id: "subsystem-empty",
        projectId: "project-1",
        name: "Controls",
        description: "",
        iteration: 1,
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
  };
}

function createBootstrapWithoutTasks(): BootstrapPayload {
  return {
    ...createBootstrap(),
    tasks: [],
  };
}

const membersById = {
  "member-1": {
    id: "member-1",
    name: "Ada",
    email: "ada@example.com",
    role: "lead" as const,
    elevated: true,
    seasonId: "season-1",
  },
};

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([false, true])(
    "renders row day cells for visible timeline gridlines when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openEditTaskModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      expect(markup).toContain('data-timeline-grid-cell="true"');
      expect(markup).toContain("border-right:1px solid var(--border-base)");
    },
  );

  it.each([false, true])(
    "layers timeline task bars above row gridlines when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openEditTaskModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      const gridCellStyles = Array.from(
        markup.matchAll(/data-timeline-grid-cell="true"[^>]*style="([^"]+)"/g),
        (match) => match[1],
      );
      const taskBarStyles = Array.from(
        markup.matchAll(/class="timeline-bar [^"]+" style="([^"]+)"/g),
        (match) => match[1],
      );

      expect(gridCellStyles.length).toBeGreaterThan(0);
      expect(taskBarStyles.length).toBeGreaterThan(0);
      gridCellStyles.forEach((style) => {
        expect(style).toContain("position:relative");
        expect(style).toContain("z-index:0");
      });
      taskBarStyles.forEach((style) => {
        expect(style).toContain("position:relative");
        expect(style).toContain("z-index:6");
      });
    },
  );

  it.each([false, true])(
    "layers sticky left columns above timeline events when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openEditTaskModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );
      const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");
      const eventLayerZIndexes = Array.from(
        css.matchAll(
          /\.timeline-day-event-(?:overlay-tooltip|overlay-column|underlay)\s*\{[^}]*z-index:\s*(\d+)/g,
        ),
        (match) => Number(match[1]),
      );
      const stickyLeftZIndexes = Array.from(
        markup.matchAll(/style="([^"]*position:sticky[^"]*left:[^"]*z-index:(\d+)[^"]*)"/g),
        (match) => Number(match[2]),
      );

      expect(eventLayerZIndexes.length).toBeGreaterThan(0);
      expect(stickyLeftZIndexes.length).toBeGreaterThan(0);
      expect(Math.min(...stickyLeftZIndexes)).toBeGreaterThan(Math.max(...eventLayerZIndexes));
    },
  );

  it("keeps timeline row groups out of content-visibility stacking containment", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");

    expect(css).not.toMatch(
      /\.timeline-shell\s+\.subsystem-group[\s\S]{0,180}content-visibility:\s*auto/,
    );
  });

  it.each([false, true])(
    "keeps timeline rows out of their own stacking context when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openEditTaskModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      const rowStyles = Array.from(
        markup.matchAll(/class="subsystem-group" style="([^"]+)"/g),
        (match) => match[1],
      );

      expect(rowStyles.length).toBeGreaterThan(0);
      rowStyles.forEach((style) => {
        expect(style).not.toContain("z-index:");
      });
    },
  );

  it.each([false, true])(
    "renders day grid cells for empty subsystem rows when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithEmptySubsystem(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openEditTaskModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      expect(markup).toContain("Controls");
      expect(gridCellCount).toBe(60);
    },
  );

  it.each([false, true])(
    "renders subsystem rows when every subsystem has no tasks and all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithoutTasks(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openEditTaskModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      expect(markup).toContain("Drivebase");
      expect(gridCellCount).toBe(30);
    },
  );

  it("renders month navigation controls for the default month view", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openEditTaskModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain('aria-label="Previous month"');
    expect(markup).toContain('aria-label="Next month"');
    expect(markup).toContain("April 2026");
  });
});
