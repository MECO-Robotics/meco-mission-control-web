/// <reference types="jest" />
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap, createBootstrapWithTaskRows, readAppCss, membersById } from "./timelineTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("TimelineView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-15T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("defines timeline period animations for every timeline navigation direction", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="left"\]\s*\{[\s\S]*timeline-period-swipe-left-in/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="right"\]\s*\{[\s\S]*timeline-period-swipe-right-in/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="neutral"\]\s*\{[\s\S]*timeline-period-glide-in/,
    );
  });

  it("keeps timeline period animations from adding horizontal scroll overflow", () => {
    const css = readAppCss();
    const getKeyframesBlock = (name: string) => {
      const start = css.indexOf(`@keyframes ${name}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      let depth = 0;

      for (let index = blockStart; index < css.length; index += 1) {
        if (css[index] === "{") {
          depth += 1;
        }

        if (css[index] === "}") {
          depth -= 1;
        }

        if (depth === 0) {
          return css.slice(start, index + 1);
        }
      }

      return css.slice(start);
    };

    for (const keyframes of [
      "timeline-period-swipe-left-in",
      "timeline-period-swipe-right-in",
    ]) {
      expect(getKeyframesBlock(keyframes)).not.toMatch(
        /translate3d\(\s*-?\d+px\s*,\s*0\s*,\s*0\s*\)/,
      );
    }
  });

  it("clears timeline period motion after the interval change animation ends", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/workspace/views/timeline/TimelineView.tsx"),
      "utf8",
    );

    expect(source).toMatch(
      /const clearMotion = window\.setTimeout\(\(\) => \{[\s\S]*current\.direction \? \{ direction: null, token: current\.token \} : current,[\s\S]*\}, 180\);/,
    );
    expect(source).toMatch(/window\.clearTimeout\(clearMotion\);/);
  });

  it("only transitions timeline grid width during period motion", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion\]\s*\{[\s\S]*transition:\s*min-width 180ms ease,\s*grid-template-columns 180ms ease;/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\s*\{[\s\S]*will-change:\s*min-width,\s*grid-template-columns;/,
    );
  });

  it("keeps timeline shells and rows stretched to the available page width", () => {
    const css = readAppCss();

    expect(css).toMatch(/\.workspace-tab-panel\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-shell\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-grid-motion\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-layout\s*\{[\s\S]*width:\s*calc\(100% \+ 0\.85rem\);/);
    expect(css).toMatch(/\.timeline-layout\s*\{[\s\S]*margin-right:\s*-0\.85rem;/);
    expect(css).toMatch(/\.timeline-layout \.timeline-shell\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-grid,\s*\.subsystem-row\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.subsystem-group\s*\{[\s\S]*width:\s*100%;/);
    expect(css).not.toMatch(/\.timeline-grid,\s*\.subsystem-group,\s*\.subsystem-row\s*\{[\s\S]*gap:/);
  });

  it("marks project, subsystem, and task columns as unfold-animation surfaces", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TimelineView, {
        bootstrap: createBootstrap(),
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

    expect(markup).toContain("timeline-column-motion");
    expect(markup).toContain('data-timeline-column="project"');
    expect(markup).toContain('data-timeline-column="subsystem"');
    expect(markup).toContain('data-timeline-column="task"');
  });

  it("defines unfold animations for timeline columns and expanded rows", () => {
    const css = readAppCss();
    const getKeyframesBlock = (name: string) => {
      const start = css.indexOf(`@keyframes ${name}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      let depth = 0;

      for (let index = blockStart; index < css.length; index += 1) {
        if (css[index] === "{") {
          depth += 1;
        }

        if (css[index] === "}") {
          depth -= 1;
        }

        if (depth === 0) {
          return css.slice(start, index + 1);
        }
      }

      return css.slice(start);
    };

    expect(css).toMatch(
      /\.timeline-column-motion\[data-column-motion="unfolding"\]\s*\{[\s\S]*timeline-column-unfold-in 160ms/,
    );
    expect(css).toMatch(
      /\.timeline-row-motion\[data-row-motion="unfolding"\][\s\S]*timeline-row-unfold-in 160ms/,
    );
    expect(getKeyframesBlock("timeline-column-unfold-in")).not.toMatch(/transform:/);
    expect(getKeyframesBlock("timeline-row-unfold-in")).not.toMatch(/transform:/);
  });

  it("keeps timeline period and filter motion subtle", () => {
    const css = readAppCss();

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="left"\]\s*\{[\s\S]*timeline-period-swipe-left-in 180ms/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="right"\]\s*\{[\s\S]*timeline-period-swipe-right-in 180ms/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion="neutral"\]\s*\{[\s\S]*timeline-period-glide-in 160ms/,
    );
    expect(css).toMatch(
      /@keyframes filter-results-settle\s*\{[\s\S]*opacity: 0\.98/,
    );
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
      /\.task-label:hover,\s*\.task-label:focus-visible,\s*\.timeline-merged-cell-text:hover,\s*\.timeline-merged-cell-text:focus-within,\s*\.timeline-merged-cell-text:focus-visible\s*\{[\s\S]*?z-index:\s*10045/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column:hover,\s*\.timeline-merged-cell-column:focus-within\s*\{[\s\S]*overflow:\s*visible\s*!important;[\s\S]*z-index:\s*10045/,
    );
    expect(css).toMatch(
      /\.timeline-merged-cell-column:hover \.timeline-merged-cell-title,\s*\.timeline-merged-cell-column:focus-within \.timeline-merged-cell-title\s*\{[\s\S]*overflow:\s*visible;[\s\S]*text-overflow:\s*clip;/,
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
        membersById,
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
