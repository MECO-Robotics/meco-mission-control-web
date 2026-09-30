import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildTaskCalendarEvents, isTaskDueSoon } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { BootstrapPayload } from "@/types/bootstrap";

const base = (): BootstrapPayload => ({
  ...structuredClone(EMPTY_BOOTSTRAP),
  seasons: [{ id: "season-1", teamId: "team", name: "2026", type: "season", startDate: "2026-01-01", endDate: "2026-12-31" }],
  projects: [{ id: "robot", seasonId: "season-1", name: "Robot", projectType: "robot", description: "", status: "active" }],
  meetings: [{ id: "meeting", seasonId: "season-1", projectIds: ["robot"], title: "Build night", meetingType: "build", startAt: "2026-05-07T18:00:00", endAt: "2026-05-07T20:00:00", location: "Lab", description: "" }],
  events: [{ id: "event", seasonId: "season-1", projectIds: ["robot"], title: "District competition", eventType: "competition", startAt: "2026-05-08", endAt: "2026-05-09", location: "Arena", description: "" }],
  milestones: [{ id: "milestone", seasonId: "season-1", projectIds: ["robot"], title: "Robot review", type: "internal-review", status: "planned", startAt: "2026-05-09", endAt: null, description: "", readinessStatus: "not-ready" }],
});

describe("buildTaskCalendarEvents", () => {
  it("treats a local date-only deadline as due today", () => {
    expect(isTaskDueSoon("2026-05-07", new Date(2026, 4, 7, 8))).toBe(true);
  });

  it("shows meetings, events, and milestones together in Schedule with project context", () => {
    const bootstrap = base();
    const events = buildTaskCalendarEvents({
      activePersonFilter: [], bootstrap, isAllProjectsView: true,
      projectsById: Object.fromEntries(bootstrap.projects.map((project) => [project.id, project])),
    });
    expect(events.map(({ id }) => id)).toEqual(["milestone:milestone", "meeting:meeting", "event:event"]);
    expect(events.find(({ id }) => id === "meeting:meeting")).toMatchObject({
      start: "2026-05-07T18:00:00", title: "Robot | Meeting: Build night",
      extendedProps: { type: "meeting" },
    });
    expect(events.find(({ id }) => id === "event:event")).toMatchObject({
      start: "2026-05-08", title: "Robot | District competition",
      extendedProps: { type: "event", status: "competition" },
    });
  });

  it("filters project-owned schedule records to the active project", () => {
    const bootstrap = base();
    bootstrap.events.push({ id: "outreach-event", seasonId: "season-1", projectIds: ["outreach"], title: "Outreach", eventType: "other", startAt: "2026-05-10", endAt: null, location: "", description: "" });
    const events = buildTaskCalendarEvents({
      activePersonFilter: [], bootstrap, isAllProjectsView: false,
      projectsById: Object.fromEntries(bootstrap.projects.map((project) => [project.id, project])),
    });
    expect(events.map(({ id }) => id)).toContain("event:event");
    expect(events.map(({ id }) => id)).not.toContain("event:outreach-event");
  });
});
