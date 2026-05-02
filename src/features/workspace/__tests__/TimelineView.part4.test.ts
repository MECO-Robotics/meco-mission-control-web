/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { localTodayDate } from "@/features/workspace/shared/timelineDateUtils";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap, createBootstrapWithDependency, createBootstrapWithTaskRows, createBootstrapWithScopedOverflowTasks, readAppCss, membersById } from "./timelineTestFixtures";

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
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
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
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
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
    expect(markup).not.toContain("↙");
    expect(markup).not.toContain("↗");
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
    expect(css).toMatch(/\.task-label\.timeline-task-label\s*\{[\s\S]*background:\s*var\(--timeline-task-row-fill\)/);
    expect(css).toMatch(/\.task-label\.timeline-task-label\s*\{[\s\S]*box-shadow:\s*inset 3px 0 0 var\(--timeline-task-discipline-accent\)/);
    expect(css).toMatch(/\.timeline-in-progress\s*\{[\s\S]*--timeline-task-status-accent:\s*#b77900/);
    expect(css).toMatch(/\.task-label\.timeline-task-label-in-progress\s*\{[\s\S]*--timeline-task-status-accent:\s*#b77900/);
    expect(css).toMatch(/\.task-label\.timeline-task-label-complete\s*\{[\s\S]*--timeline-task-status-accent:\s*#246847/);
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
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
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
    expect(getTaskBarStyle("View details for March carry-in")).toContain("margin-left:0");
    expect(getTaskBarStyle("View details for March carry-in")).toContain(
      "margin-right:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("padding-right:24px");
    expect(getTaskBarStyle("View details for March carry-in")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("border-top-left-radius:0");
    expect(getTaskBarStyle("View details for March carry-in")).not.toContain("border-bottom-left-radius:0");
    expect(getTaskBarStyle("View details for May carry-out")).toContain("margin-right:0");
    expect(getTaskBarStyle("View details for May carry-out")).toContain(
      "margin-left:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("padding-left:24px");
    expect(getTaskBarStyle("View details for May carry-out")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("border-top-right-radius:0");
    expect(getTaskBarStyle("View details for May carry-out")).not.toContain("border-bottom-right-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("margin-left:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("margin-right:0");
    expect(getTaskBarStyle("View details for Full scoped span")).toContain("--timeline-task-bar-radius:4px");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-top-left-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-top-right-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-bottom-left-radius:0");
    expect(getTaskBarStyle("View details for Full scoped span")).not.toContain("border-bottom-right-radius:0");
    expect(getTaskBarStyle("View details for Contained scoped task")).toContain(
      "margin-left:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for Contained scoped task")).toContain(
      "margin-right:var(--timeline-task-bar-edge-gap, 24px)",
    );
    expect(getTaskBarStyle("View details for Contained scoped task")).not.toContain("padding-left:24px");
    expect(getTaskBarStyle("View details for Contained scoped task")).not.toContain("padding-right:24px");
  });

  it("uses task discipline and subsystem colors for timeline horizontal highlights", () => {
    const css = readAppCss();
    const portalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineRowHighlightsPortal.tsx"),
      "utf8",
    );
    const helperSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/timelineTaskColors.ts"),
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
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridHeader.tsx"),
      "utf8",
    );
    const overlayHookSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/useTimelineMilestoneOverlay.ts"),
      "utf8",
    );

    expect(headerSource).toContain('data-is-scrolling={isScrolling ? "true" : undefined}');
    expect(overlayHookSource).toContain('setIsTimelineShellScrolling(true)');
    expect(overlayHookSource).toContain('setIsTimelineShellScrolling(false)');
    expect(css).toContain('.timeline-shell[data-is-scrolling="true"] .timeline-ellipsis-reveal[data-full-text]:hover');
    expect(css).toContain('.timeline-shell[data-is-scrolling="true"] .timeline-merged-cell-column:hover .timeline-ellipsis-reveal[data-full-text]');
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
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();
    const portalSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineTodayMarkerPortal.tsx"),
      "utf8",
    );
    const overlaySource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/useTimelineMilestoneOverlay.ts"),
      "utf8",
    );

    expect(markup).toContain(`data-timeline-day="${todayDay}"`);
    expect(markup).not.toContain('class="timeline-day is-today"');
    expect(markup).not.toContain('class="timeline-day-slot is-today"');
    expect(portalSource).toContain("timeline-today-marker-column");
    expect(portalSource).toContain("timeline-today-marker-line");
    expect(portalSource).toContain("Today");
    expect(overlaySource).toContain("offsetLeft");
    expect(css).toMatch(/\.timeline-today-marker-line\s*\{[\s\S]*position:\s*absolute/);
    expect(css).toMatch(/\.timeline-today-marker-column\s*\{[\s\S]*position:\s*absolute/);
    expect(css).toMatch(/\.timeline-today-marker-line\s*\{[\s\S]*width:\s*2px/);
    expect(css).toMatch(/\.timeline-today-marker-label\s*\{[\s\S]*font-weight:\s*800/);
  });

  it("keeps subsystem accent strips on every sticky timeline subsystem surface", () => {
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );

    expect(subsystemGroupSource).toContain('boxShadow: `inset 3px 0 0 ${accentColor}`');
    expect(projectGroupSource).toContain('boxShadow: `inset 3px 0 0 ${subsystem.color}`');
  });

  it.each([
    [false, "2 / -1", "2 / -1"],
    [true, "3 / -1", "3 / -1"],
  ])(
    "starts timeline row highlight anchors after sticky label columns when all-projects view is %s",
    (isAllProjectsView, expectedTaskAnchor, expectedSubsystemAnchor) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrap(),
          isAllProjectsView,
          activePersonFilter: [],
          setActivePersonFilter: jest.fn(),
          membersById,
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );

      expect(markup).toMatch(
        new RegExp(`data-timeline-row-anchor="task:task-1" style="[^"]*grid-row:1;grid-column:${expectedTaskAnchor.replace("/", "\\/")}`),
      );
      expect(markup).toMatch(
        new RegExp(`data-timeline-row-anchor="subsystem:subsystem-1" style="[^"]*grid-row:1 / span 1;grid-column:${expectedSubsystemAnchor.replace("/", "\\/")}`),
      );
    },
  );

  it("keeps left timeline task labels title-only with tighter row height", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithDependency(),
        isAllProjectsView: false,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        membersById,
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const css = readAppCss();
    const daySlotsSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridDaySlots.tsx"),
      "utf8",
    );
    const projectGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineProjectGroup.tsx"),
      "utf8",
    );
    const subsystemGroupSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineSubsystemGroup.tsx"),
      "utf8",
    );

    expect(markup).not.toContain("timeline-task-label-owner");
    expect(markup).not.toContain("Depends on");
    expect(markup).not.toContain("Blocks");
    expect(markup).toContain("min-height:38px");
    expect(daySlotsSource).toContain('minHeight: "38px"');
    expect(projectGroupSource).toContain('gridAutoRows: "38px"');
    expect(subsystemGroupSource).toContain('gridAutoRows: "38px"');
    expect(css).toMatch(/\.timeline-row-highlight-anchor\s*\{[\s\S]*min-height:\s*38px/);
});
});
