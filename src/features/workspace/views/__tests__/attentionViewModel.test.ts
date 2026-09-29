/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AttentionView } from "@/features/workspace/views/attention/AttentionView";
import { buildAttentionViewModel } from "@/features/workspace/views/attention/attentionViewModel";
import { createBootstrap } from "./support/attentionViewModel.fixture";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("buildAttentionViewModel", () => {
  it("keeps attention source, search and review filters visible", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AttentionView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        onOpenRisk: jest.fn(),
        onOpenTask: jest.fn(),
      }),
    );

    expect(markup).toContain('aria-label="Search attention"');
    expect(markup).toContain('aria-label="Attention filters"');
    expect(markup).toContain("topbar-responsive-search-actions");
    expect(markup).not.toContain('class="workspace-presentation-controls"');
  });

  it("renders one attention queue heading", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AttentionView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        onOpenRisk: jest.fn(),
        onOpenTask: jest.fn(),
      }),
    );

    expect(markup).toContain("Needs attention");
    expect(markup).not.toContain("Operational triage for immediate intervention");
  });

  it("builds ranked action-now items with attention signals", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: createBootstrap(),
    });

    expect(viewModel.actionNowItems.some((item) => item.sourceType === "qa")).toBe(true);
    expect(viewModel.actionNowItems.some((item) => item.title === "Drive overheating")).toBe(true);

    for (let i = 1; i < viewModel.actionNowItems.length; i += 1) {
      expect(viewModel.actionNowItems[i - 1].urgencyScore).toBeGreaterThanOrEqual(
        viewModel.actionNowItems[i].urgencyScore,
      );
    }
  });

});
