/// <reference types="jest" />

import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { formatMonthYearLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { ScheduleRangeSelector } from "../ScheduleRangeSelector";

describe("shared Schedule month label", () => {
  it("uses the same abbreviated month and short year format across presentations", () => {
    expect(formatMonthYearLabel("2026-10-01")).toBe("Oct '26");
  });
});

describe("ScheduleRangeSelector", () => {
  it("offers only Week and Month in the expanded range selector", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScheduleRangeSelector, {
        onChange: jest.fn(),
        presentation: "agenda",
        value: "month",
      }),
    );

    expect(markup.match(/class="timeline-interval-toggle-option/g)).toHaveLength(2);
    expect(markup).toContain(">Week</button>");
    expect(markup).toContain('aria-pressed="true" class="timeline-interval-toggle-option is-active" type="button">Month</button>');
  });
});
