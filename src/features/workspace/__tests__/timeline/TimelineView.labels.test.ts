/// <reference types="jest" />
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap } from "./timelineTestFixtures";

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
    [false, "3 / -1", "3 / -1"],
    [true, "4 / -1", "4 / -1"],
  ])(
    "starts timeline row highlight anchors after sticky label columns when all-projects view is %s",
    (isAllProjectsView, expectedTaskAnchor, expectedSubsystemAnchor) => {
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

      expect(markup).toMatch(
        new RegExp(`data-timeline-row-anchor="task:task-1" style="[^"]*grid-row:1;grid-column:${expectedTaskAnchor.replace("/", "\\/")}`),
      );
      expect(markup).toMatch(
        new RegExp(`data-timeline-row-anchor="subsystem:subsystem-1" style="[^"]*grid-row:1 / span 1;grid-column:${expectedSubsystemAnchor.replace("/", "\\/")}`),
      );
    },
  );

});
