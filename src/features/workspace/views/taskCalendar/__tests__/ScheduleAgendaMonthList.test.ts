import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleAgendaMonthList } from "../ScheduleAgendaMonthList";
import { groupTaskCalendarEventsByMonth } from "../taskCalendarLayout";
import type { TaskCalendarEvent } from "../taskCalendarEvents";

it("groups items under one date heading and reserves buttons for editable records", () => {
  const events: TaskCalendarEvent[] = [
    { id: "meeting", title: "Drive practice", start: "2026-04-02T18:00", extendedProps: { recordId: "meeting", type: "meeting", contextLabel: null } },
    { id: "task", title: "Wire intake", start: "2026-04-02", extendedProps: { recordId: "task", type: "task-due", contextLabel: null, status: "in-progress" } },
    { id: "milestone", title: "Integration ready", start: "2026-04-03", extendedProps: { recordId: "milestone", type: "milestone", contextLabel: null } },
  ];
  const markup = renderToStaticMarkup(React.createElement(ScheduleAgendaMonthList, {
    groups: groupTaskCalendarEventsByMonth(events),
    onOpenEvent: jest.fn(),
  }));
  expect(markup.match(/<h3>/g)).toHaveLength(2);
  expect(markup.match(/<button/g)).toHaveLength(2);
  expect(markup).toContain('dateTime="2026-04-02"');
  expect(markup).toContain("in progress");
  expect(markup).toContain("Drive practice");
  expect(markup).not.toContain("Invalid Date");
});

it("keeps source date and clock together with an explicit zone and leaves date-only tasks untimed", () => {
  const events: TaskCalendarEvent[] = [
    { id: "utc", title: "UTC meeting", start: "2026-04-02T00:30:00Z", extendedProps: { recordId: "utc", type: "meeting", contextLabel: null } },
    { id: "offset", title: "Offset event", start: "2026-04-02T23:30:00-07:00", extendedProps: { recordId: "offset", type: "event", contextLabel: null } },
    { id: "date-only", title: "Task due", start: "2026-04-02", extendedProps: { recordId: "date-only", type: "task-due", contextLabel: null } },
    { id: "qa", title: "QA due", start: "2026-04-02", extendedProps: { recordId: "qa", type: "qa-due", contextLabel: null } },
  ];
  const markup = renderToStaticMarkup(React.createElement(ScheduleAgendaMonthList, { groups: groupTaskCalendarEventsByMonth(events), onOpenEvent: jest.fn() }));
  expect(markup.match(/<h3>/g)).toHaveLength(1);
  expect(markup.match(/<button/g)).toHaveLength(2);
  expect(markup).toContain(`${new Date("2026-04-02T00:30:00").toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} UTC</time>`);
  expect(markup).toContain(" UTC-07:00</time>");
  expect(markup.match(/<time/g)).toHaveLength(3);
  expect(markup).not.toContain("Invalid Date");
});
