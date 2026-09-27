import * as React from "react";import { readFileSync } from "node:fs";import { join } from "node:path";import { renderToStaticMarkup } from "react-dom/server";import { getTimelineMinimumZoomForWidth } from "@/features/workspace/shared/timeline/timelineZoom";import { formatTimelinePeriodLabel, midpointOfTimelineDays, midpointOfTimelineWeek, monthEndFromDay } from "@/features/workspace/shared/timeline/timelineDateUtils";import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";import { createBootstrap, readAppCss, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats week period labels with year only on the ending day", () => {
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
    ).toBe("4/6 - 4/12/26");
  });

  it("keeps month-end bounds in the same calendar month for month-edge dates", () => {
    expect(monthEndFromDay("2026-01-31")).toBe("2026-01-31");
    expect(monthEndFromDay("2026-04-30")).toBe("2026-04-30");
    expect(monthEndFromDay("2026-02-14")).toBe("2026-02-28");
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

  it("marks the timeline grid as motion-capable for period changes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain('class="timeline-grid-motion"');
  });

  it("raises the minimum zoom when the shell is wide enough to show extra whitespace at 60%", () => {
    expect(
      getTimelineMinimumZoomForWidth({
        dayCount: 30,
        fixedColumnWidth: 276,
        shellWidth: 1200,
        viewInterval: "month",
      }),
    ).toBe(1.1);
  });

  it("scales task fragments and milestone text with timeline zoom", () => {
    const css = readAppCss();
    const taskTrackRowListSource = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/views/timeline/components/TimelineTaskTrackRowList.tsx",
      ),
      "utf8",
    );
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/components/TimelineGridHeaderContent.tsx"),
      "utf8",
    );

    expect(taskTrackRowListSource).toContain('fontSize: "0.7rem"');
    expect(css).not.toContain("font-size: calc(0.7rem * var(--timeline-zoom, 1))");
    expect(css).toContain("font-size: 1rem");
    expect(css).toContain("gap: calc(0.35rem + 0.35rem * var(--timeline-zoom, 1))");
    expect(css).toContain("font-size: inherit");
    expect(headerSource).toContain('width: "100%"');
    expect(headerSource).toContain('"--timeline-zoom": timelineZoom');
  });

  it("abbreviates weekday labels when the day cell gets narrow", () => {
    const css = readAppCss();
    const presentationSource = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/views/timeline/model/timelineViewDataPresentation.ts",
      ),
      "utf8",
    );
    const headerSource = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/views/timeline/components/TimelineDayHeaderRow.tsx",
      ),
      "utf8",
    );

    expect(presentationSource).toContain('weekdayNarrowLabel: WEEKDAY_NARROW_FORMATTER.format(dayDate)');
    expect(headerSource).toContain("timeline-day-weekday-label-full");
    expect(headerSource).toContain("timeline-day-weekday-label-compact");
    expect(css).toContain("container-type: inline-size");
    expect(css).toContain("@container (max-width: 28px)");
  });
});
