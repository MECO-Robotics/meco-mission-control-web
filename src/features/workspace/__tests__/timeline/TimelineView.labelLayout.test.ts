import * as React from "react";import { renderToStaticMarkup } from "react-dom/server";import { TimelineProjectHeaderCell } from "@/features/workspace/views/timeline/components/TimelineProjectHeaderCell";import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";import { createBootstrapWithTaskRows, readAppCss } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it("prevents timeline label reveal overlays from doubling visible source text", () => {
    const css = readAppCss();
    const getRule = (selectorStart: string) => {
      const start = css.indexOf(selectorStart);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      const blockEnd = css.indexOf("}", blockStart);

      return css.slice(start, blockEnd + 1);
    };

    expect(css).toContain(".timeline-bar .timeline-bar-title.timeline-ellipsis-reveal[data-full-text]::after");
    expect(css).not.toContain(".timeline-merged-cell-title.timeline-ellipsis-reveal[data-full-text]::after");
    expect(getRule(".timeline-bar .timeline-bar-title.timeline-ellipsis-reveal")).toMatch(/overflow:\s*hidden/);
    expect(getRule(".timeline-bar .timeline-bar-title.timeline-ellipsis-reveal")).toMatch(
      /text-overflow:\s*ellipsis/,
    );
    expect(getRule(".timeline-merged-cell-title")).toMatch(/text-overflow:\s*ellipsis/);
    expect(css).toMatch(
      /\.timeline-merged-cell-text:hover,\s*\.timeline-merged-cell-text:focus-within,\s*\.timeline-merged-cell-text:focus-visible\s*\{[\s\S]*?z-index:\s*10045/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column:hover,\s*\.timeline-merged-cell-column:focus-within\s*\{[\s\S]*overflow:\s*visible\s*!important;[\s\S]*z-index:\s*10045/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column:hover \.timeline-merged-cell-title,\s*\.timeline-merged-cell-column:focus-within \.timeline-merged-cell-title\s*\{[\s\S]*overflow:\s*visible;[\s\S]*text-overflow:\s*clip;/,
    );
  });

  it("anchors project title cutoff reveal to the label hover and focus area", () => {
    const collapsedMarkup = renderToStaticMarkup(
      React.createElement(TimelineProjectHeaderCell, {
        project: {
          id: "project-1",
          name: "Long clipped project label",
          completeCount: 0,
          taskCount: 3,
          tasks: [],
          subsystems: [],
        },
        projectBackground: "var(--bg-panel)",
        projectCollapsed: true,
        projectRowCount: 1,
        toggleProject: jest.fn(),
      }),
    );
    const unfoldedMarkup = renderToStaticMarkup(
      React.createElement(TimelineProjectHeaderCell, {
        project: {
          id: "project-1",
          name: "Long clipped project label",
          completeCount: 0,
          taskCount: 4,
          tasks: [],
          subsystems: [],
        },
        projectBackground: "var(--bg-panel)",
        projectCollapsed: false,
        projectRowCount: 4,
        toggleProject: jest.fn(),
      }),
    );
    const css = readAppCss();

    expect(collapsedMarkup).toMatch(
      /class="timeline-merged-cell-column[^"]*" data-collapsed="true" data-timeline-column="project"[^>]*>[\s\S]*timeline-project-title/,
    );
    expect(unfoldedMarkup).toMatch(
      /class="timeline-merged-cell-column[^"]*" data-collapsed="false" data-timeline-column="project"[^>]*>[\s\S]*timeline-merged-cell-text is-rotated[\s\S]*timeline-project-title/,
    );
    expect(collapsedMarkup).toMatch(/overflow:visible/);
    expect(unfoldedMarkup).toMatch(/overflow:visible/);
    expect(collapsedMarkup).toMatch(
      /aria-label="Long clipped project label 0\/3"[\s\S]*class="timeline-merged-cell-text"[\s\S]*role="group"[\s\S]*tabindex="0"/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-project-title\.timeline-ellipsis-reveal\[data-full-text\]::after\s*\{[\s\S]*content:\s*attr\(data-full-text\)[\s\S]*opacity:\s*0[\s\S]*pointer-events:\s*none/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-merged-cell-text:hover \.timeline-project-title\.timeline-ellipsis-reveal,\s*\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-merged-cell-text:focus-visible \.timeline-project-title\.timeline-ellipsis-reveal,\s*\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-merged-cell-text:focus-within \.timeline-project-title\.timeline-ellipsis-reveal\s*\{[\s\S]*color:\s*transparent\s*!important/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-merged-cell-text:hover \.timeline-project-title\.timeline-ellipsis-reveal\[data-full-text\]::after,\s*\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-merged-cell-text:focus-visible \.timeline-project-title\.timeline-ellipsis-reveal\[data-full-text\]::after,\s*\.timeline-merged-cell-column\[data-timeline-column="project"\] \.timeline-merged-cell-text:focus-within \.timeline-project-title\.timeline-ellipsis-reveal\[data-full-text\]::after\s*\{[\s\S]*opacity:\s*1/,
    );
    expect(css).not.toMatch(
      /\.timeline-merged-cell-column\[data-timeline-column="project"\]:focus-within[^{]+timeline-project-title/,
    );
  });

  it("lets unfolded sideways timeline labels use the full row span before truncating", () => {
    const css = readAppCss();
    const getRule = (selectorStart: string) => {
      const start = css.indexOf(selectorStart);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      const blockEnd = css.indexOf("}", blockStart);

      return css.slice(start, blockEnd + 1);
    };

    const rotatedRule = getRule(".timeline-merged-cell-text.is-rotated");
    expect(rotatedRule).toMatch(/writing-mode:\s*vertical-rl/);
    expect(rotatedRule).toMatch(/text-orientation:\s*mixed/);
    expect(rotatedRule).toMatch(
      /transform:\s*rotate\(var\(--timeline-merged-cell-rotation,\s*240deg\)\)/,
    );
    expect(rotatedRule).toMatch(/max-height:\s*calc\(100% - 16px\)/);
    expect(rotatedRule).not.toMatch(/rotate\(-90deg\)/);

    expect(css).not.toContain(".timeline-merged-cell-text.is-rotated .timeline-merged-cell-title");
  });

  it("uses 180deg rotation for four-row labels", () => {
    const fourRowMarkup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrapWithTaskRows(4),
        isAllProjectsView: true,
        activePersonFilter: [],
        setActivePersonFilter: jest.fn(),
        openTaskDetailModal: jest.fn(),
        openCreateTaskModal: jest.fn(),
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(fourRowMarkup).toContain("timeline-merged-cell-text is-rotated");
    expect(fourRowMarkup).toContain("--timeline-merged-cell-rotation:180deg");
    expect(fourRowMarkup).not.toContain("--timeline-merged-cell-rotation:240deg");
  });

});
