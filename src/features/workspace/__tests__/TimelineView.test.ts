/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { monthEndFromDay } from "@/features/workspace/shared/timelineDateUtils";
import {
  clampTimelineZoom,
  formatTimelineZoomLabel,
  getTimelineDayTrackSize,
  getTimelineGridMinWidth,
} from "@/features/workspace/shared/timelineZoom";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    seasons: [
      {
        id: "season-1",
        name: "2026",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ],
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Ada",
        email: "ada@example.com",
        role: "lead",
        elevated: true,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drivebase",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [
      {
        id: "discipline-1",
        code: "mechanical",
        name: "Mechanical",
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        workstreamId: null,
        workstreamIds: [],
        title: "Frame rail layout",
        summary: "",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        disciplineId: "discipline-1",
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        targetEventId: null,
        ownerId: "member-1",
        assigneeIds: ["member-1"],
        mentorId: null,
        startDate: "2026-04-06",
        dueDate: "2026-04-10",
        priority: "high",
        status: "in-progress",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 4,
        actualHours: 1,
        requiresDocumentation: false,
        documentationLinked: false,
      },
    ],
  };
}

function createBootstrapWithEmptySubsystem(): BootstrapPayload {
  const bootstrap = createBootstrap();

  return {
    ...bootstrap,
    subsystems: [
      ...bootstrap.subsystems,
      {
        id: "subsystem-empty",
        projectId: "project-1",
        name: "Controls",
        description: "",
        iteration: 1,
        isCore: false,
        parentSubsystemId: null,
        responsibleEngineerId: "member-1",
        mentorIds: [],
        risks: [],
      },
    ],
  };
}

function createBootstrapWithoutTasks(): BootstrapPayload {
  return {
    ...createBootstrap(),
    tasks: [],
  };
}

const membersById = {
  "member-1": {
    id: "member-1",
    name: "Ada",
    email: "ada@example.com",
    role: "lead" as const,
    elevated: true,
    seasonId: "season-1",
  },
};

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
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
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
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
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
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
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
        expect(style).toContain("z-index:6");
      });
    },
  );

  it.each([false, true])(
    "layers sticky left columns above timeline events when all-projects view is %s",
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
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
          triggerCreateMilestoneToken: 0,
        }),
      );
      const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");
      const eventLayerZIndexes = Array.from(
        css.matchAll(
          /\.timeline-day-event-(?:overlay-tooltip|overlay-column|underlay)\s*\{[^}]*z-index:\s*(\d+)/g,
        ),
        (match) => Number(match[1]),
      );
      const stickyLeftZIndexes = Array.from(
        markup.matchAll(/style="([^"]*position:sticky[^"]*left:[^"]*z-index:(\d+)[^"]*)"/g),
        (match) => Number(match[2]),
      );

      expect(eventLayerZIndexes.length).toBeGreaterThan(0);
      expect(stickyLeftZIndexes.length).toBeGreaterThan(0);
      expect(Math.min(...stickyLeftZIndexes)).toBeGreaterThan(Math.max(...eventLayerZIndexes));
    },
  );

  it("keeps timeline row groups out of content-visibility stacking containment", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");

    expect(css).not.toMatch(
      /\.timeline-shell\s+\.subsystem-group[\s\S]{0,180}content-visibility:\s*auto/,
    );
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
          membersById,
          openTaskDetailModal: jest.fn(),
          openCreateTaskModal: jest.fn(),
          onDeleteTimelineEvent: jest.fn(),
          onSaveTimelineEvent: jest.fn(),
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
    "hides subsystem rows with no tasks in the selected period when all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithEmptySubsystem(),
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

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      expect(markup).not.toContain("Controls");
      expect(gridCellCount).toBe(30);
    },
  );

  it.each([false, true])(
    "hides all subsystem rows when every subsystem has no tasks and all-projects view is %s",
    (isAllProjectsView) => {
      const markup = renderToStaticMarkup(
        React.createElement(TimelineView, {
          bootstrap: createBootstrapWithoutTasks(),
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

      const gridCellCount = (markup.match(/data-timeline-grid-cell="true"/g) ?? []).length;

      expect(markup).not.toContain("Drivebase");
      expect(gridCellCount).toBe(0);
    },
  );

  it("renders month navigation controls for the default month view", () => {
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

    expect(markup).toContain('aria-label="Previous month"');
    expect(markup).toContain('aria-label="Next month"');
    expect(markup).toContain("April 2026");
  });

  it("keeps month-end bounds in the same calendar month for month-edge dates", () => {
    expect(monthEndFromDay("2026-01-31")).toBe("2026-01-31");
    expect(monthEndFromDay("2026-04-30")).toBe("2026-04-30");
    expect(monthEndFromDay("2026-02-14")).toBe("2026-02-28");
  });

  it("marks the timeline grid as motion-capable for period changes", () => {
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

    expect(markup).toContain('class="timeline-grid-motion"');
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
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain('aria-label="Timeline zoom"');
    expect(markup).toContain('aria-label="Zoom out timeline"');
    expect(markup).toContain('aria-label="Zoom in timeline"');
    expect(formatTimelineZoomLabel(1.2)).toBe("120%");
    expect(clampTimelineZoom(0.2)).toBe(0.8);
    expect(getTimelineDayTrackSize("month", 1)).toBe("minmax(28px, 1fr)");
    expect(getTimelineDayTrackSize("month", 1.6)).toBe("minmax(45px, 1fr)");
    expect(getTimelineDayTrackSize("week", 1, 388)).toBe(
      "minmax(calc((100vw - var(--shell-sidebar-width) - 388px) / 7 * 1), 1fr)",
    );
    expect(getTimelineDayTrackSize("week", 1.6, 388)).toBe(
      "minmax(calc((100vw - var(--shell-sidebar-width) - 388px) / 7 * 1.6), 1fr)",
    );
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
    ).toBe(388);
  });

  it("defines timeline period animations for every timeline navigation direction", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");

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
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");
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
      /const clearMotion = window\.setTimeout\(\(\) => \{[\s\S]*setTimelineGridMotion\([\s\S]*direction:\s*null,[\s\S]*\}, 180\);/,
    );
    expect(source).toMatch(/window\.clearTimeout\(clearMotion\);/);
  });

  it("only transitions timeline grid width during period motion", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");

    expect(css).toMatch(
      /\.timeline-grid-motion\[data-period-motion\]\s*\{[\s\S]*transition:\s*min-width 180ms ease,\s*grid-template-columns 180ms ease;/,
    );
    expect(css).toMatch(
      /\.timeline-grid-motion\s*\{[\s\S]*will-change:\s*min-width,\s*grid-template-columns;/,
    );
  });

  it("keeps timeline shells and rows stretched to the available page width", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");

    expect(css).toMatch(/\.workspace-tab-panel\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-shell\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-grid-motion\s*\{[\s\S]*width:\s*100%;/);
    expect(css).toMatch(/\.timeline-layout\s*\{[\s\S]*width:\s*calc\(100vw - var\(--shell-sidebar-width\)\);/);
    expect(css).toMatch(/\.timeline-layout \.timeline-shell\s*\{[\s\S]*width:\s*calc\(100vw - var\(--shell-sidebar-width\) \+ 1rem\);/);
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
        onDeleteTimelineEvent: jest.fn(),
        onSaveTimelineEvent: jest.fn(),
        triggerCreateMilestoneToken: 0,
      }),
    );

    expect(markup).toContain("timeline-column-motion");
    expect(markup).toContain('data-timeline-column="project"');
    expect(markup).toContain('data-timeline-column="subsystem"');
    expect(markup).toContain('data-timeline-column="task"');
  });

  it("defines unfold animations for timeline columns and expanded rows", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");
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
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");

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
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");
    const getRule = (selectorStart: string, options?: { pseudo?: boolean }) => {
      let start = css.indexOf(selectorStart);
      while (start >= 0) {
        const blockStart = css.indexOf("{", start);
        const selector = css.slice(start, blockStart);
        const hasPseudo = selector.includes("::after");
        if (options?.pseudo === undefined || options.pseudo === hasPseudo) {
          const blockEnd = css.indexOf("}", blockStart);

          return css.slice(start, blockEnd + 1);
        }

        start = css.indexOf(selectorStart, blockStart);
      }

      expect(start).toBeGreaterThanOrEqual(0);
      const blockStart = css.indexOf("{", start);
      const blockEnd = css.indexOf("}", blockStart);

      return css.slice(start, blockEnd + 1);
    };

    expect(getRule(".timeline-ellipsis-reveal[data-full-text]::after", { pseudo: true })).toMatch(
      /color:\s*var\(--timeline-reveal-color/,
    );
    expect(getRule(".timeline-ellipsis-reveal[data-full-text]:hover", { pseudo: false })).toMatch(
      /color:\s*transparent/,
    );
    expect(
      getRule(".timeline-merged-cell-column:hover .timeline-ellipsis-reveal[data-full-text]", {
        pseudo: false,
      }),
    ).toMatch(/color:\s*transparent/);
  });

  it("lets unfolded sideways timeline labels use the full row span before truncating", () => {
    const css = readFileSync(join(process.cwd(), "src/app/App.css"), "utf8");
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
    expect(rotatedRule).toMatch(/max-height:\s*calc\(100% - 16px\)/);
    expect(rotatedRule).not.toMatch(/rotate\(-90deg\)/);

    expect(
      getRule(".timeline-merged-cell-text.is-rotated .timeline-merged-cell-title"),
    ).toMatch(/max-height:\s*100%/);
  });
});
