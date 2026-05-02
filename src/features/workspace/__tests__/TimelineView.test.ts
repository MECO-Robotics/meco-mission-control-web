/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { BootstrapPayload } from "@/types";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { TimelineProjectGroup } from "@/features/workspace/views/timeline/TimelineProjectGroup";
import { TimelineTaskStatusCell } from "@/features/workspace/views/timeline/TimelineTaskStatusCell";
import { resolveTimelineRowHighlightStyle } from "@/features/workspace/views/timeline/timelineTaskColors";
import { buildTimelineData, buildTimelineDayMilestoneUnderlays, buildTimelineProjectRows, filterTimelineEventsByPersonSelection, getTimelineMilestonePopupItems } from "@/features/workspace/views/timeline/timelineViewModel";
import { TimelineSubsystemGroup } from "@/features/workspace/views/timeline/TimelineSubsystemGroup";
import { createBootstrap, createTimelineEvent, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

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
        statusIconColumnIndex: 5,
        statusIconColumnWidth: 36,
        statusIconStickyRight: 0,
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
        timelineGridTemplate: "112px 128px repeat(2, 24px) 36px",
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
        statusIconColumnIndex: 4,
        statusIconColumnWidth: 36,
        statusIconStickyRight: 0,
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
        timelineGridTemplate: "128px repeat(2, 24px) 36px",
        toggleSubsystem: jest.fn(),
      }),
    );

    const statusIndex = markup.indexOf('class="timeline-task-status-column"');
    expect(statusIndex).toBeGreaterThanOrEqual(0);

    const statusSnippet = markup.slice(statusIndex, statusIndex + 420);
    expect(statusSnippet).toContain("grid-column:4");
    expect(statusSnippet).toContain("right:0px");
    expect(statusSnippet).toContain("timeline-task-status-icon-button");
  });

  it("marks the timeline status caption open when the row is highlighted", () => {
    const bootstrap = createBootstrap();
    const task = bootstrap.tasks[0] as BootstrapPayload["tasks"][number];
    const markup = renderToStaticMarkup(
      React.createElement(TimelineTaskStatusCell, {
        clearHoveredMilestonePopup: jest.fn(),
        clearHoveredTaskRow: jest.fn(),
        gridRow: "1",
        hoverTaskRow: jest.fn(),
        isHighlighted: true,
        onOpenTask: jest.fn(),
        ownerId: "project-1",
        statusIconColumnIndex: 4,
        statusIconColumnWidth: 36,
        statusIconStickyRight: 0,
        task,
        taskStatusSignalsById: {},
      }),
    );

    expect(markup).toContain("is-row-highlighted");
    expect(markup).toContain("timeline-task-status-caption");
  });

  it("keeps single-task subsystem highlights on the subsystem color", () => {
    const bootstrap = createBootstrap();
    const subsystem = bootstrap.subsystems[0] as BootstrapPayload["subsystems"][number];
    const style = resolveTimelineRowHighlightStyle(
      `subsystem:${subsystem.id}`,
      Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task])),
      Object.fromEntries(bootstrap.subsystems.map((row) => [row.id, row])),
      Object.fromEntries(bootstrap.disciplines.map((discipline) => [discipline.id, discipline])),
    );
    const highlightStyle = style as Record<string, string | undefined> | null;
    const selectedFill = highlightStyle?.["--timeline-row-highlight-selected-fill"];
    const hoverFill = highlightStyle?.["--timeline-row-highlight-hover-fill"];
    const subsystemColor = "#4F86C6";
    const disciplineColor = "#c67b1f";

    expect(selectedFill).toContain(subsystemColor);
    expect(hoverFill).toContain(subsystemColor);
    expect(selectedFill).not.toContain(disciplineColor);
    expect(hoverFill).not.toContain(disciplineColor);
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
        statusIconColumnIndex: 5,
        statusIconColumnWidth: 36,
        statusIconStickyRight: 0,
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
        timelineGridTemplate: "112px 128px repeat(1, 24px) 36px",
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

});
