/// <reference types="jest" />

import { groupTaskCalendarEventsByMonth, moveTaskCalendarDate, toEventDateKey } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import type { TaskCalendarEvent } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { ScheduleAgendaMonthList } from "@/features/workspace/views/taskCalendar/ScheduleAgendaMonthList";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("toEventDateKey", () => {
  it("keeps calendar-date values stable", () => {
    expect(toEventDateKey("2026-04-20")).toBe("2026-04-20");
  });

  it("keeps utc timestamped events on the intended day", () => {
    expect(toEventDateKey("2026-04-20T00:00:00.000Z")).toBe("2026-04-20");
  });

  it("falls back to parsed UTC date for non-ISO strings", () => {
    expect(toEventDateKey("Mon, 20 Apr 2026 00:00:00 GMT")).toBe("2026-04-20");
  });
});

describe("moveTaskCalendarDate", () => {
  it("moves by local days across month, year, leap-day, and week boundaries", () => {
    expect(moveTaskCalendarDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(moveTaskCalendarDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(moveTaskCalendarDate("2024-02-28", 1)).toBe("2024-02-29");
    expect(moveTaskCalendarDate("2024-02-28", 7)).toBe("2024-03-06");
    expect(moveTaskCalendarDate("2024-03-01", -7)).toBe("2024-02-23");
  });
});

describe("groupTaskCalendarEventsByMonth", () => {
  it("buckets events by month in chronological order", () => {
    const events: TaskCalendarEvent[] = [
      { id: "later", title: "Later milestone", start: "2026-11-12", extendedProps: { contextLabel: null, recordId: "later", type: "milestone" } },
      { id: "first", title: "First milestone", start: "2026-10-03", extendedProps: { contextLabel: null, recordId: "first", type: "milestone" } },
      { id: "also-first", title: "Another October item", start: "2026-10-21", extendedProps: { contextLabel: null, recordId: "also-first", type: "task-due" } },
    ];

    expect(groupTaskCalendarEventsByMonth(events)).toEqual([
      { monthKey: "2026-10", events: [events[1], events[2]] },
      { monthKey: "2026-11", events: [events[0]] },
    ]);

    const markup = renderToStaticMarkup(
      React.createElement(ScheduleAgendaMonthList, {
        groups: groupTaskCalendarEventsByMonth(events),
        onOpenEvent: jest.fn(),
      }),
    );
    expect(markup).toContain('aria-label="October 2026"');
    expect(markup).toContain('aria-label="November 2026"');
    expect(markup).toContain("First milestone");
  });
});
