/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import {
  buildTaskCalendarEvents,
  isTaskDueSoon,
} from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { BootstrapPayload } from "@/types/bootstrap";

describe("buildTaskCalendarEvents", () => {
  it("treats a local date-only deadline as due today", () => {
    expect(isTaskDueSoon("2026-05-07", new Date(2026, 4, 7, 8))).toBe(true);
  });

  it("uses scheduled meeting timestamps and project context", () => {
    const bootstrap = {
      ...EMPTY_BOOTSTRAP,
      projects: [
        {
          id: "project-robot",
          seasonId: "season-1",
          name: "Robot 2026",
          projectType: "robot" as const,
          description: "",
          status: "active" as const,
        },
      ],
      meetings: [
        {
          id: "build-night",
          title: "Build night",
          meetingType: "build" as const,
          seasonId: "season-1",
          projectIds: ["project-robot"],
          startDateTime: "2026-05-07T18:00:00",
          endDateTime: "2026-05-07T20:00:00",
          location: "Lab",
          description: "Drivebase planning.",
          date: "2026-05-07",
          time: "18:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
      ],
    } satisfies BootstrapPayload;

    const events = buildTaskCalendarEvents({
      activePersonFilter: [],
      bootstrap,
      isAllProjectsView: true,
      projectsById: {
        "project-robot": bootstrap.projects[0],
      },
    });
    const meetingEvent = events.find((event) => event.id === "meeting:build-night");

    expect(meetingEvent?.start).toBe("2026-05-07T18:00:00");
    expect(meetingEvent?.extendedProps.projectId).toBe("project-robot");
    expect(meetingEvent?.extendedProps.contextLabel).toBe("Robot 2026");
    expect(meetingEvent?.extendedProps.status).toBe("build");
    expect(meetingEvent?.title).toBe("Robot 2026 | Meeting: Build night");
  });

  it("filters scheduled meetings to the active project scope", () => {
    const bootstrap = {
      ...EMPTY_BOOTSTRAP,
      projects: [
        {
          id: "project-robot",
          seasonId: "season-1",
          name: "Robot 2026",
          projectType: "robot" as const,
          description: "",
          status: "active" as const,
        },
      ],
      meetings: [
        {
          id: "visible-meeting",
          title: "Visible build night",
          meetingType: "build" as const,
          seasonId: "season-1",
          projectIds: ["project-robot"],
          startDateTime: "2026-05-07T18:00:00",
          endDateTime: "2026-05-07T20:00:00",
          location: "Lab",
          description: "",
          date: "2026-05-07",
          time: "18:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
        {
          id: "global-meeting",
          title: "All projects sync",
          meetingType: "general" as const,
          seasonId: "season-1",
          projectIds: [],
          startDateTime: "2026-05-08T18:00:00",
          endDateTime: null,
          location: "",
          description: "",
          date: "2026-05-08",
          time: "18:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
        {
          id: "hidden-meeting",
          title: "Hidden outreach sync",
          meetingType: "outreach" as const,
          seasonId: "season-1",
          projectIds: ["project-outreach"],
          startDateTime: "2026-05-09T18:00:00",
          endDateTime: null,
          location: "",
          description: "",
          date: "2026-05-09",
          time: "18:00",
          rsvpsYes: 0,
          rsvpsMaybe: 0,
          openSignIns: 0,
        },
      ],
    } satisfies BootstrapPayload;

    const events = buildTaskCalendarEvents({
      activePersonFilter: [],
      bootstrap,
      isAllProjectsView: false,
      projectsById: {
        "project-robot": bootstrap.projects[0],
      },
    });

    expect(events.map((event) => event.id)).toEqual([
      "meeting:visible-meeting",
      "meeting:global-meeting",
    ]);
  });
});
