import { useCallback, useState } from "react";
import { useTimelineViewState } from "../hooks/useTimelineViewState";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn(), useState: jest.fn() }));

function mountSchedule() {
  const slots: unknown[] = [];
  let cursor = 0;
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const slot = cursor++;
    if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
    return [slots[slot], (next: unknown) => {
      slots[slot] = typeof next === "function" ? next(slots[slot]) : next;
    }] as never;
  });
  return () => {
    cursor = 0;
    return useTimelineViewState();
  };
}

beforeEach(() => jest.useFakeTimers().setSystemTime(new Date("2026-10-21T12:00:00")));
afterEach(() => jest.useRealTimers());

it("starts on the current month, resets zoom on period changes, and preserves the supplied focus date", () => {
  const render = mountSchedule();
  expect(render()).toMatchObject({ viewAnchorDate: "2026-10-21", viewInterval: "month", timelineZoom: 1 });
  render().adjustTimelineZoom(1);
  expect(render().timelineZoom).toBe(1.25);
  render().handleTimelineIntervalChange("week", "2027-01-31");
  expect(render()).toMatchObject({ viewAnchorDate: "2027-01-31", viewInterval: "week", timelineZoom: 1 });
  render().adjustTimelineZoom(1);
  render().shiftTimelinePeriod(1);
  expect(render()).toMatchObject({ viewAnchorDate: "2027-02-07", timelineZoom: 1 });
  render().handleTimelineIntervalChange("month", "2027-01-31");
  render().shiftTimelinePeriod(1);
  expect(render().viewAnchorDate).toBe("2027-02-28");
});

it("clamps zoom from fitted width to 400% without changing dates", () => {
  const render = mountSchedule();
  render().adjustTimelineZoom(-1);
  expect(render().timelineZoom).toBe(1);
  for (let step = 0; step < 20; step++) render().adjustTimelineZoom(1);
  expect(render()).toMatchObject({ timelineZoom: 4, viewAnchorDate: "2026-10-21", viewInterval: "month" });
  render().adjustTimelineZoom(-1);
  expect(render().timelineZoom).toBe(3.75);
});

it.each(["week", "month"] as const)("Today preserves %s mode while resetting zoom", (interval) => {
  const render = mountSchedule();
  render().handleTimelineIntervalChange(interval, "2021-03-18");
  render().adjustTimelineZoom(1);
  render().goToToday();
  expect(render()).toMatchObject({ viewAnchorDate: "2026-10-21", viewInterval: interval, timelineZoom: 1 });
});
