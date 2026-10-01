/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskCalendarMonthStack } from "../TaskCalendarMonthStack";
import { createContinuousCalendarDates, getCalendarMonthWeekCount } from "../taskCalendarLayout";

describe("TaskCalendarMonthStack", () => {
  it("renders a continuous date grid with one sticky weekday header and month labels on day one", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TaskCalendarMonthStack, {
        eventsByDateKey: new Map(),
        monthCursor: new Date(2026, 9, 1),
        onOpenDay: jest.fn(),
        onOpenEvent: jest.fn(),
        onCloseSelectedDay: jest.fn(),
        selectedDateKey: null,
        todayDateKey: "2026-10-01",
      }),
    );

    expect(markup).toContain('aria-label="Calendar"');
    expect(markup.match(/class="task-calendar-weekdays"/g)).toHaveLength(1);
    expect(markup).toContain(">October 2025</strong>");
    expect(markup).toContain(">October 2026</strong>");
    expect(markup).toContain(">October 2027</strong>");
    expect(markup).toContain('data-date="2026-10-01"');
    expect(markup.match(/class="task-calendar-day is-even-month"/g)?.length).toBeGreaterThan(0);
    expect(markup).not.toContain("task-calendar-month-section");
  });

  it("builds an uninterrupted Sunday-to-Saturday range around the requested months", () => {
    const dates = createContinuousCalendarDates(new Date(2026, 9, 1), 1);

    expect(dates[0]).toEqual(new Date(2026, 8, 27));
    expect(dates.at(-1)).toEqual(new Date(2026, 9, 31));
    expect(dates).toHaveLength(35);
    expect(dates.every((date, index) => {
      if (index === 0) return date.getDay() === 0;
      const expected = new Date(dates[index - 1]);
      expected.setDate(expected.getDate() + 1);
      return date.getTime() === expected.getTime();
    })).toBe(true);
  });

  it("counts the calendar rows the focused month needs", () => {
    expect(getCalendarMonthWeekCount(new Date(2015, 1, 1))).toBe(4);
    expect(getCalendarMonthWeekCount(new Date(2026, 9, 1))).toBe(5);
    expect(getCalendarMonthWeekCount(new Date(2026, 7, 1))).toBe(6);
  });
});
