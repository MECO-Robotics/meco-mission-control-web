/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { ScheduleRangeSelector } from "../ScheduleRangeSelector";
import { SchedulePeriodControls } from "../SchedulePeriodControls";
import { SegmentedSelector } from "@/features/workspace/shared/topbar/SegmentedSelector";
import { formatMonthYearLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";

describe("shared Schedule month label", () => {
  it("uses the same abbreviated month and short year format across presentations", () => {
    expect(formatMonthYearLabel("2026-10-01")).toBe("Oct '26");
  });
});

describe("SegmentedSelector", () => {
  it("keeps timeline range choices visible unless collapse is requested", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SegmentedSelector, {
        ariaLabel: "Timeline interval",
        onChange: jest.fn(),
        options: [
          { id: "week", label: "Week" },
          { id: "month", label: "Month" },
          { id: "all", label: "All" },
        ],
        value: "month",
      }),
    );

    expect(markup).toContain(">Week</button>");
    expect(markup).toContain('aria-pressed="true" class="timeline-interval-toggle-option is-active" type="button">Month</button>');
    expect(markup).toContain(">All</button>");
  });
});

describe("SchedulePeriodControls", () => {
  it("provides month navigation and a Today action for Calendar", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SchedulePeriodControls, {
        onShiftPeriod: jest.fn(),
        onToday: jest.fn(),
        periodLabel: "Oct '26",
        presentation: "calendar",
        range: "month",
      }),
    );

    expect(markup).toContain('aria-label="Previous month"');
    expect(markup).toContain('aria-label="Next month"');
    expect(markup).toContain(">Oct &#x27;26</span>");
    expect(markup).toContain('aria-label="Go to today"');
    expect(markup).toContain(">Today</button>");
    expect(markup).not.toContain('type="date"');
  });

  it("keeps Today available when Gantt is showing all dates", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SchedulePeriodControls, {
        onShiftPeriod: jest.fn(),
        onToday: jest.fn(),
        periodLabel: "",
        presentation: "timeline",
        range: "all",
      }),
    );

    expect(markup).toContain(">All</button>");
    expect(markup).toContain('aria-label="Go to today"');
    expect(markup).not.toContain('aria-label="Previous month"');
  });
});

describe("ScheduleRangeSelector", () => {
  it("uses Month for Calendar", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScheduleRangeSelector, { presentation: "calendar", value: "month" }),
    );

    expect(markup).toContain('aria-label="Schedule date range"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain(">Month</button>");
    expect(markup).not.toContain(">Week</button>");
    expect(markup).not.toContain(">All</button>");
  });

  it("uses All for Agenda", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScheduleRangeSelector, { presentation: "agenda", value: "all" }),
    );

    expect(markup).toContain(">All</button>");
    expect(markup).not.toContain(">Week</button>");
    expect(markup).not.toContain(">Month</button>");
  });

  it("uses the Week, Month, and All range for Gantt", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScheduleRangeSelector, { presentation: "timeline", value: "month" }),
    );

    expect(markup).toContain(">Week</button>");
    expect(markup).toContain(">Month</button>");
    expect(markup).toContain(">All</button>");
    expect(markup).not.toContain('disabled=""');
  });
});
