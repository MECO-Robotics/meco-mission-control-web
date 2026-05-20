/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap, membersById } from "../timeline/timelineTestFixtures";

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
    "renders row day cells for visible timeline gridlines when all-projects view is %s",
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

      expect(markup).toContain('data-timeline-grid-cell="true"');
      expect(markup).toContain("border-right:1px solid var(--border-base)");
    },
  );

  it.each([false, true])(
    "does not keep the absolute day overlay grid block when all-projects view is %s",
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
      const bodySource = readFileSync(
        join(process.cwd(), "src/features/workspace/views/timeline/TimelineGridBody.tsx"),
        "utf8",
      );

      expect(markup).toContain('data-timeline-grid-cell="true"');
      expect(bodySource).not.toContain("timelineSharedDayBackgrounds.length > 0 ? (");
    },
  );

  it.each([false, true])(
    "layers timeline task bars above row gridlines when all-projects view is %s",
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

      const gridCellStyles = Array.from(
        markup.matchAll(/data-timeline-grid-cell="true"[^>]*style="([^"]+)"/g),
        (match) => match[1],
      );
      const taskBarStyles = Array.from(
        markup.matchAll(/class="timeline-bar [^"]+"[^>]*style="([^"]+)"/g),
        (match) => match[1],
      );

      expect(gridCellStyles.length).toBeGreaterThan(0);
      expect(taskBarStyles.length).toBeGreaterThan(0);
      gridCellStyles.forEach((style) => {
        expect(style).toContain("position:relative");
        expect(style).toContain("z-index:0");
      });
      taskBarStyles.forEach((style) => {
        expect(style).toContain("position:relative");
        expect(style).not.toContain("z-index:6");
      });
    },
  );

});
