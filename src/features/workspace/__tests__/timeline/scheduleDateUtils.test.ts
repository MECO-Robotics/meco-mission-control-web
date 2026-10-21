import { formatTimelinePeriodLabel, getSchedulePeriodBounds, midpointOfTimelineDays, midpointOfTimelineWeek, monthEndFromDay } from "@/features/workspace/shared/timeline/timelineDateUtils";

describe("schedule date utilities", () => {
  it("shows only the first day in week period labels", () => {
    expect(
      formatTimelinePeriodLabel("week", [
        "2026-04-06",
        "2026-04-07",
        "2026-04-08",
        "2026-04-09",
        "2026-04-10",
        "2026-04-11",
        "2026-04-12",
      ]),
    ).toBe("4/6/26");
  });

  it("keeps month-end bounds in the same calendar month for month-edge dates", () => {
    expect(monthEndFromDay("2026-01-31")).toBe("2026-01-31");
    expect(monthEndFromDay("2026-04-30")).toBe("2026-04-30");
    expect(monthEndFromDay("2026-02-14")).toBe("2026-02-28");
  });

  it("bounds Week and Month scopes to the selected period across month and year edges", () => {
    expect(getSchedulePeriodBounds("2026-10-01", "week")).toEqual({
      startDate: "2026-09-27",
      endDate: "2026-10-03",
    });
    expect(getSchedulePeriodBounds("2026-10-01", "month")).toEqual({
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
    expect(getSchedulePeriodBounds("2028-02-20", "month")).toEqual({
      startDate: "2028-02-01",
      endDate: "2028-02-29",
    });
    expect(getSchedulePeriodBounds("2027-01-01", "week")).toEqual({
      startDate: "2026-12-27",
      endDate: "2027-01-02",
    });
  });

  it("centers the month view on the midpoint of the current week when switching from week to month", () => {
    expect(midpointOfTimelineWeek("2026-04-06")).toBe("2026-04-08");
    expect(midpointOfTimelineWeek("2026-04-11")).toBe("2026-04-08");
  });

  it("uses the midpoint of the visible range for interval anchor persistence", () => {
    expect(
      midpointOfTimelineDays([
        "2026-04-01",
        "2026-04-02",
        "2026-04-03",
        "2026-04-04",
      ]),
    ).toBe("2026-04-03");
    expect(midpointOfTimelineDays([])).toBeNull();
  });

});
