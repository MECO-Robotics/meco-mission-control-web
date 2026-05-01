/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { localTodayDate, monthEndFromDay } from "@/features/workspace/shared/timelineDateUtils";
import {
  clampTimelineZoom,
  formatTimelineZoomLabel,
  getTimelineDayTrackSize,
  getTimelineGridMinWidth,
} from "@/features/workspace/shared/timelineZoom";
import { TimelineProjectGroup } from "@/features/workspace/views/timeline/TimelineProjectGroup";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import {
  buildTimelineData,
  buildTimelineDayMilestoneUnderlays,
  buildTimelineProjectRows,
  filterTimelineEventsByPersonSelection,
  getTimelineMilestonePopupItems,
} from "@/features/workspace/views/timeline/timelineViewModel";
import { TimelineSubsystemGroup } from "@/features/workspace/views/timeline/TimelineSubsystemGroup";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const appStylePaths = [
  "src/app/styles/shell.css",
  "src/app/styles/workspace.css",
  "src/app/styles/views.css",
  "src/app/styles/responsive.css",
].map((relativePath) => join(process.cwd(), relativePath));

function readAppCss() {
  return appStylePaths.map((path) => readFileSync(path, "utf8")).join("\n");
}

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
        code: "design",
        name: "Design",
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

function createTimelineEvent(
  overrides: Partial<BootstrapPayload["events"][number]>,
): BootstrapPayload["events"][number] {
  return {
    id: "event-1",
    title: "Design review",
    type: "internal-review",
    startDateTime: "2026-04-08T09:00:00.000Z",
    endDateTime: null,
    isExternal: false,
    description: "",
    projectIds: ["project-1"],
    relatedSubsystemIds: ["subsystem-1"],
    ...overrides,
  };
}

function createBootstrapWithDependency(): BootstrapPayload {
  const bootstrap = createBootstrap();

  return {
    ...bootstrap,
    tasks: [
      ...bootstrap.tasks,
      {
        ...bootstrap.tasks[0],
        id: "task-2",
        title: "Bumper mount drill pattern",
        startDate: "2026-04-11",
        dueDate: "2026-04-14",
        status: "not-started",
        dependencyIds: ["dep-1"],
      },
    ],
    taskDependencies: [
      {
        id: "dep-1",
        upstreamTaskId: "task-1",
        downstreamTaskId: "task-2",
        dependencyType: "finish_to_start",
        createdAt: "2026-04-01T00:00:00.000Z",
      },
    ],
  };
}

function createBootstrapWithTaskRows(taskCount: number): BootstrapPayload {
  const bootstrap = createBootstrap();
  const baseTask = bootstrap.tasks[0];

  return {
    ...bootstrap,
    tasks: Array.from({ length: taskCount }, (_, index) => ({
      ...baseTask,
      id: `task-${index + 1}`,
      title: `Frame rail layout ${index + 1}`,
    })),
  };
}

function createBootstrapWithScopedOverflowTasks(): BootstrapPayload {
  const bootstrap = createBootstrap();
  const baseTask = bootstrap.tasks[0];

  return {
    ...bootstrap,
    tasks: [
      {
        ...baseTask,
        id: "task-spills-left",
        title: "March carry-in",
        startDate: "2026-03-25",
        dueDate: "2026-04-03",
      },
      {
        ...baseTask,
        id: "task-spills-right",
        title: "May carry-out",
        startDate: "2026-04-28",
        dueDate: "2026-05-05",
      },
      {
        ...baseTask,
        id: "task-spills-both",
        title: "Full scoped span",
        startDate: "2026-03-25",
        dueDate: "2026-05-05",
      },
      {
        ...baseTask,
        id: "task-contained",
        title: "Contained scoped task",
        startDate: "2026-04-12",
        dueDate: "2026-04-14",
      },
    ],
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
          openTaskDetailModal: jest.fn(),
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
    "does not keep the absolute day overlay grid block when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );
      const bodySource = readFileSync(
        join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridBody.tsx"),
        "utf8",
      );

      expect(markup).toContain('data-timeline-grid-cell="true"');
      expect(bodySource).not.toContain("timelineSharedDayBackgrounds.length > 0 ? (");
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
          openTaskDetailModal: jest.fn(),
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
        markup.matchAll(/class="timeline-bar [^"]+"[^>]*style="([^"]+)"/g),
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
        expect(style).not.toContain("z-index:6");
      });
    },
  );

  it("keeps collapsed subsystem task bars on their own project-grid row", () => {
    const bootstrap = createBootstrap();
    const baseTask = bootstrap.tasks[0] as BootstrapPayload["tasks"][number];
    const firstSubsystemTask = {
      ...baseTask,
      id: "task-first",
      title: "First subsystem task",
      offset: 0,
      span: 2,
      spillsLeft: false,
      spillsRight: false,
    };
    const firstSubsystemSecondTask = {
      ...baseTask,
      id: "task-first-second",
      title: "First subsystem second task",
      offset: 1,
      span: 2,
      spillsLeft: false,
      spillsRight: false,
    };
    const secondSubsystemTask = {
      ...baseTask,
      id: "task-second",
      title: "Second collapsed task",
      subsystemId: "subsystem-2",
      subsystemIds: ["subsystem-2"],
      offset: 0,
      span: 2,
      spillsLeft: false,
      spillsRight: false,
    };
    const secondSubsystemSecondTask = {
      ...secondSubsystemTask,
      id: "task-second-two",
      title: "Second collapsed follow-up",
      offset: 1,
    };
    const markup = renderToStaticMarkup(
      React.createElement(TimelineProjectGroup, {
        clearHoveredMilestonePopup: jest.fn(),
        clearHoveredSubsystemRow: jest.fn(),
        clearHoveredTaskRow: jest.fn(),
        collapsedProjects: {},
        collapsedSubsystems: { "subsystem-2": true },
        disciplinesById: {
          "discipline-1": bootstrap.disciplines[0] as BootstrapPayload["disciplines"][number],
        },
        firstDayGridColumn: 3,
        gridMinWidth: 420,
        handleTimelineDayMouseEnter: jest.fn(),
        hoveredSubsystemId: null,
        hoverSubsystemRow: jest.fn(),
        hoverTaskRow: jest.fn(),
        openTaskDetailModal: jest.fn(),
        project: {
          id: "project-1",
          name: "Robot",
          completeCount: 0,
          taskCount: 4,
          tasks: [
            firstSubsystemTask,
            firstSubsystemSecondTask,
            secondSubsystemTask,
            secondSubsystemSecondTask,
          ],
          subsystems: [
            {
              id: "subsystem-1",
              name: "Drivebase",
              color: "#16478e",
              projectId: "project-1",
              projectName: "Robot",
              index: 0,
              completeCount: 0,
              taskCount: 2,
              tasks: [firstSubsystemTask, firstSubsystemSecondTask],
            },
            {
              id: "subsystem-2",
              name: "Controls",
              color: "#246847",
              projectId: "project-1",
              projectName: "Robot",
              index: 1,
              completeCount: 0,
              taskCount: 2,
              tasks: [secondSubsystemTask, secondSubsystemSecondTask],
            },
          ],
        },
        projectIndex: 0,
        selectSubsystemRow: jest.fn(),
        selectTaskRow: jest.fn(),
        selectedSubsystemId: null,
        showProjectCol: true,
        showSubsystemCol: true,
        statusIconColumnIndex: 3,
        statusIconColumnWidth: 36,
        statusIconStickyLeft: 240,
        subsystemColumnIndex: 2,
        subsystemStickyLeft: 112,
        taskDependencyCountsById: {},
        taskStatusSignalsById: {},
        timelineDayHeaderCells: [
          {
            day: "2026-04-06",
            weekdayLabel: "Mon",
            dayNumberLabel: "6",
            eventsOnDay: [],
            dayStyle: null,
            primaryEventStartDay: "",
            primaryEventEndDay: "",
          },
          {
            day: "2026-04-07",
            weekdayLabel: "Tue",
            dayNumberLabel: "7",
            eventsOnDay: [],
            dayStyle: null,
            primaryEventStartDay: "",
            primaryEventEndDay: "",
          },
        ],
        timelineGridTemplate: "112px 128px repeat(2, 24px)",
        toggleProject: jest.fn(),
        toggleSubsystem: jest.fn(),
      }),
    );
    const secondTaskBar = markup.match(
      /<button(?=[^>]*title="Second collapsed task)[^>]*style="([^"]+)"/,
    );

    expect(markup.match(/data-timeline-grid-cell="true"/g)?.length).toBe(6);
    expect(secondTaskBar?.[1]).toContain("grid-row:3");
    expect(secondTaskBar?.[1]).not.toContain("grid-row:1");
  });

  it("renders collapsed subsystem status icons as an overlay", () => {
    const bootstrap = createBootstrap();
    const baseTask = bootstrap.tasks[0] as BootstrapPayload["tasks"][number];
    const makeTimelineTask = (id: string, title: string) => ({
      ...baseTask,
      id,
      title,
      offset: 0,
      span: 1,
      spillsLeft: false,
      spillsRight: false,
    });
    const markup = renderToStaticMarkup(
      React.createElement(TimelineSubsystemGroup, {
        clearHoveredMilestonePopup: jest.fn(),
        clearHoveredSubsystemRow: jest.fn(),
        clearHoveredTaskRow: jest.fn(),
        collapsedSubsystems: { "subsystem-2": true },
        disciplinesById: {
          "discipline-1": bootstrap.disciplines[0] as BootstrapPayload["disciplines"][number],
        },
        firstDayGridColumn: 2,
        gridMinWidth: 420,
        handleTimelineDayMouseEnter: jest.fn(),
        hoveredSubsystemId: null,
        hoverSubsystemRow: jest.fn(),
        hoverTaskRow: jest.fn(),
        openTaskDetailModal: jest.fn(),
        selectSubsystemRow: jest.fn(),
        selectTaskRow: jest.fn(),
        selectedSubsystemId: null,
        showProjectCol: true,
        showSubsystemCol: true,
        statusIconColumnIndex: 2,
        statusIconColumnWidth: 36,
        statusIconStickyLeft: 128,
        subsystem: {
          id: "subsystem-2",
          name: "Controls",
          color: "#246847",
          projectId: "project-1",
          projectName: "Robot",
          index: 1,
          completeCount: 0,
          taskCount: 2,
          tasks: [
            makeTimelineTask("task-second", "Second task"),
            makeTimelineTask("task-third", "Third task"),
          ],
        },
        subsystemColumnIndex: 2,
        subsystemIndex: 1,
        subsystemStickyLeft: 112,
        taskDependencyCountsById: {},
        taskStatusSignalsById: {},
        timelineDayHeaderCells: [
          {
            day: "2026-04-06",
            weekdayLabel: "Mon",
            dayNumberLabel: "6",
            eventsOnDay: [],
            dayStyle: null,
            primaryEventStartDay: "",
            primaryEventEndDay: "",
          },
          {
            day: "2026-04-07",
            weekdayLabel: "Tue",
            dayNumberLabel: "7",
            eventsOnDay: [],
            dayStyle: null,
            primaryEventStartDay: "",
            primaryEventEndDay: "",
          },
        ],
        timelineGridTemplate: "128px repeat(2, 24px)",
        toggleSubsystem: jest.fn(),
      }),
    );

    const statusIndex = markup.indexOf('class="timeline-task-status-column"');
    expect(statusIndex).toBeGreaterThanOrEqual(0);

    const statusSnippet = markup.slice(statusIndex, statusIndex + 420);
    expect(statusSnippet).toContain("grid-column:2");
    expect(statusSnippet).toContain("timeline-task-status-icon-button");
  });

  it("lets collapsed project labels overflow past the right-side summary columns", () => {
    const bootstrap = createBootstrap();
    const baseTask = bootstrap.tasks[0] as BootstrapPayload["tasks"][number];
    const makeTimelineTask = (id: string, title: string) => ({
      ...baseTask,
      id,
      title,
      offset: 0,
      span: 1,
      spillsLeft: false,
      spillsRight: false,
    });
    const markup = renderToStaticMarkup(
      React.createElement(TimelineProjectGroup, {
        clearHoveredMilestonePopup: jest.fn(),
        clearHoveredSubsystemRow: jest.fn(),
        clearHoveredTaskRow: jest.fn(),
        collapsedProjects: { "project-1": true },
        collapsedSubsystems: {},
        disciplinesById: {
          "discipline-1": bootstrap.disciplines[0] as BootstrapPayload["disciplines"][number],
        },
        firstDayGridColumn: 3,
        gridMinWidth: 420,
        handleTimelineDayMouseEnter: jest.fn(),
        hoveredSubsystemId: null,
        hoverSubsystemRow: jest.fn(),
        hoverTaskRow: jest.fn(),
        openTaskDetailModal: jest.fn(),
        project: {
          id: "project-1",
          name: "Tutorial robot 2026",
          completeCount: 0,
          taskCount: 5,
          tasks: Array.from({ length: 5 }, (_, index) =>
            makeTimelineTask(`task-${index + 1}`, `Task ${index + 1}`),
          ),
          subsystems: Array.from({ length: 5 }, (_, index) => ({
            id: `subsystem-${index + 1}`,
            name: `Subsystem ${index + 1}`,
            color: "#16478e",
            projectId: "project-1",
            projectName: "Tutorial robot 2026",
            index,
            completeCount: 0,
            taskCount: 1,
            tasks: [makeTimelineTask(`task-${index + 1}`, `Task ${index + 1}`)],
          })),
        },
        projectIndex: 0,
        selectSubsystemRow: jest.fn(),
        selectTaskRow: jest.fn(),
        selectedSubsystemId: null,
        showProjectCol: true,
        showSubsystemCol: true,
        statusIconColumnIndex: 3,
        statusIconColumnWidth: 36,
        statusIconStickyLeft: 240,
        subsystemColumnIndex: 2,
        subsystemStickyLeft: 112,
        taskDependencyCountsById: {},
        taskStatusSignalsById: {},
        timelineDayHeaderCells: [
          {
            day: "2026-04-06",
            weekdayLabel: "Mon",
            dayNumberLabel: "6",
            eventsOnDay: [],
            dayStyle: null,
            primaryEventStartDay: "",
            primaryEventEndDay: "",
          },
        ],
        timelineGridTemplate: "112px 128px repeat(1, 24px)",
        toggleProject: jest.fn(),
        toggleSubsystem: jest.fn(),
      }),
    );

    expect(markup).toContain('data-timeline-column="project"');
    expect(markup).toContain("overflow:visible");
    expect(markup).toContain("5 subsystems / 5 tasks");
  });

  it("positions same-day milestone popup text to align with underlay lanes", () => {
    const morningEvent = createTimelineEvent({
      id: "event-b",
      title: "Morning review",
      startDateTime: "2026-04-08T09:00:00.000Z",
    });
    const afternoonEvent = createTimelineEvent({
      id: "event-a",
      title: "Afternoon review",
      startDateTime: "2026-04-08T14:00:00.000Z",
    });
    const underlays = buildTimelineDayMilestoneUnderlays({
      events: [afternoonEvent, morningEvent],
      resolveGeometry: () => ({
        left: 100,
        width: 24,
        centerX: 112,
        centerY: 80,
        bodyTop: 40,
        bodyHeight: 80,
      }),
      timelineDays: ["2026-04-08"],
    });
    const underlayTitlesLeftToRight = [...underlays]
      .sort(
        (left, right) =>
          left.geometry.left +
          left.horizontalOffset -
          (right.geometry.left + right.horizontalOffset),
      )
      .flatMap((underlay) => underlay.lines);

    expect(underlayTitlesLeftToRight).toEqual(["Morning review", "Afternoon review"]);
    expect(getTimelineMilestonePopupItems([morningEvent, afternoonEvent], underlays)).toEqual([
      { text: "Morning review", horizontalOffset: -9 },
      { text: "Afternoon review", horizontalOffset: 9 },
    ]);
  });

  it("dedupes collapsed project-row task counts when one task belongs to multiple subsystems", () => {
    const bootstrap = createBootstrap();
    const multiSubsystemTask = {
      ...bootstrap.tasks[0],
      id: "task-shared",
      title: "Shared drivetrain handoff",
      status: "complete" as const,
      subsystemId: "subsystem-1",
      subsystemIds: ["subsystem-1", "subsystem-2"],
    };
    const timeline = buildTimelineData({
      events: [],
      projectsById: {
        "project-1": bootstrap.projects[0] as BootstrapPayload["projects"][number],
      },
      scopedSubsystems: [
        bootstrap.subsystems[0] as BootstrapPayload["subsystems"][number],
        {
          ...bootstrap.subsystems[0],
          id: "subsystem-2",
          name: "Controls",
        } as BootstrapPayload["subsystems"][number],
      ],
      scopedTasks: [multiSubsystemTask],
      viewAnchorDate: "2026-04-15",
      viewInterval: "month",
    });
    const projectRows = buildTimelineProjectRows(timeline.subsystemRows);

    expect(timeline.subsystemRows).toHaveLength(2);
    expect(timeline.subsystemRows.map((row) => row.taskCount)).toEqual([1, 1]);
    expect(projectRows[0].taskCount).toBe(1);
    expect(projectRows[0].completeCount).toBe(1);
    expect(projectRows[0].tasks.map((task) => task.id)).toEqual(["task-shared"]);
  });

  it("applies active person filtering to timeline events through targeted tasks", () => {
    const bootstrap = createBootstrap();
    const matchingEvent = createTimelineEvent({
      id: "event-matching",
      title: "Ada design review",
    });
    const hiddenEvent = createTimelineEvent({
      id: "event-hidden",
      title: "Unassigned review",
      startDateTime: "2026-04-09T09:00:00.000Z",
    });
    const filteredEvents = filterTimelineEventsByPersonSelection({
      activePersonFilter: ["member-1"],
      events: [matchingEvent, hiddenEvent],
      tasks: [
        {
          ...bootstrap.tasks[0],
          id: "task-targeting-visible-event",
          targetEventId: "event-matching",
          ownerId: "member-1",
          assigneeIds: [],
          mentorId: null,
        },
        {
          ...bootstrap.tasks[0],
          id: "task-targeting-hidden-event",
          targetEventId: "event-hidden",
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
        },
      ],
    });

    expect(filteredEvents.map((event) => event.id)).toEqual(["event-matching"]);
  });

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
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );
      const css = readAppCss();
      const eventUnderlayZIndexes = Array.from(
        css.matchAll(
          /\.timeline-day-event-underlay\s*\{[^}]*z-index:\s*(\d+)/g,
        ),
        (match) => Number(match[1]),
      );
      const eventOverlayZIndexes = Array.from(
        css.matchAll(
          /\.timeline-day-event-(?:overlay-tooltip|overlay-column)\s*\{[^}]*z-index:\s*(\d+)/g,
        ),
        (match) => Number(match[1]),
      );
      const stickyLeftZIndexes = Array.from(
        markup.matchAll(/style="([^"]*position:sticky[^"]*left:[^"]*z-index:(\d+)[^"]*)"/g),
        (match) => Number(match[2]),
      );

      expect(eventUnderlayZIndexes.length).toBeGreaterThan(0);
      expect(eventOverlayZIndexes.length).toBeGreaterThan(0);
      expect(stickyLeftZIndexes.length).toBeGreaterThan(0);
      expect(Math.min(...stickyLeftZIndexes)).toBeGreaterThan(Math.max(...eventUnderlayZIndexes));
      expect(Math.max(...eventOverlayZIndexes)).toBeGreaterThan(Math.max(...stickyLeftZIndexes));
    },
  );

  it("layers hovered milestone overlays above timeline task bars while keeping underlays below them", () => {
    const css = readAppCss();
    const getZIndex = (selector: string) => {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = css.match(new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?z-index:\\s*(\\d+)`));

      expect(match).not.toBeNull();

      return Number(match?.[1] ?? 0);
    };

    const taskBarZIndex = getZIndex(".timeline-bar");

    expect(getZIndex(".timeline-day-event-overlay-column")).toBeGreaterThan(taskBarZIndex);
    expect(getZIndex(".timeline-day-event-overlay-tooltip")).toBeGreaterThan(taskBarZIndex);
    expect(getZIndex(".timeline-day-event-underlay")).toBeLessThan(taskBarZIndex);
  });

  it("keeps timeline row groups out of content-visibility stacking containment", () => {
    const css = readAppCss();

    expect(css).not.toMatch(
      /\.timeline-shell\s+\.subsystem-group[\s\S]{0,180}content-visibility:\s*auto/,
    );
  });

  it("treats month-view header day clicks as week drill-ins", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridHeader.tsx"),
      "utf8",
    );

    expect(markup).toContain('title="Open week of 2026-04-06"');
    expect(headerSource).toContain("onClick={() => handleTimelineHeaderDayClick(cell.day)}");
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
          openTaskDetailModal: jest.fn(),
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
    "hides subsystem rows with no tasks in the selected period when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithEmptySubsystem(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      expect(markup).not.toContain("Controls");
      expect(gridCellCount).toBe(30);
    },
  );

  it.each([false, true])(
    "hides all subsystem rows when every subsystem has no tasks and all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithoutTasks(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      expect(markup).not.toContain("Drivebase");
      expect(gridCellCount).toBe(0);
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
        openTaskDetailModal: jest.fn(),
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

  it("keeps month-end bounds in the same calendar month for month-edge dates", () => {
    expect(monthEndFromDay("2026-01-31")).toBe("2026-01-31");
    expect(monthEndFromDay("2026-04-30")).toBe("2026-04-30");
    expect(monthEndFromDay("2026-02-14")).toBe("2026-02-28");
  });

  it("marks the timeline grid as motion-capable for period changes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain('class="timeline-grid-motion"');
  });

  it("exposes timeline zoom controls and uses zoom to widen the grid", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();

    expect(markup).toContain('aria-label="Timeline zoom"');
    expect(markup).toContain('aria-label="Zoom out timeline"');
    expect(markup).toContain('aria-label="Zoom in timeline"');
    expect(markup).toContain("--timeline-zoom:1");
    expect(markup).toContain("--timeline-task-bar-edge-gap:24px");
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*--timeline-task-bar-padding-start:\s*calc\(0\.65rem \* var\(--timeline-zoom,\s*1\)\)/,
    );
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*padding:\s*0\s+var\(--timeline-task-status-edge-padding\)\s+0\s+var\(--timeline-task-bar-padding-start\)/,
    );
    expect(formatTimelineZoomLabel(1.2)).toBe("120%");
    expect(clampTimelineZoom(0.2)).toBe(0.8);
    expect(getTimelineDayTrackSize("month", 1)).toBe("minmax(28px, 1fr)");
    expect(getTimelineDayTrackSize("month", 1.6)).toBe("minmax(45px, 1fr)");
    expect(getTimelineDayTrackSize("week", 1, 388)).toBe(
      "minmax(calc((100vw - var(--shell-sidebar-width) - 388px) / 7 * 1), 1fr)",
    );
    expect(getTimelineDayTrackSize("week", 1.6, 388)).toBe(
      "minmax(calc((100vw - var(--shell-sidebar-width) - 388px) / 7 * 1.6), 1fr)",
    );
    expect(
      getTimelineGridMinWidth({
        dayCount: 10,
        hasProjectColumn: true,
        projectColumnWidth: 112,
        subsystemColumnWidth: 128,
        taskColumnWidth: 148,
        viewInterval: "week",
        zoom: 1.2,
      }),
    ).toBe(388);
  });

  it("defines timeline period animations for every timeline navigation direction", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="left"\]\s*\{[\s\S]*timeline-period-swipe-left-in/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="right"\]\s*\{[\s\S]*timeline-period-swipe-right-in/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="neutral"\]\s*\{[\s\S]*timeline-period-glide-in/,
    );
  });

  it("keeps timeline period animations from adding horizontal scroll overflow", () => {
    const css = readAppCss();
    const getKeyframesBlock = (name: string) => {
      const start = css.indexOf(`@keyframes ${name}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      let depth = 0;

      for (let index = blockStart; index < css.length; index += 1) {
        if (css[index] === "{") {
          depth += 1;
        }

        if (css[index] === "}") {
          depth -= 1;
        }

        if (depth === 0) {
          return css.slice(start, index + 1);
        }
      }

      return css.slice(start);
    };

    for (const keyframes of [
      "timeline-period-swipe-left-in",
      "timeline-period-swipe-right-in",
    ]) {
      expect(getKeyframesBlock(keyframes)).not.toMatch(
        /translate3d\(\s*-?\d+px\s*,\s*0\s*,\s*0\s*\)/,
      );
    }
  });

  it("clears timeline period motion after the interval change animation ends", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineView.tsx"),
      "utf8",
    );

    expect(source).toMatch(
      /const clearMotion = window\.setTimeout\(\(\) => \{[\s\S]*setTimelineGridMotion\([\s\S]*direction:\s*null,[\s\S]*\}, 180\);/,
    );
    expect(source).toMatch(/window\.clearTimeout\(clearMotion\);/);
  });

  it("only transitions timeline grid width during period motion", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion\]\s*\{[\s\S]*transition:\s*min-width 180ms ease,\s*grid-template-columns 180ms ease;/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\s*\{[\s\S]*will-change:\s*min-width,\s*grid-template-columns;/,
    );
  });

  it("keeps timeline shells and rows stretched to the available page width", () => {
    const css = readAppCss();

    expect(css).toMatch(/\.workspace-tab-panel\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-shell\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-grid-motion\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-layout\s*\{[\s\S]*width:\s*calc\(100vw - var\(--shell-sidebar-width\)\);/);
    expect(css).toMatch(/\.timeline-layout \.timeline-shell\s*\{[\s\S]*width:\s*calc\(100vw - var\(--shell-sidebar-width\) \+ 1rem\);/);
    expect(css).toMatch(/\.timeline-grid,\s*\.subsystem-row\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.subsystem-group\s*\{[\s\S]*width:\s*100%;/);
    expect(css).not.toMatch(/\.timeline-grid,\s*\.subsystem-group,\s*\.subsystem-row\s*\{[\s\S]*gap:/);
  });

  it("marks project, subsystem, and task columns as unfold-animation surfaces", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: true,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain("timeline-column-motion");
    expect(markup).toContain('data-timeline-column="project"');
    expect(markup).toContain('data-timeline-column="subsystem"');
    expect(markup).toContain('data-timeline-column="task"');
  });

  it("defines unfold animations for timeline columns and expanded rows", () => {
    const css = readAppCss();
    const getKeyframesBlock = (name: string) => {
      const start = css.indexOf(`@keyframes ${name}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      let depth = 0;

      for (let index = blockStart; index < css.length; index += 1) {
        if (css[index] === "{") {
          depth += 1;
        }

        if (css[index] === "}") {
          depth -= 1;
        }

        if (depth === 0) {
          return css.slice(start, index + 1);
        }
      }

      return css.slice(start);
    };

    expect(css).toMatch(
      /\.timeline-column-motion\[data-column-motion="unfolding"\]\s*\{[\s\S]*timeline-column-unfold-in 160ms/,
    );
    expect(css).toMatch(
      /\.timeline-row-motion\[data-row-motion="unfolding"\][\s\S]*timeline-row-unfold-in 160ms/,
    );
    expect(getKeyframesBlock("timeline-column-unfold-in")).not.toMatch(/transform:/);
    expect(getKeyframesBlock("timeline-row-unfold-in")).not.toMatch(/transform:/);
  });

  it("keeps timeline period and filter motion subtle", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="left"\]\s*\{[\s\S]*timeline-period-swipe-left-in 180ms/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="right"\]\s*\{[\s\S]*timeline-period-swipe-right-in 180ms/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="neutral"\]\s*\{[\s\S]*timeline-period-glide-in 160ms/,
    );
    expect(css).toMatch(
      /@keyframes filter-results-settle\s*\{[\s\S]*opacity: 0\.98/,
    );
  });

  it("prevents timeline label reveal overlays from doubling visible source text", () => {
    const css = readAppCss();
    const getRule = (selectorStart: string, options?: { pseudo?: boolean }) => {
      let start = css.indexOf(selectorStart);
      while (start >= 0) {
        const blockStart = css.indexOf("{", start);
        const selector = css.slice(start, blockStart);
        const hasPseudo = selector.includes("::after");
        if (options?.pseudo === undefined || options.pseudo === hasPseudo) {
          const blockEnd = css.indexOf("}", blockStart);

          return css.slice(start, blockEnd + 1);
        }

        start = css.indexOf(selectorStart, blockStart);
      }

      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      const blockEnd = css.indexOf("}", blockStart);

      return css.slice(start, blockEnd + 1);
    };

    const revealRule = getRule(".timeline-ellipsis-reveal[data-full-text]::after", { pseudo: true });
    expect(revealRule).toMatch(/color:\s*var\(--timeline-reveal-color/);
    expect(revealRule).toMatch(
      /background:\s*var\(--timeline-reveal-background,\s*var\(--timeline-task-discipline-accent,\s*var\(--bg-panel\)\)\)/,
    );
    expect(getRule(".timeline-ellipsis-reveal[data-full-text]:hover", { pseudo: false })).toMatch(
      /color:\s*transparent/,
    );
    expect(
      getRule(".timeline-merged-cell-column:hover .timeline-ellipsis-reveal[data-full-text]", {
        pseudo: false,
      }),
    ).toMatch(/color:\s*transparent/);
    expect(css).toMatch(
      /\.timeline-merged-cell-column:hover,\s*\.timeline-merged-cell-column:focus-within\s*\{[\s\S]*?z-index:\s*10045/,
    );
    expect(css).toMatch(
      /\.task-label:hover,\s*\.task-label:focus-visible,\s*\.timeline-merged-cell-text:hover,\s*\.timeline-merged-cell-text:focus-within,\s*\.timeline-merged-cell-text:focus-visible\s*\{[\s\S]*?z-index:\s*10045/,
    );
  });

  it("lets unfolded sideways timeline labels use the full row span before truncating", () => {
    const css = readAppCss();
    const getRule = (selectorStart: string) => {
      const start = css.indexOf(selectorStart);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      const blockEnd = css.indexOf("}", blockStart);

      return css.slice(start, blockEnd + 1);
    };

    const rotatedRule = getRule(".timeline-merged-cell-text.is-rotated");
    expect(rotatedRule).toMatch(/writing-mode:\s*vertical-rl/);
    expect(rotatedRule).toMatch(/text-orientation:\s*mixed/);
    expect(rotatedRule).toMatch(
      /transform:\s*rotate\(var\(--timeline-merged-cell-rotation,\s*240deg\)\)/,
    );
    expect(rotatedRule).toMatch(/max-height:\s*calc\(100% - 16px\)/);
    expect(rotatedRule).not.toMatch(/rotate\(-90deg\)/);

    expect(
      getRule(".timeline-merged-cell-text.is-rotated .timeline-merged-cell-title"),
    ).toMatch(/max-height:\s*100%/);
  });

  it("uses 180deg rotation for four-row labels", () => {
    const fourRowMarkup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithTaskRows(4),
        isAllProjectsView: true,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(fourRowMarkup).toContain("timeline-merged-cell-text is-rotated");
    expect(fourRowMarkup).toContain("--timeline-merged-cell-rotation:180deg");
    expect(fourRowMarkup).not.toContain("--timeline-merged-cell-rotation:240deg");
  });

  it("keeps six-task subsystem labels on the 180deg branch in all-projects view", () => {
    const sixRowMarkup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithTaskRows(6),
        isAllProjectsView: true,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(sixRowMarkup).toContain("--timeline-merged-cell-rotation:180deg");
    expect(sixRowMarkup).not.toContain("--timeline-merged-cell-rotation:240deg");
  });

  it("uses discipline-led task styling, neutral left labels, and status logos on timeline bars", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();

    expect(markup).toContain("--timeline-task-discipline-accent:#c67b1f");
    expect(markup).toMatch(/class="[^"]*timeline-bar[^"]*timeline-in-progress[^"]*"/);
    expect(markup).toMatch(/class="[^"]*timeline-merged-cell-title[^"]*"/);
    expect(markup).toMatch(
      /class="timeline-task-status-logo timeline-task-status-logo-in-progress timeline-task-status-logo-signal-in-progress"/,
    );
    expect(markup).not.toContain("↙");
    expect(markup).not.toContain("↗");
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*background:\s*var\(--timeline-task-discipline-accent\)/);
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*--timeline-task-status-edge-padding:\s*calc\(0\.05rem \* var\(--timeline-zoom,\s*1\)\)/,
    );
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*--timeline-task-status-track-height:\s*2\.2rem/);
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*--timeline-task-status-size:\s*1\.9rem/);
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*padding:\s*0\s+var\(--timeline-task-status-edge-padding\)\s+0\s+var\(--timeline-task-bar-padding-start\)/,
    );
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*box-shadow:\s*0 8px 18px rgba\(15, 28, 52, 0\.18\)/);
    expect(css).toMatch(/\.timeline-bar-content\s*\{[\s\S]*width:\s*100%/);
    expect(css).toMatch(/\.\s*editable-hover-indicator\.editable-hover-indicator-compact\s*\{[\s\S]*right:\s*-\s*0\.04rem/);
    expect(css).toMatch(
      /\.timeline-task-status-logo\s*\{[\s\S]*right:\s*var\(\s*--timeline-task-status-right,\s*calc\(/,
    );
    expect(css).toMatch(
      /\.timeline-task-status-logo\s*\{[\s\S]*--timeline-task-status-logo-background:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/,
    );
    expect(css).toMatch(
      /\.timeline-task-status-logo\s*\{[\s\S]*background:\s*var\(--timeline-task-status-logo-background\)/,
    );
    expect(css).toMatch(/\.timeline-task-status-logo\s*\{[\s\S]*width:\s*var\(--timeline-task-status-size\)/);
    expect(css).toMatch(/\.timeline-task-status-logo\.is-compact\s*\{[\s\S]*--timeline-task-status-track-height:\s*1rem/);
    expect(css).toMatch(/\.timeline-task-status-logo\.is-compact\s*\{[\s\S]*--timeline-task-status-size:\s*0\.9rem/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-in-progress\s*\{[\s\S]*color:\s*#b77900/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-waiting-for-qa\s*\{[\s\S]*color:\s*#275098/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-blocked\s*\{[\s\S]*color:\s*var\(--official-red\)/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-waiting-on-dependency\s*\{[\s\S]*color:\s*#c25a14/);
    expect(css).toMatch(/\.task-label\.timeline-task-label\s*\{[\s\S]*background:\s*var\(--timeline-task-row-fill\)/);
    expect(css).toMatch(/\.task-label\.timeline-task-label\s*\{[\s\S]*box-shadow:\s*inset 3px 0 0 var\(--timeline-task-discipline-accent\)/);
    expect(css).toMatch(/\.timeline-in-progress\s*\{[\s\S]*--timeline-task-status-accent:\s*#b77900/);
    expect(css).toMatch(/\.task-label\.timeline-task-label-in-progress\s*\{[\s\S]*--timeline-task-status-accent:\s*#b77900/);
    expect(css).toMatch(/\.task-label\.timeline-task-label-complete\s*\{[\s\S]*--timeline-task-status-accent:\s*#246847/);
  });

  it("fades timeline task bars when tasks continue outside the scoped view", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithScopedOverflowTasks(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();
    const getTaskBarStyle = (title: string) => {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = markup.match(new RegExp(`<button[^>]*style="([^"]*)"[^>]*title="${escapedTitle}"`));

      expect(match).not.toBeNull();

      return match?.[1] ?? "";
    };

    expect(markup).toContain('title="View details for March carry-in"');
    expect(markup).toMatch(/<button[^>]*data-spill-left="true"[^>]*title="View details for March carry-in"/);
    expect(markup).toMatch(/<button[^>]*data-spill-right="true"[^>]*title="View details for May carry-out"/);
    expect(markup).toMatch(
      /<button[^>]*data-spill-left="true"[^>]*data-spill-right="true"[^>]*title="View details for Full scoped span"/,
    );
    expect(css).toMatch(/\.timeline-bar\[data-spill-left="true"\]/);
    expect(css).toMatch(/\.timeline-bar\[data-spill-right="true"\]/);
    expect(css).toContain("--timeline-bar-overflow-fade");
    expect(css).toContain("--timeline-bar-overflow-edge-mask: rgba(0, 0, 0, 0.42)");
    expect(css).toContain("var(--timeline-bar-overflow-edge-mask) 0");
    expect(css).toContain("var(--timeline-bar-overflow-edge-mask) 100%");
    expect(css).toContain("-webkit-mask-image");
    expect(css).toContain("mask-image");
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*border-radius:\s*var\(--timeline-task-bar-radius,\s*999px\)/);
    expect(css).toMatch(
      /\.timeline-bar\[data-spill-left="true"\]\s*\{[\s\S]*border-top-left-radius:\s*0[\s\S]*border-bottom-left-radius:\s*0/,
    );
    expect(css).toMatch(
      /\.timeline-bar\[data-spill-right="true"\]\s*\{[\s\S]*border-top-right-radius:\s*0[\s\S]*border-bottom-right-radius:\s*0/,
    );
    expect(getTaskBarStyle("View details for March carry-in")).toContain("margin-left:0");
    expect(getTaskBarStyle("View details for March carry-in")).toContain(
      "margin-right:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("padding-right:24px");
    expect(getTaskBarStyle("View details for March carry-in")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("border-top-left-radius:0");
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("border-bottom-left-radius:0");
    expect(getTaskBarStyle("View details for May carry-out")).toContain("margin-right:0");
    expect(getTaskBarStyle("View details for May carry-out")).toContain(
      "margin-left:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("padding-left:24px");
    expect(getTaskBarStyle("View details for May carry-out")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("border-top-right-radius:0");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("border-bottom-right-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("margin-left:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("margin-right:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-top-left-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-top-right-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-bottom-left-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-bottom-right-radius:0");
    expect(getTaskBarStyle("View details for Contained scoped task")).toContain(
      "margin-left:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for Contained scoped task")).toContain(
      "margin-right:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for Contained scoped task")).not.toContain("padding-left:24px");
    expect(getTaskBarStyle("View details for Contained scoped task")).not.toContain("padding-right:24px");
  });

  it("uses task discipline and subsystem colors for timeline horizontal highlights", () => {
    const css = readAppCss();
    const portalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineRowHighlightsPortal.tsx"),
      "utf8",
    );
    const helperSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/timelineTaskColors.ts"),
      "utf8",
    );

    expect(css).toMatch(/\.timeline-row-highlight\s*\{[\s\S]*background:\s*var\(--timeline-row-highlight-selected-fill,\s*rgba\(22,\s*71,\s*142,\s*0\.08\)\)/);
    expect(css).toMatch(/\.timeline-row-highlight\.is-hovered\s*\{[\s\S]*background:\s*var\(--timeline-row-highlight-hover-fill,\s*rgba\(22,\s*71,\s*142,\s*0\.16\)\)/);
    expect(portalSource).toContain("resolveTaskRowHighlightStyle");
    expect(portalSource).toContain("...selectedHighlightStyle");
    expect(portalSource).toContain("...hoveredHighlightStyle");
    expect(helperSource).toContain('"--timeline-row-highlight-selected-fill"');
    expect(helperSource).toContain('"--timeline-row-highlight-hover-fill"');
    expect(helperSource).toContain("buildTimelineSubsystemHighlightStyle");
  });

  it("keeps sticky timeline label columns opaque while rows are hovered", () => {
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );

    expect(projectGroupSource).not.toContain('? "transparent"');
    expect(subsystemGroupSource).not.toContain('? "transparent"');
    expect(projectGroupSource).not.toContain("getTimelineRowHighlightHoverFill");
    expect(projectGroupSource).not.toContain("getTimelineRowHighlightSelectedFill");
    expect(subsystemGroupSource).not.toContain("getTimelineRowHighlightHoverFill");
    expect(subsystemGroupSource).not.toContain("getTimelineRowHighlightSelectedFill");
  });

  it("suppresses sticky label hover reveal while the timeline shell is scrolling", () => {
    const css = readAppCss();
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridHeader.tsx"),
      "utf8",
    );
    const overlayHookSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/useTimelineMilestoneOverlay.ts"),
      "utf8",
    );

    expect(headerSource).toContain('data-is-scrolling={isScrolling ? "true" : undefined}');
    expect(overlayHookSource).toContain('setIsTimelineShellScrolling(true)');
    expect(overlayHookSource).toContain('setIsTimelineShellScrolling(false)');
    expect(css).toContain('.timeline-shell[data-is-scrolling="true"] .timeline-ellipsis-reveal[data-full-text]:hover');
    expect(css).toContain('.timeline-shell[data-is-scrolling="true"] .timeline-merged-cell-column:hover .timeline-ellipsis-reveal[data-full-text]');
  });

  it("marks the current day as a unique timeline column highlight", () => {
    const todayDay = localTodayDate();
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();
    const portalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineTodayMarkerPortal.tsx"),
      "utf8",
    );
    const overlaySource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/useTimelineMilestoneOverlay.ts"),
      "utf8",
    );

    expect(markup).toContain(`data-timeline-day="${todayDay}"`);
    expect(markup).not.toContain('class="timeline-day is-today"');
    expect(markup).not.toContain('class="timeline-day-slot is-today"');
    expect(portalSource).toContain("timeline-today-marker-column");
    expect(portalSource).toContain("timeline-today-marker-line");
    expect(portalSource).toContain("Today");
    expect(overlaySource).toContain("offsetLeft");
    expect(css).toMatch(/\.timeline-today-marker-line\s*\{[\s\S]*position:\s*absolute/);
    expect(css).toMatch(/\.timeline-today-marker-column\s*\{[\s\S]*position:\s*absolute/);
    expect(css).toMatch(/\.timeline-today-marker-line\s*\{[\s\S]*width:\s*2px/);
    expect(css).toMatch(/\.timeline-today-marker-label\s*\{[\s\S]*font-weight:\s*800/);
  });

  it("keeps subsystem accent strips on every sticky timeline subsystem surface", () => {
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );

    expect(subsystemGroupSource).toContain('boxShadow: `inset 3px 0 0 ${accentColor}`');
    expect(projectGroupSource).toContain('boxShadow: `inset 3px 0 0 ${subsystem.color}`');
  });

  it.each([
    [false, "2 / -1", "2 / -1"],
    [true, "3 / -1", "3 / -1"],
  ])(
    "starts timeline row highlight anchors after sticky label columns when all-projects view is %s",
    (isAllProjectsView, expectedTaskAnchor, expectedSubsystemAnchor) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      expect(markup).toMatch(
        new RegExp(`data-timeline-row-anchor="task:task-1" style="[^"]*grid-row:1;grid-column:${expectedTaskAnchor.replace("/", "\\/")}`),
      );
      expect(markup).toMatch(
        new RegExp(`data-timeline-row-anchor="subsystem:subsystem-1" style="[^"]*grid-row:1 / span 1;grid-column:${expectedSubsystemAnchor.replace("/", "\\/")}`),
      );
    },
  );

  it("keeps left timeline task labels title-only with tighter row height", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithDependency(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();
    const daySlotsSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridDaySlots.tsx"),
      "utf8",
    );
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );

    expect(markup).not.toContain("timeline-task-label-owner");
    expect(markup).not.toContain("Depends on");
    expect(markup).not.toContain("Blocks");
    expect(markup).toContain("min-height:38px");
    expect(daySlotsSource).toContain('minHeight: "38px"');
    expect(projectGroupSource).toContain('gridAutoRows: "38px"');
    expect(subsystemGroupSource).toContain('gridAutoRows: "38px"');
    expect(css).toMatch(/\.timeline-row-highlight-anchor\s*\{[\s\S]*min-height:\s*38px/);
  });
});
