/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap, createBootstrapWithDependency, readAppCss, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
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
          onDeleteTimelineMilestone: jest.fn(),
          onSaveTimelineMilestone: jest.fn(),
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
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
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
