import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { clampTimelineZoom } from "@/features/workspace/shared/timeline/timelineZoom";
import { SchedulePeriodControls } from "../../taskCalendar/SchedulePeriodControls";

it.each(["week", "month"] as const)("provides period navigation and Today for the selected %s", (range) => {
  const label = "Selected period";
  const markup = renderToStaticMarkup(createElement(SchedulePeriodControls, {
    range, presentation: "timeline", periodLabel: label,
    onToday: jest.fn(), onShiftPeriod: jest.fn(), onRangeChange: jest.fn(),
  }));
  expect(markup).toContain(label);
  expect(markup).toContain('aria-label="Go to today"');
  expect(markup).toContain(`aria-label="Previous ${range}"`);
  expect(markup).toContain(`aria-label="Next ${range}"`);
});

it("bounds zoom relative to the fitted period without allowing a smaller-than-fit timeline", () => {
  expect(clampTimelineZoom(0.75)).toBe(1);
  expect(clampTimelineZoom(1.25)).toBe(1.25);
  expect(clampTimelineZoom(4.25)).toBe(4);
});
