/// <reference types="jest" />
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TimelineProjectGroup } from "@/features/workspace/views/timeline/TimelineProjectGroup";
import { TimelineTaskStatusCell } from "@/features/workspace/views/timeline/TimelineTaskStatusCell";
import { resolveTimelineRowHighlightStyle } from "@/features/workspace/views/timeline/timelineTaskColors";
import { TimelineSubsystemGroup } from "@/features/workspace/views/timeline/TimelineSubsystemGroup";
import { createBootstrap } from "../timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
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
        statusIconColumnIndex: 4,
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
            weekdayNarrowLabel: "M",
            dayNumberLabel: "6",
            milestonesOnDay: [],
            dayStyle: null,
            primaryMilestoneStartDay: "",
            primaryMilestoneEndDay: "",
          },
          {
            day: "2026-04-07",
            weekdayLabel: "Tue",
            weekdayNarrowLabel: "T",
            dayNumberLabel: "7",
            milestonesOnDay: [],
            dayStyle: null,
            primaryMilestoneStartDay: "",
            primaryMilestoneEndDay: "",
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
        statusIconColumnIndex: 3,
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
            weekdayNarrowLabel: "M",
            dayNumberLabel: "6",
            milestonesOnDay: [],
            dayStyle: null,
            primaryMilestoneStartDay: "",
            primaryMilestoneEndDay: "",
          },
          {
            day: "2026-04-07",
            weekdayLabel: "Tue",
            weekdayNarrowLabel: "T",
            dayNumberLabel: "7",
            milestonesOnDay: [],
            dayStyle: null,
            primaryMilestoneStartDay: "",
            primaryMilestoneEndDay: "",
          },
        ],
        timelineGridTemplate: "128px repeat(2, 24px)",
        toggleSubsystem: jest.fn(),
      }),
    );

    const statusIndex = markup.indexOf('class="timeline-task-status-column"');
    expect(statusIndex).toBeGreaterThanOrEqual(0);

    const statusSnippet = markup.slice(statusIndex, statusIndex + 420);
    expect(statusSnippet).toContain("grid-column:3");
    expect(statusSnippet).toContain("width:36px");
    expect(statusSnippet).toContain("justify-content:flex-end");
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
        statusIconColumnIndex: 3,
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

});
