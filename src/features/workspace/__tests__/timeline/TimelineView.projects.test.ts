/// <reference types="jest" />
import * as React from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { buildTimelineData, buildTimelineDayHeaderCells, buildTimelineProjectRows, filterTimelineMilestonesByPersonSelection } from "@/features/workspace/views/timeline/timelineViewModel";
import { createBootstrap, createTimelineMilestone } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  it("dedupes collapsed project-row task counts when one task belongs to multiple subsystems", () => {
    const bootstrap = createBootstrap();
    const multiSubsystemTask = {
      ...bootstrap.tasks[0],
      id: "task-shared",
      title: "Shared drivetrain handoff",
      status: "complete" as const,
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

  it("maps scheduled meetings onto timeline day headers without converting them to milestones", () => {
    const bootstrap = createBootstrap();
    const timeline = buildTimelineData({
      isAllProjectsView: true,
      meetings: [
        {
          id: "meeting-build-night",
          title: "Build night",
          meetingType: "build",
          seasonId: "season-1",
          projectIds: ["project-1"],
          startAt: "2026-04-08T18:00:00",
          endAt: "2026-04-08T20:00:00",
          location: "Lab",
          description: "",
        },
      ],
      milestones: [],
      projectsById: {
        "project-1": bootstrap.projects[0] as BootstrapPayload["projects"][number],
      },
      scopedSubsystems: [],
      scopedTasks: [],
      viewAnchorDate: "2026-04-08",
      viewInterval: "week",
    });
    const headerCells = buildTimelineDayHeaderCells(
      timeline.days,
      timeline.dayMilestones,
      timeline.dayMeetings,
    );
    const meetingDay = headerCells.find((cell) => cell.day === "2026-04-08");

    expect(timeline.dayMilestones["2026-04-08"]).toBeUndefined();
    expect(meetingDay?.meetingsOnDay.map((meeting) => meeting.title)).toEqual(["Build night"]);
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
      startAt: "2026-04-09T09:00:00.000Z",
    });
    const filteredMilestones = filterTimelineMilestonesByPersonSelection({
      activePersonFilter: ["member-1"],
      milestones: [matchingMilestone, hiddenMilestone],
      tasks: [
        {
          ...bootstrap.tasks[0],
          id: "task-targeting-visible-milestone",
          scheduleRefs: [{ kind: "milestone", id: "milestone-matching" }],
          ownerId: "member-1",
          assigneeIds: [],
          mentorId: null,
        },
        {
          ...bootstrap.tasks[0],
          id: "task-targeting-hidden-milestone",
          scheduleRefs: [{ kind: "milestone", id: "milestone-hidden" }],
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
        },
      ],
    });

    expect(filteredMilestones.map((milestone) => milestone.id)).toEqual(["milestone-matching"]);
  });

});
