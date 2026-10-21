import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MeetingRecord, MilestoneRecord, TaskRecord } from "@/types/recordsExecution";
import { formatTimelinePeriodLabel } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { clampTimelineZoom } from "@/features/workspace/shared/timeline/timelineZoom";
import { SchedulePeriodControls } from "../../taskCalendar/SchedulePeriodControls";
import { buildTimelineDateRange } from "../model/timelineViewDataCore";

const defaultRange = {
  tasks: [], milestones: [], meetings: [], viewAnchorDate: "2026-10-21", viewInterval: "all" as const,
};

it("fits the entire supplied work span across tasks, milestones and meetings without clipping to today", () => {
  expect(buildTimelineDateRange({
    ...defaultRange,
    tasks: [{ startDate: "2021-01-09", dueDate: "2021-02-17" } as TaskRecord],
    milestones: [{ startAt: "2029-07-11T09:00:00", endAt: "2029-07-15T18:00:00" } as MilestoneRecord],
    meetings: [{ startAt: "2030-02-02T09:00:00", endAt: "2030-02-03T10:00:00" } as MeetingRecord],
  })).toEqual({ startDate: "2021-01-09", endDate: "2030-02-03" });
});

it("uses only supplied records for Project span and fits empty work to the anchor month", () => {
  expect(buildTimelineDateRange(defaultRange)).toEqual({ startDate: "2026-10-01", endDate: "2026-10-31" });
  expect(buildTimelineDateRange({
    ...defaultRange,
    tasks: [{ startDate: "2027-03-12", dueDate: "2027-03-12" } as TaskRecord],
  })).toEqual({ startDate: "2027-03-12", endDate: "2027-03-12" });
});

it("preserves calendar period boundaries independently of record dates", () => {
  expect(buildTimelineDateRange({ ...defaultRange, viewInterval: "week" })).toEqual({ startDate: "2026-10-18", endDate: "2026-10-24" });
  expect(buildTimelineDateRange({ ...defaultRange, viewInterval: "month", viewAnchorDate: "2028-02-20" })).toEqual({ startDate: "2028-02-01", endDate: "2028-02-29" });
});

it("labels Project span with its real extent and provides Today without misleading period arrows", () => {
  const label = formatTimelinePeriodLabel("all", ["2027-01-04", "2027-04-15"]);
  expect(label).toBe("1/4/27 – 4/15/27");
  const markup = renderToStaticMarkup(createElement(SchedulePeriodControls, {
    range: "all", presentation: "timeline", periodLabel: label,
    onToday: jest.fn(), onShiftPeriod: jest.fn(), onRangeChange: jest.fn(),
  }));
  expect(markup).toContain("Project span");
  expect(markup).toContain(label);
  expect(markup).toContain('aria-label="Go to today"');
  expect(markup).not.toContain("Previous month");
  expect(markup).not.toContain("Next month");
});

it("bounds zoom relative to the fitted period without allowing a smaller-than-fit timeline", () => {
  expect(clampTimelineZoom(0.75)).toBe(1);
  expect(clampTimelineZoom(1.25)).toBe(1.25);
  expect(clampTimelineZoom(4.25)).toBe(4);
});
