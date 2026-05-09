/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { clampTimelineZoom, formatTimelineZoomLabel, getTimelineDayTrackSize, getTimelineGridMinWidth, getTimelineMinimumZoomForWidth } from "@/features/workspace/shared/timeline/timelineZoom";
import { formatTimelinePeriodLabel, midpointOfTimelineDays, midpointOfTimelineWeek, monthEndFromDay } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { buildTimelineGridLayout } from "@/features/workspace/views/timeline/model/timelineGridLayout";
import { createBootstrap, createBootstrapWithEmptySubsystem, createBootstrapWithoutTasks, readAppCss, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([false, true])(
    "layers sticky left columns above timeline milestones when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
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
      const css = readAppCss();
      const milestoneUnderlayZIndexes = Array.from(
        css.matchAll(
          /\.timeline-day-milestone-underlay[^{]*\{[^}]*z-index:\s*(\d+)/g,
        ),
        (match) => Number(match[1]),
      );
      const milestoneOverlayZIndexes = Array.from(
        css.matchAll(
          /\.timeline-day-milestone-(?:overlay-tooltip|overlay-column)[^{]*\{[^}]*z-index:\s*(\d+)/g,
        ),
        (match) => Number(match[1]),
      );
      const stickyLeftZIndexes = Array.from(
        markup.matchAll(/style="([^"]*position:sticky[^"]*left:[^"]*z-index:(\d+)[^"]*)"/g),
        (match) => Number(match[2]),
      );

      expect(milestoneUnderlayZIndexes.length).toBeGreaterThan(0);
      expect(milestoneOverlayZIndexes.length).toBeGreaterThan(0);
      expect(stickyLeftZIndexes.length).toBeGreaterThan(0);
      expect(Math.min(...stickyLeftZIndexes)).toBeGreaterThan(Math.max(...milestoneUnderlayZIndexes));
      expect(Math.max(...milestoneOverlayZIndexes)).toBeGreaterThan(Math.max(...stickyLeftZIndexes));
    },
  );

  it("layers hovered milestone overlays above timeline task bars while keeping underlays below them", () => {
    const css = readAppCss();
    const getZIndex = (selector: string) => {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = css.match(new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?z-index:\\s*(\\d+)`));

      expect(match).not.toBeNull();

      return Number(match?.[1] ?? 0);
    };

    const taskBarZIndex = getZIndex(".timeline-bar");

    expect(getZIndex(".timeline-day-milestone-overlay-column")).toBeGreaterThan(taskBarZIndex);
    expect(getZIndex(".timeline-day-milestone-overlay-tooltip")).toBeGreaterThan(taskBarZIndex);
    expect(getZIndex(".timeline-day-milestone-underlay")).toBeLessThan(taskBarZIndex);
  });

  it("keeps timeline row groups out of content-visibility stacking containment", () => {
    const css = readAppCss();

    expect(css).not.toMatch(
      /\.timeline-shell\s+\.subsystem-group[\s\S]{0,180}content-visibility:\s*auto/,
    );
  });

  it("treats month-view header day clicks as week drill-ins", () => {
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
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/components/TimelineGridHeaderContent.tsx"),
      "utf8",
    );

    expect(markup).toContain('title="Open week of 2026-04-06"');
    expect(headerSource).toContain("onClick={() => handleTimelineHeaderDayClick(cell.day)}");
  });

  it.each([false, true])(
    "keeps timeline rows out of their own stacking context when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
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

      const rowStyles = Array.from(
        markup.matchAll(/class="subsystem-group" style="([^"]+)"/g),
        (match) => match[1],
      );

      expect(rowStyles.length).toBeGreaterThan(0);
      rowStyles.forEach((style) => {
        expect(style).not.toContain("z-index:");
      });
    },
  );

  it.each([false, true])(
    "keeps project-scoped empty subsystem rows but hides them in all-projects view when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithEmptySubsystem(),
          isAllProjectsView,
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

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      if (isAllProjectsView) {
        expect(markup).not.toContain("Controls");
        expect(gridCellCount).toBe(30);
        return;
      }

      expect(markup).toContain("Controls");
      expect(gridCellCount).toBe(60);
    },
  );

  it.each([false, true])(
    "keeps project-scoped subsystem rows even when every subsystem is empty and all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithoutTasks(),
          isAllProjectsView,
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

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      if (isAllProjectsView) {
        expect(markup).not.toContain("Drivebase");
        expect(gridCellCount).toBe(0);
        return;
      }

      expect(markup).toContain("Drivebase");
      expect(gridCellCount).toBe(30);
    },
  );

  it("renders month navigation controls for the default month view", () => {
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

    expect(markup).toContain('aria-label="Previous month"');
    expect(markup).toContain('aria-label="Next month"');
    expect(markup).toContain("April &#x27;26");
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
        "src/features/workspace/views/timeline/components/TimelineGridHeaderContent.tsx",
      ),
      "utf8",
    );

    expect(presentationSource).toContain('weekdayNarrowLabel: WEEKDAY_NARROW_FORMATTER.format(dayDate)');
    expect(headerSource).toContain("timeline-day-weekday-label-full");
    expect(headerSource).toContain("timeline-day-weekday-label-compact");
    expect(css).toContain("container-type: inline-size");
    expect(css).toContain("@container (max-width: 28px)");
  });

  it("exposes timeline zoom controls and uses zoom to widen the grid", () => {
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
    const css = readAppCss();

    expect(markup).toContain('aria-label="Timeline zoom"');
    expect(markup).toContain('aria-label="Zoom out timeline"');
    expect(markup).toContain('aria-label="Zoom in timeline"');
    expect(markup).toContain("--timeline-zoom:1");
    expect(markup).toContain("--timeline-task-bar-edge-gap:2px");
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*--timeline-task-bar-padding-start:\s*calc\(0\.65rem \* var\(--timeline-zoom,\s*1\)\)/,
    );
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*padding:\s*0\s+var\(--timeline-task-status-edge-padding\)\s+0\s+var\(--timeline-task-bar-padding-start\)/,
    );
    expect(formatTimelineZoomLabel(1.2)).toBe("120%");
    expect(clampTimelineZoom(0.2)).toBe(0.6);
    expect(clampTimelineZoom(4)).toBe(2);
    expect(getTimelineDayTrackSize("month", 1)).toBe("minmax(28px, 1fr)");
    expect(getTimelineDayTrackSize("month", 1.6)).toBe("minmax(45px, 1fr)");
    expect(getTimelineDayTrackSize("week", 1, 388)).toBe("minmax(44px, 1fr)");
    expect(getTimelineDayTrackSize("week", 1.6, 388)).toBe("minmax(70px, 1fr)");
    expect(getTimelineDayTrackSize("week", 1, 388, 0, 36)).toBe("minmax(44px, 1fr)");
    expect(css).toContain("gap: calc(0.35rem + 0.35rem * var(--timeline-zoom, 1))");
    expect(
      getTimelineGridMinWidth({
        dayCount: 10,
        hasProjectColumn: true,
        projectColumnWidth: 112,
        subsystemColumnWidth: 128,
        taskColumnWidth: 148,
        statusIconColumnWidth: 36,
        viewInterval: "week",
        zoom: 1.2,
      }),
    ).toBe(918);
  });

  it("keeps task fragment padding driven by zoom-aware CSS instead of fixed inline values", () => {
    const taskTrackRowListSource = readFileSync(
      join(
        process.cwd(),
        "src/features/workspace/views/timeline/components/TimelineTaskTrackRowList.tsx",
      ),
      "utf8",
    );
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*--timeline-task-bar-padding-start:\s*calc\(0\.65rem \* var\(--timeline-zoom,\s*1\)\)/,
    );
    expect(taskTrackRowListSource).not.toContain('padding: "0 8px"');
    expect(taskTrackRowListSource).not.toContain('padding: "0 4px"');
  });

  it("keeps task fragments inset by host padding instead of overflowing with external margins", () => {
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

    expect(markup).toMatch(
      /class="timeline-bar-hover-host editable-hover-target"[^>]*style="[^"]*box-sizing:border-box;[^"]*padding-left:var\(--timeline-task-bar-edge-gap, 2px\);[^"]*padding-right:var\(--timeline-task-bar-edge-gap, 2px\)/,
    );
    expect(markup).not.toMatch(
      /class="timeline-bar [^"]*"[^>]*style="[^"]*margin-left:var\(--timeline-task-bar-edge-gap, 2px\)/,
    );
    expect(markup).not.toMatch(
      /class="timeline-bar [^"]*"[^>]*style="[^"]*margin-right:var\(--timeline-task-bar-edge-gap, 2px\)/,
    );
  });

  it("publishes the zoom-scaled task fragment edge-gap on the outer timeline shell", () => {
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/components/TimelineGridHeaderContent.tsx"),
      "utf8",
    );
    const outerShellStyleBlock =
      headerSource.split("ref={timelineShellRef}")[1]?.split('} as React.CSSProperties & { "--timeline-zoom": number }}')[0] ??
      "";

    expect(headerSource).toContain(
      "const minimumDayWidth =",
    );
    expect(headerSource).toContain(
      "const timelineTaskBarEdgeGap = Math.max(2, Math.round(minimumDayWidth * 0.08));",
    );
    expect(outerShellStyleBlock).toContain(
      '"--timeline-task-bar-edge-gap": `${timelineTaskBarEdgeGap}px`',
    );
  });

  it("reveals task fragment text on hover and focus instead of keeping ellipsis clipping", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-bar\s+\.timeline-bar-title\.timeline-ellipsis-reveal\[data-full-text\]::after\s*\{[\s\S]*content:\s*attr\(data-full-text\)[\s\S]*opacity:\s*0[\s\S]*pointer-events:\s*none[\s\S]*padding:\s*0\.08rem 0\.28rem[\s\S]*border-radius:\s*0\.3rem[\s\S]*background:\s*color-mix\(in srgb,\s*var\(--timeline-task-discipline-accent\)\s*82%,\s*transparent\)/,
    );
    expect(css).toMatch(
      /\.timeline-bar-hover-host:hover,\s*\.timeline-bar-hover-host:focus-within\s*\{[\s\S]*z-index:\s*10081/,
    );
    expect(css).toMatch(
      /\.timeline-bar-hover-host:hover\s+\.timeline-bar-content,\s*\.timeline-bar-hover-host:focus-within\s+\.timeline-bar-content,\s*\.timeline-bar:hover\s+\.timeline-bar-content,\s*\.timeline-bar:focus-visible\s+\.timeline-bar-content\s*\{[\s\S]*overflow:\s*visible/,
    );
    expect(css).toMatch(
      /\.timeline-bar-hover-host:hover\s+\.timeline-bar-title\.timeline-ellipsis-reveal,\s*\.timeline-bar-hover-host:focus-within\s+\.timeline-bar-title\.timeline-ellipsis-reveal,\s*\.timeline-bar:hover\s+\.timeline-bar-title\.timeline-ellipsis-reveal,\s*\.timeline-bar:focus-visible\s+\.timeline-bar-title\.timeline-ellipsis-reveal\s*\{[\s\S]*max-width:\s*none[\s\S]*overflow:\s*visible[\s\S]*text-overflow:\s*clip/,
    );
    expect(css).toMatch(
      /\.timeline-bar-hover-host:hover\s+\.timeline-bar-title\.timeline-ellipsis-reveal,\s*\.timeline-bar-hover-host:focus-within\s+\.timeline-bar-title\.timeline-ellipsis-reveal,\s*\.timeline-bar:hover\s+\.timeline-bar-title\.timeline-ellipsis-reveal,\s*\.timeline-bar:focus-visible\s+\.timeline-bar-title\.timeline-ellipsis-reveal\s*\{[\s\S]*color:\s*transparent\s*!important/,
    );
    expect(css).toMatch(
      /\.timeline-bar-hover-host:hover\s+\.timeline-bar-title\.timeline-ellipsis-reveal\[data-full-text\]::after,\s*\.timeline-bar-hover-host:focus-within\s+\.timeline-bar-title\.timeline-ellipsis-reveal\[data-full-text\]::after,\s*\.timeline-bar:hover\s+\.timeline-bar-title\.timeline-ellipsis-reveal\[data-full-text\]::after,\s*\.timeline-bar:focus-visible\s+\.timeline-bar-title\.timeline-ellipsis-reveal\[data-full-text\]::after\s*\{[\s\S]*opacity:\s*1/,
    );
  });

  it("keeps the week status icon overlay anchored to the last day column", () => {
    const fallbackLayout = buildTimelineGridLayout({
      dayCount: 7,
      isAllProjectsView: true,
      isProjectColumnVisible: true,
      isSubsystemColumnVisible: true,
      timelineZoom: 1.4,
      viewInterval: "week",
    });
    const measuredLayout = buildTimelineGridLayout({
      dayCount: 7,
      isAllProjectsView: true,
      isProjectColumnVisible: true,
      isSubsystemColumnVisible: true,
      timelineShellWidth: 1425.59375,
      timelineZoom: 1.4,
      viewInterval: "week",
    });

    expect(measuredLayout.statusIconColumnIndex).toBe(9);
    expect(measuredLayout.statusIconColumnWidth).toBe(36);
    expect(measuredLayout.dayTrackSize).toMatch(/^minmax\(\d+px, 1fr\)$/);
    expect(measuredLayout.timelineGridTemplate).toContain(measuredLayout.dayTrackSize);
    expect(measuredLayout.dayTrackSize).toBe(fallbackLayout.dayTrackSize);
    expect(measuredLayout.dayTrackSize).toBe("minmax(62px, 1fr)");
  });
});
