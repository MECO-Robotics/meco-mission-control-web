/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { SchedulePresentationSelector } from "../SchedulePresentationSelector";
import { ScheduleDateSelector } from "../ScheduleDateSelector";
import { SegmentedSelector } from "@/features/workspace/shared/topbar/SegmentedSelector";

describe("SchedulePresentationSelector", () => {
  it("collapses to the active presentation until expanded", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SchedulePresentationSelector, { value: "timeline", onChange: jest.fn() }),
    );

    expect(markup).toContain('aria-label="Schedule presentations"');
    expect(markup).toContain('class="timeline-interval-toggle-rail topbar-segmented-selector is-collapsed"');
    expect(markup).toContain('aria-expanded="false" aria-pressed="true"');
    expect(markup).toContain(">Gantt</button>");
    expect(markup).not.toContain(">Agenda</button>");
    expect(markup).not.toContain(">Calendar</button>");
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
