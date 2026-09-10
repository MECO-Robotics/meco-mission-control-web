/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { localTodayDate } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap, createBootstrapWithTaskRows, createBootstrapWithScopedOverflowTasks, readAppCss, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps six-task subsystem labels on the 180deg branch in all-projects view", () => {
    const sixRowMarkup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithTaskRows(6),
        isAllProjectsView: true,
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

    expect(sixRowMarkup).toContain("--timeline-merged-cell-rotation:180deg");
    expect(sixRowMarkup).not.toContain("--timeline-merged-cell-rotation:240deg");
  });

  it("uses discipline-led task styling, neutral left labels, and status logos on timeline bars", () => {
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

    expect(markup).toContain("--timeline-task-discipline-accent:#c67b1f");
    expect(markup).toMatch(/class="[^"]*timeline-bar[^"]*timeline-in-progress[^"]*"/);
    expect(markup).toMatch(/class="[^"]*timeline-merged-cell-title[^"]*"/);
    expect(markup).toMatch(
      /class="timeline-task-status-logo timeline-task-status-logo-in-progress timeline-task-status-logo-signal-in-progress"/,
    );
    expect(markup).not.toContain("â†™");
    expect(markup).not.toContain("â†—");
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*background:\s*var\(--timeline-task-discipline-accent\)/);
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*--timeline-task-status-edge-padding:\s*calc\(0\.05rem \* var\(--timeline-zoom,\s*1\)\)/,
    );
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*--timeline-task-status-track-height:\s*2\.2rem/);
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*--timeline-task-status-size:\s*1\.9rem/);
    expect(css).toMatch(
      /\.timeline-bar\s*\{[\s\S]*padding:\s*0\s+var\(--timeline-task-status-edge-padding\)\s+0\s+var\(--timeline-task-bar-padding-start\)/,
    );
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*box-shadow:\s*0 8px 18px rgba\(15, 28, 52, 0\.18\)/);
    expect(css).toMatch(/\.timeline-bar-content\s*\{[\s\S]*width:\s*100%/);
    expect(css).toMatch(/\.\s*editable-hover-indicator\.editable-hover-indicator-compact\s*\{[\s\S]*right:\s*-\s*0\.04rem/);
    expect(css).toMatch(
      /\.timeline-task-status-logo\s*\{[\s\S]*right:\s*var\(\s*--timeline-task-status-right,\s*calc\(/,
    );
    expect(css).toMatch(
      /\.timeline-task-status-logo\s*\{[\s\S]*--timeline-task-status-logo-background:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/,
    );
    expect(css).toMatch(
      /\.timeline-task-status-logo\s*\{[\s\S]*background:\s*var\(--timeline-task-status-logo-background\)/,
    );
    expect(css).toMatch(/\.timeline-task-status-logo\s*\{[\s\S]*width:\s*var\(--timeline-task-status-size\)/);
    expect(css).toMatch(/\.timeline-task-status-logo\.is-compact\s*\{[\s\S]*--timeline-task-status-track-height:\s*1rem/);
    expect(css).toMatch(/\.timeline-task-status-logo\.is-compact\s*\{[\s\S]*--timeline-task-status-size:\s*0\.9rem/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-in-progress\s*\{[\s\S]*color:\s*#b77900/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-waiting-for-qa\s*\{[\s\S]*color:\s*#275098/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-blocked\s*\{[\s\S]*color:\s*var\(--official-red\)/);
    expect(css).toMatch(/\.timeline-task-status-logo-signal-waiting-on-dependency\s*\{[\s\S]*color:\s*#c25a14/);
    expect(css).toMatch(
      /\.timeline-bar \.timeline-bar-title\.timeline-ellipsis-reveal\s*\{[\s\S]*--timeline-reveal-color:/,
    );
    expect(css).toMatch(
      /\.timeline-bar \.timeline-bar-title\.timeline-ellipsis-reveal\s*\{[\s\S]*text-overflow:\s*ellipsis/,
    );
    expect(css).toMatch(/\.timeline-in-progress\s*\{[\s\S]*--timeline-task-status-accent:\s*#b77900/);
    expect(css).toMatch(/\.timeline-complete\s*\{[\s\S]*--timeline-task-status-accent:\s*#246847/);
  });

  it("fades timeline task bars when tasks continue outside the scoped view", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithScopedOverflowTasks(),
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
    const getTaskBarStyle = (title: string) => {
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = markup.match(new RegExp(`<button[^>]*style="([^"]*)"[^>]*title="${escapedTitle}"`));

      expect(match).not.toBeNull();

      return match?.[1] ?? "";
    };

    expect(markup).toContain('title="View details for March carry-in"');
    expect(markup).toMatch(/<button[^>]*data-spill-left="true"[^>]*title="View details for March carry-in"/);
    expect(markup).toMatch(/<button[^>]*data-spill-right="true"[^>]*title="View details for May carry-out"/);
    expect(markup).toMatch(
      /<button[^>]*data-spill-left="true"[^>]*data-spill-right="true"[^>]*title="View details for Full scoped span"/,
    );
    expect(css).toMatch(/\.timeline-bar\[data-spill-left="true"\]/);
    expect(css).toMatch(/\.timeline-bar\[data-spill-right="true"\]/);
    expect(css).toContain("--timeline-bar-overflow-fade");
    expect(css).toContain("--timeline-bar-overflow-edge-mask: rgba(0, 0, 0, 0.42)");
    expect(css).toContain("var(--timeline-bar-overflow-edge-mask) 0");
    expect(css).toContain("var(--timeline-bar-overflow-edge-mask) 100%");
    expect(css).toContain("-webkit-mask-image");
    expect(css).toContain("mask-image");
    expect(css).toMatch(/\.timeline-bar\s*\{[\s\S]*border-radius:\s*var\(--timeline-task-bar-radius,\s*999px\)/);
    expect(css).toMatch(
      /\.timeline-bar\[data-spill-left="true"\]\s*\{[\s\S]*border-top-left-radius:\s*0[\s\S]*border-bottom-left-radius:\s*0/,
    );
    expect(css).toMatch(
      /\.timeline-bar\[data-spill-right="true"\]\s*\{[\s\S]*border-top-right-radius:\s*0[\s\S]*border-bottom-right-radius:\s*0/,
    );
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("padding-right:24px");
    expect(getTaskBarStyle("View details for March carry-in")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("border-top-left-radius:0");
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("border-bottom-left-radius:0");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("padding-left:24px");
    expect(getTaskBarStyle("View details for May carry-out")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("border-top-right-radius:0");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("border-bottom-right-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-top-left-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-top-right-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-bottom-left-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-bottom-right-radius:0");
    expect(getTaskBarStyle("View details for Contained scoped task")).not.toContain("padding-left:24px");
    expect(getTaskBarStyle("View details for Contained scoped task")).not.toContain("padding-right:24px");
  });

  it("uses task discipline and subsystem colors for timeline horizontal highlights", () => {
    const css = readAppCss();
    const portalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/portals/TimelineRowHighlightsPortal.tsx"),
      "utf8",
    );
    const helperSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/model/timelineTaskColors.ts"),
      "utf8",
    );

    expect(css).toMatch(/\.timeline-row-highlight\s*\{[\s\S]*background:\s*var\(--timeline-row-highlight-selected-fill,\s*rgba\(22,\s*71,\s*142,\s*0\.08\)\)/);
    expect(css).toMatch(/\.timeline-row-highlight\.is-hovered\s*\{[\s\S]*background:\s*var\(--timeline-row-highlight-hover-fill,\s*rgba\(22,\s*71,\s*142,\s*0\.16\)\)/);
    expect(portalSource).toContain("resolveTaskRowHighlightStyle");
    expect(portalSource).toContain("...selectedHighlightStyle");
    expect(portalSource).toContain("...hoveredHighlightStyle");
    expect(helperSource).toContain('"--timeline-row-highlight-selected-fill"');
    expect(helperSource).toContain('"--timeline-row-highlight-hover-fill"');
    expect(helperSource).toContain("buildTimelineSubsystemHighlightStyle");
  });

  it("keeps sticky timeline label columns opaque while rows are hovered", () => {
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );

    expect(projectGroupSource).not.toContain('? "transparent"');
    expect(subsystemGroupSource).not.toContain('? "transparent"');
    expect(projectGroupSource).not.toContain("getTimelineRowHighlightHoverFill");
    expect(projectGroupSource).not.toContain("getTimelineRowHighlightSelectedFill");
    expect(subsystemGroupSource).not.toContain("getTimelineRowHighlightHoverFill");
    expect(subsystemGroupSource).not.toContain("getTimelineRowHighlightSelectedFill");
  });

  it("suppresses sticky label hover reveal while the timeline shell is scrolling", () => {
    const css = readAppCss();
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/components/TimelineGridHeaderContent.tsx"),
      "utf8",
    );
    const overlaySyncSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/hooks/useTimelineMilestoneOverlaySync.ts"),
      "utf8",
    );

    expect(headerSource).toContain('data-is-scrolling={isScrolling ? "true" : undefined}');
    expect(overlaySyncSource).toContain("setIsTimelineShellScrolling(true)");
    expect(overlaySyncSource).toContain("setIsTimelineShellScrolling(false)");
    expect(css).toContain(".timeline-bar .timeline-bar-title.timeline-ellipsis-reveal[data-full-text]::after");
    expect(css).not.toContain(".timeline-merged-cell-title.timeline-ellipsis-reveal[data-full-text]::after");
  });

  it("marks the current day as a unique timeline column highlight", () => {
    const todayDay = localTodayDate();
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
    const portalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/portals/TimelineTodayMarkerPortal.tsx"),
      "utf8",
    );
    const overlaySyncSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/hooks/useTimelineMilestoneOverlaySync.ts"),
      "utf8",
    );

    expect(markup).toContain(`data-timeline-day="${todayDay}"`);
    expect(markup).not.toContain('class="timeline-day is-today"');
    expect(markup).not.toContain('class="timeline-day-slot is-today"');
    expect(portalSource).toContain('className="timeline-today-marker-column"');
    expect(portalSource).toContain('className="timeline-today-marker-line"');
    expect(portalSource).toContain("Today");
    expect(overlaySyncSource).toContain("todayCell ? todayCell.offsetLeft : null");
    expect(overlaySyncSource).toContain("todayCell.offsetLeft + todayCell.offsetWidth / 2");
    expect(overlaySyncSource).toContain("todayCell ? todayCell.offsetTop : null");
    expect(portalSource).toContain('position: "absolute"');
    expect(portalSource).toContain("width: 0");
    expect(portalSource).toContain('width: "2px"');
    expect(portalSource).toContain('background: "var(--meco-blue)"');
    expect(portalSource).not.toContain("boxShadow");
    expect(portalSource).toContain("todayMarkerLineLeft");
    expect(portalSource).toContain("todayMarkerLabelTop");
    expect(portalSource).toContain('left: `${todayMarkerLineLeft}px`');
    expect(portalSource).toContain("zIndex: 1");
    expect(portalSource).toContain("bottom: 0,");
    expect(portalSource).toContain('top: showLabelAtTop ? `${todayMarkerLabelTop - 4}px` : undefined,');
    expect(portalSource).toContain('transform: showLabelAtTop ? "translate(-50%, -50%)" : "translateX(-50%)"');
    expect(portalSource).toContain("fontWeight: 800");
    expect(portalSource).toContain("zIndex: 2");
  });

  it("keeps subsystem accent strips on every sticky timeline subsystem surface", () => {
    const subsystemHeaderSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/components/TimelineSubsystemHeaderCell.tsx"),
      "utf8",
    );
    const taskColorsSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/model/timelineTaskColors.ts"),
      "utf8",
    );

    expect(subsystemHeaderSource).toContain("buildTimelineSubsystemHighlightStyle(accentColor");
    expect(subsystemHeaderSource).toContain('boxShadow: `inset 3px 0 0 ${accentColor}`');
    expect(taskColorsSource).toContain("buildTimelineSubsystemHighlightStyle");
  });

});
