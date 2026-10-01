/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskCalendarMonthStack } from "../TaskCalendarMonthStack";

describe("TaskCalendarMonthStack", () => {
  it("renders a scrollable sequence of full months from the selected month", () => {
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

    expect(markup).toContain('aria-label="Calendar months"');
    expect(markup).toContain(">October 2026</h3>");
    expect(markup).toContain(">September 2027</h3>");
    expect(markup.match(/class="task-calendar-month-section"/g)).toHaveLength(12);
  });
});
