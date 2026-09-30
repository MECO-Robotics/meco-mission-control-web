import * as React from "react";import { readFileSync } from "node:fs";import { join } from "node:path";import { renderToStaticMarkup } from "react-dom/server";import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";import { createBootstrap, createBootstrapWithEmptySubsystem, createBootstrapWithoutTasks, readAppCss } from "./timelineTestFixtures";

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
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );
    const headerSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/components/TimelineDayHeaderRow.tsx"),
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
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain('aria-label="Previous month"');
    expect(markup).toContain('aria-label="Next month"');
    expect(markup).toContain("Apr &#x27;26");
  });
});
