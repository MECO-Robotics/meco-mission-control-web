/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

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
