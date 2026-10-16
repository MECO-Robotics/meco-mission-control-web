/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskCalendarMonthStack } from "../TaskCalendarMonthStack";
import { TaskCalendarMonthGrid } from "../TaskCalendarMonthGrid";
import { createContinuousCalendarDates, getCalendarMonthWeekCount } from "../taskCalendarLayout";

function findDayCell(element: React.ReactNode, dateKey: string): React.ReactElement<{
  children?: React.ReactNode;
  "data-date"?: string;
  tabIndex?: number;
  onKeyDown?: (event: { key: string; target: unknown; currentTarget: unknown; preventDefault: () => void }) => void;
}> | null {
  if (!React.isValidElement(element)) return null;
  const candidate = element as React.ReactElement<{ children?: React.ReactNode; "data-date"?: string; tabIndex?: number; onKeyDown?: (event: { key: string; target: unknown; currentTarget: unknown; preventDefault: () => void }) => void }>;
  if (candidate.type === "article" && candidate.props["data-date"] === dateKey) return candidate;
  for (const child of React.Children.toArray(candidate.props.children)) {
    const cell = findDayCell(child, dateKey);
    if (cell) return cell;
  }
  return null;
}

describe("TaskCalendarMonthStack", () => {
  it("renders a continuous date grid with one sticky weekday header and month labels on day one", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TaskCalendarMonthStack, {
        eventsByDateKey: new Map(),
        monthCursor: new Date(2026, 9, 1),
        onOpenDay: jest.fn(),
        onOpenEvent: jest.fn(),
        onVisibleMonthChange: jest.fn(),
        selectedDateKey: null,
        todayDateKey: "2026-10-01",
      }),
    );

    expect(markup).toContain('aria-label="Calendar"');
    expect(markup).toContain('aria-label="Calendar dates"');
    expect(markup).toContain('role="grid"');
    expect(markup).toContain('data-date="2026-10-01" aria-current="date"');
    expect(markup).toContain('role="columnheader"');
    expect(markup.match(/role="gridcell" tabindex="0"/g)).toHaveLength(1);
    expect(markup.match(/class="task-calendar-weekdays"/g)).toHaveLength(1);
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((weekday) => {
      expect(markup).toContain(`>${weekday}</span>`);
    });
    expect(markup).not.toContain("task-calendar-frame");
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

  it("keeps one rendered day in the tab order and supports arrow navigation after month navigation", () => {
    const cursor = new Date(2040, 3, 1);
    const todayDateKey = "2026-10-16";
    const markup = renderToStaticMarkup(React.createElement(TaskCalendarMonthStack, {
      eventsByDateKey: new Map(), monthCursor: cursor, onOpenDay: jest.fn(), onOpenEvent: jest.fn(),
      onVisibleMonthChange: jest.fn(), selectedDateKey: null, todayDateKey,
    }));
    expect(markup.match(/role="gridcell" tabindex="0"/g)).toHaveLength(1);
    expect(markup).toContain('data-date="2040-04-01"');

    const onMoveFocus = jest.fn();
    const grid = TaskCalendarMonthGrid({
      eventsByDateKey: new Map(), monthCells: createContinuousCalendarDates(new Date(2039, 3, 1), 25),
      onOpenDay: jest.fn(), onOpenEvent: jest.fn(), onMoveFocus, eventCapacity: 4,
      activeDateKey: "2040-04-01", selectedDateKey: null, todayDateKey,
    });
    const activeDay = findDayCell(grid, "2040-04-01");
    expect(activeDay?.props.tabIndex).toBe(0);
    activeDay?.props.onKeyDown?.({ key: "ArrowRight", target: activeDay, currentTarget: activeDay, preventDefault: jest.fn() });
    expect(onMoveFocus).toHaveBeenCalledWith("2040-04-01", 1);
  });
});
