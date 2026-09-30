/// <reference types="jest" />

import type { BootstrapPayload } from "@/types/bootstrap";
import { buildTimelineData } from "@/features/workspace/views/timeline/timelineViewModel";
import { createBootstrap, createTimelineMilestone } from "./timelineTestFixtures";

describe("timeline event day indexing", () => {
  it("keeps local calendar dates stable in UTC+14", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati";

    try {
      const bootstrap = createBootstrap();
      const timeline = buildTimelineData({
        isAllProjectsView: true,
        milestones: [],
        projectsById: {
          "project-1": bootstrap.projects[0] as BootstrapPayload["projects"][number],
        },
        scopedSubsystems: [],
        scopedTasks: [],
        viewAnchorDate: "2026-04-08",
        viewInterval: "week",
      });

      expect(timeline.days).toEqual([
        "2026-04-05",
        "2026-04-06",
        "2026-04-07",
        "2026-04-08",
        "2026-04-09",
        "2026-04-10",
        "2026-04-11",
      ]);
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });

  it("clips event ranges to the visible week and preserves their date ordering", () => {
    const bootstrap = createBootstrap();
    const timeline = buildTimelineData({
      isAllProjectsView: true,
      milestones: [
        createTimelineMilestone({
          id: "milestone-visible-late",
          startDateTime: "2026-04-08T09:00:00.000Z",
        }),
        createTimelineMilestone({
          id: "milestone-clipped",
          startDateTime: "2026-04-04T09:00:00.000Z",
          endDateTime: "2026-04-08T17:00:00.000Z",
        }),
        createTimelineMilestone({
          id: "milestone-outside",
          startDateTime: "2026-04-13T09:00:00.000Z",
        }),
      ],
      meetings: [
        {
          id: "meeting-clipped",
          title: "Clipped meeting",
          meetingType: "build",
          seasonId: "season-1",
          projectIds: ["project-1"],
          startDateTime: "2026-04-04T18:00:00.000Z",
          endDateTime: "2026-04-08T20:00:00.000Z",
          location: "Lab",
          description: "",
          date: "2026-04-04",
          time: "18:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
        {
          id: "meeting-visible-late",
          title: "Visible meeting",
          meetingType: "build",
          seasonId: "season-1",
          projectIds: ["project-1"],
          startDateTime: "2026-04-08T21:00:00.000Z",
          endDateTime: "2026-04-10T20:00:00.000Z",
          location: "Lab",
          description: "",
          date: "2026-04-08",
          time: "21:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
        {
          id: "meeting-outside",
          title: "Outside meeting",
          meetingType: "build",
          seasonId: "season-1",
          projectIds: ["project-1"],
          startDateTime: "2026-04-13T21:00:00.000Z",
          endDateTime: "2026-04-14T20:00:00.000Z",
          location: "Lab",
          description: "",
          date: "2026-04-13",
          time: "21:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
      ] satisfies NonNullable<BootstrapPayload["meetings"]>,
      projectsById: {
        "project-1": bootstrap.projects[0] as BootstrapPayload["projects"][number],
      },
      scopedSubsystems: [],
      scopedTasks: [],
      viewAnchorDate: "2026-04-08",
      viewInterval: "week",
    });

    expect(timeline.dayMilestones["2026-04-06"]?.map(({ id }) => id)).toEqual([
      "milestone-clipped",
    ]);
    expect(timeline.dayMilestones["2026-04-08"]?.map(({ id }) => id)).toEqual([
      "milestone-clipped",
      "milestone-visible-late",
    ]);
    expect(Object.values(timeline.dayMilestones).flat().map(({ id }) => id)).not.toContain(
      "milestone-outside",
    );
    expect(timeline.dayMeetings["2026-04-06"]?.map(({ id }) => id)).toEqual([
      "meeting-clipped",
    ]);
    expect(timeline.dayMeetings["2026-04-08"]?.map(({ id }) => id)).toEqual([
      "meeting-clipped",
      "meeting-visible-late",
    ]);
    expect(timeline.dayMeetings["2026-04-10"]?.map(({ id }) => id)).toEqual([
      "meeting-visible-late",
    ]);
    expect(Object.values(timeline.dayMeetings).flat().map(({ id }) => id)).not.toContain(
      "meeting-outside",
    );
    expect(timeline.dayMeetings["2026-04-11"]).toBeUndefined();
  });
});
