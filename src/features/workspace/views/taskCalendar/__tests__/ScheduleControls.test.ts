/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { ScheduleDateSelector } from "../ScheduleDateSelector";
import { ScheduleRangeSelector } from "../ScheduleRangeSelector";
import { SegmentedSelector } from "@/features/workspace/shared/topbar/SegmentedSelector";

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

describe("ScheduleDateSelector", () => {
  it("renders the shared accessible date control used by every Schedule presentation", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScheduleDateSelector, { value: "2026-10-01", onChange: jest.fn() }),
    );

    expect(markup).toContain('aria-label="Go to date"');
    expect(markup).toContain('type="date"');
    expect(markup).toContain('value="2026-10-01"');
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
