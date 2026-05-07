/// <reference types="jest" />
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TimelineProjectGroup } from "@/features/workspace/views/timeline/TimelineProjectGroup";
import { buildTimelineData, buildTimelineDayMilestoneUnderlays, buildTimelineProjectRows, filterTimelineMilestonesByPersonSelection, getTimelineMilestonePopupItems } from "@/features/workspace/views/timeline/timelineViewModel";
import { createBootstrap, createTimelineMilestone } from "../timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
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
        isWeekView: true,
        showProjectCol: true,
        showSubsystemCol: true,
        statusIconColumnIndex: 3,
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
        ],
        timelineGridTemplate: "112px 128px repeat(1, 24px)",
        toggleProject: jest.fn(),
        toggleSubsystem: jest.fn(),
      }),
    );

    expect(markup).toContain('data-timeline-column="project"');
    expect(markup).toContain("width:100%");
    expect(markup).toContain("overflow:visible");
    expect(markup).toContain("5 subsystems / 5 tasks");
  });

  it("positions same-day milestone popup text to align with underlay lanes", () => {
    const morningMilestone = createTimelineMilestone({
      id: "milestone-b",
      title: "Morning review",
      startDateTime: "2026-04-08T09:00:00.000Z",
    });
    const afternoonMilestone = createTimelineMilestone({
      id: "milestone-a",
      title: "Afternoon review",
      startDateTime: "2026-04-08T14:00:00.000Z",
    });
    const underlays = buildTimelineDayMilestoneUnderlays({
      milestones: [afternoonMilestone, morningMilestone],
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
    expect(getTimelineMilestonePopupItems([morningMilestone, afternoonMilestone], underlays)).toEqual([
      { text: "Morning review", horizontalOffset: -9 },
      { text: "Afternoon review", horizontalOffset: 9 },
    ]);
  });

  it("widens milestone lane spacing as zoom increases", () => {
    const firstMilestone = createTimelineMilestone({
      id: "milestone-a",
      title: "First review",
      startDateTime: "2026-04-08T09:00:00.000Z",
    });
    const secondMilestone = createTimelineMilestone({
      id: "milestone-b",
      title: "Second review",
      startDateTime: "2026-04-08T14:00:00.000Z",
    });
    const underlays = buildTimelineDayMilestoneUnderlays({
      milestones: [firstMilestone, secondMilestone],
      resolveGeometry: () => ({
        left: 100,
        width: 24,
        centerX: 112,
        centerY: 80,
        bodyTop: 40,
        bodyHeight: 80,
      }),
      timelineDays: ["2026-04-08"],
      timelineZoom: 2,
    });

    expect(getTimelineMilestonePopupItems([firstMilestone, secondMilestone], underlays)).toEqual([
      { text: "First review", horizontalOffset: -18 },
      { text: "Second review", horizontalOffset: 18 },
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
      isAllProjectsView: true,
      milestones: [],
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

  it("applies active person filtering to timeline milestones through targeted tasks", () => {
    const bootstrap = createBootstrap();
    const matchingMilestone = createTimelineMilestone({
      id: "milestone-matching",
      title: "Ada design review",
    });
    const hiddenMilestone = createTimelineMilestone({
      id: "milestone-hidden",
      title: "Unassigned review",
      startDateTime: "2026-04-09T09:00:00.000Z",
    });
    const filteredMilestones = filterTimelineMilestonesByPersonSelection({
      activePersonFilter: ["member-1"],
      milestones: [matchingMilestone, hiddenMilestone],
      tasks: [
        {
          ...bootstrap.tasks[0],
          id: "task-targeting-visible-milestone",
          targetMilestoneId: "milestone-matching",
          ownerId: "member-1",
          assigneeIds: [],
          mentorId: null,
        },
        {
          ...bootstrap.tasks[0],
          id: "task-targeting-hidden-milestone",
          targetMilestoneId: "milestone-hidden",
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
        },
      ],
    });

    expect(filteredMilestones.map((milestone) => milestone.id)).toEqual(["milestone-matching"]);
  });

});
