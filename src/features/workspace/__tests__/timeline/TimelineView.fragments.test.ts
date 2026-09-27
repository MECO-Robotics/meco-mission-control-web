import * as React from "react";import { readFileSync } from "node:fs";import { join } from "node:path";import { renderToStaticMarkup } from "react-dom/server";import { clampTimelineZoom, formatTimelineZoomLabel, getTimelineDayTrackSize, getTimelineGridMinWidth } from "@/features/workspace/shared/timeline/timelineZoom";import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";import { buildTimelineGridLayout } from "@/features/workspace/views/timeline/model/timelineGridLayout";import { createBootstrap, readAppCss, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it("keeps timeline period and zoom pills from shrinking in the topbar", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-topbar-controls \.timeline-period-controls,\s*\.timeline-topbar-controls \.timeline-zoom-controls\s*\{[\s\S]*flex:\s*0 0 auto;[\s\S]*min-width:\s*max-content;[\s\S]*max-width:\s*none;/,
    );
    expect(css).toMatch(
      /\.timeline-topbar-controls \.timeline-period-label,\s*\.timeline-topbar-controls \.timeline-zoom-label\s*\{[\s\S]*flex:\s*0 0 auto;/,
    );
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
