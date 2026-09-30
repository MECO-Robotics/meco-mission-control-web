/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { createBootstrap } from "./milestoneFixture";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("MilestonesView", () => {
  it("renders a chronological agenda with milestone readiness and visible detail actions", () => {
    const markup = renderToStaticMarkup(React.createElement(MilestonesView, {
      activePersonFilter: [], bootstrap: createBootstrap(), isAllProjectsView: false,
      onDeleteTimelineMilestone: jest.fn(), onSaveTimelineMilestone: jest.fn(),
    }));
    expect(markup).toContain('aria-label="Milestone agenda"');
    expect(markup).toContain("Regional</button>");
    expect(markup).toContain("Design review</button>");
    expect(markup).toContain("Planned");
    expect(markup).toContain("Blocked");
    expect(markup).toContain("Competition");
    expect(markup).not.toContain("task-queue-board");
  });

  it("renders milestone filter and sort controls as icon overlays inside search", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        isAllProjectsView: false,
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
      }),
    );

    expect(markup).toContain("topbar-responsive-search-actions");
    expect(markup).toContain("--topbar-responsive-search-action-overlay-width:4rem");
    expect(markup).toContain("milestones-search-filter-menu");
    expect(markup).toContain("milestones-search-sort-menu");
    expect(markup).toContain('aria-label="Milestone filters"');
    expect(markup).toContain('aria-label="Sort milestones"');
    expect(markup).not.toContain('aria-label="Sort direction"');
    expect(markup).not.toContain('class="toolbar-filter-value">Filters</span>');
    expect(markup).not.toContain('class="toolbar-filter-value">Sort</span>');
  });

  it("uses wider icon-mode thresholds for milestone search on cramped topbars", () => {
    const searchControlSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/milestones/MilestonesSearchControl.tsx"),
      "utf8",
    );

    expect(searchControlSource).toContain("MILESTONE_SEARCH_COMPACT_SWITCH_WIDTH = 360 + MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH");
    expect(searchControlSource).toContain("MILESTONE_SEARCH_ICON_SWITCH_WIDTH = 260 + MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH");
    expect(searchControlSource).toContain("MILESTONE_SEARCH_ICON_RELEASE_WIDTH = 420 + MILESTONE_SEARCH_ACTION_OVERLAY_WIDTH");
  });

  it("does not toggle milestone sort direction as a side effect of opening the sort menu", () => {
    const toolbarSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/milestones/MilestonesToolbar.tsx"),
      "utf8",
    );

    expect(toolbarSource).not.toContain("onButtonClick={() => setSortOrder");
    expect(toolbarSource).toContain("<SortDirectionToggle direction={sortOrder}");
  });

  it("closes milestone suggestions when keyboard focus moves into search actions", () => {
    const searchControlSource = readFileSync(
      join(process.cwd(), "src/features/workspace/views/milestones/MilestonesSearchControl.tsx"),
      "utf8",
    );

    expect(searchControlSource).toMatch(
      /target\.closest\("\.topbar-responsive-search-actions"\)\) \{[\s\S]*setIsSuggestionsOpen\(false\);[\s\S]*return;/,
    );
  });

  it("filters milestones to the active person via linked tasks", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesView, {
        activePersonFilter: ["member-1"],
        bootstrap,
        isAllProjectsView: false,
        onDeleteTimelineMilestone: jest.fn(),
        onSaveTimelineMilestone: jest.fn(),
      }),
    );

    expect(markup).toContain("Regional");
    expect(markup).toContain("Design review");
    expect((markup.match(/<time /g) ?? []).length).toBe(2);
  });

  it("falls back to the default style label when an milestone type is invalid", () => {
    const bootstrap = createBootstrap();
    bootstrap.milestones = [
      {
        ...bootstrap.milestones[0],
        id: "milestone-legacy",
        title: "Legacy milestone",
        type: "milestone" as never,
      },
    ];

    const render = () =>
      renderToStaticMarkup(
        React.createElement(MilestonesView, {
          activePersonFilter: [],
          bootstrap,
          isAllProjectsView: false,
          onDeleteTimelineMilestone: jest.fn(),
          onSaveTimelineMilestone: jest.fn(),
        }),
      );

    expect(render).not.toThrow();
    expect(render()).toContain("Internal review");
    expect(render()).toContain("Legacy milestone");
  });

});
