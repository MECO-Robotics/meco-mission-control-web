import * as React from "react";import { readFileSync } from "node:fs";import { join } from "node:path";import { renderToStaticMarkup } from "react-dom/server";import { clampTimelineZoom, formatTimelineZoomLabel, getTimelineDayTrackSize, getTimelineGridMinWidth } from "@/features/workspace/shared/timeline/timelineZoom";import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";import { buildTimelineGridLayout } from "@/features/workspace/views/timeline/model/timelineGridLayout";import { createBootstrap, readAppCss } from "./timelineTestFixtures";

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
    expect(markup).toContain("--timeline-task-bar-edge-gap:3px");
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
    expect(getTimelineDayTrackSize("week", 1)).toBe("minmax(44px, 1fr)");
    expect(getTimelineDayTrackSize("week", 1.6)).toBe("minmax(70px, 1fr)");
    expect(
      getTimelineGridMinWidth({
        dayCount: 10,
        hasProjectColumn: true,
        projectColumnWidth: 112,
        subsystemColumnWidth: 128,
        taskColumnWidth: 148,
        viewInterval: "week",
        zoom: 1.2,
      }),
    ).toBe(918);
  });

  it("uses shared topbar controls for timeline period and zoom", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.workspace-topbar-controls\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;/,
    );
    expect(css).toContain(".workspace-topbar-zoom-controls");
    expect(css).toContain(".workspace-topbar-zoom-label");
    expect(css).toMatch(
      /\.workspace-topbar-zoom-controls\s*\{[\s\S]*gap:\s*0;[\s\S]*min-height:\s*2rem;[\s\S]*padding:\s*0\.08rem 0\.1rem;/,
    );
    expect(css).toMatch(
      /\.workspace-topbar-zoom-label\s*\{[\s\S]*min-width:\s*2\.6rem;/,
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

  it("keeps task names before the week date tracks", () => {
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

    expect(measuredLayout.taskColumnIndex).toBe(3);
    expect(measuredLayout.taskColumnWidth).toBe(240);
    expect(measuredLayout.dayTrackSize).toMatch(/^minmax\(\d+px, 1fr\)$/);
    expect(measuredLayout.timelineGridTemplate).toContain(measuredLayout.dayTrackSize);
    expect(measuredLayout.dayTrackSize).toBe(fallbackLayout.dayTrackSize);
    expect(measuredLayout.dayTrackSize).toBe("minmax(62px, 1fr)");
  });
});
