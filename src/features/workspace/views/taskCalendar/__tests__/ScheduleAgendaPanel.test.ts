import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleAgendaPanel } from "../ScheduleAgendaPanel";
import { createBootstrap } from "@/features/workspace/__tests__/timeline/timelineTestFixtures";
import type { TaskCalendarEvent } from "../taskCalendarEvents";

function renderAgenda(startDate: string, endDate: string | null) {
  const events: TaskCalendarEvent[] = ["2026-03-31", "2026-04-01", "2026-04-30", "2026-05-01"].map((date) => ({
    id: date,
    title: `Meeting ${date}`,
    start: `${date}T18:00:00`,
    extendedProps: { recordId: date, type: "meeting", contextLabel: null },
  }));
  return renderToStaticMarkup(React.createElement(ScheduleAgendaPanel, {
    bootstrap: createBootstrap(),
    isAllProjectsView: false,
    startDate,
    endDate,
    events,
    onSaveMeeting: jest.fn(),
    onDeleteTimelineMilestone: jest.fn(),
    onSaveTimelineMilestone: jest.fn(),
    onTaskDetailOpen: jest.fn(),
  }));
}

it("shows only agenda items inside Gantt's inclusive visible dates", () => {
  const markup = renderAgenda("2026-04-01", "2026-04-30");
  expect(markup).toContain("Meeting 2026-04-01");
  expect(markup).toContain("Meeting 2026-04-30");
  expect(markup).not.toContain("Meeting 2026-03-31");
  expect(markup).not.toContain("Meeting 2026-05-01");
  expect(markup).not.toContain("Schedule date range");
});

it("updates content for another visible period and handles empty periods", () => {
  const may = renderAgenda("2026-05-01", "2026-05-31");
  expect(may).toContain("Meeting 2026-05-01");
  expect(may).not.toContain("Meeting 2026-04-30");
  expect(renderAgenda("2026-06-01", "2026-06-30")).toContain("No schedule items in this period.");
});
