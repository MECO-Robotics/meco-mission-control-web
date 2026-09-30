/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RisksView } from "@/features/workspace/views/RisksView";
import { RiskMetricsSection } from "../RiskMetricsSection";
import { buildRiskViewScopeData } from "../riskViewData/riskViewDataScope";
import { parseTimestamp } from "@/features/workspace/views/riskViewData/riskViewMetricsUtils";
import { createBootstrap, createMetricsBootstrap } from "./riskViewTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("RisksView", () => {
  it("filters risk rows by the global active person filter", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RisksView, {
        activePersonFilter: ["member-1"],
        bootstrap: createBootstrap(),
        onDeleteRisk: jest.fn(),
        onUpdateRisk: jest.fn(),
      }),
    );

    expect(markup).toContain("Member one risk");
    expect(markup).not.toContain("Member two risk");
  });

  it("keeps hours progress and task completion semantics separate in dashboard health", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RiskMetricsSection, buildRiskViewScopeData({
        activePersonFilter: [],
        bootstrap: createMetricsBootstrap(),
      }).metrics),
    );

    expect(markup).toContain("Build Health:");
    expect(markup).toContain("Plan vs Actual");
    expect(markup).toContain("150.0h");
    expect(markup).toContain("39.3h");
    expect(markup).toContain("110.7h");
    expect(markup).toContain("26% of planned hours logged");
    expect(markup).toContain("Task completion");
    expect(markup).toContain("1 of 26 tasks closed");
    expect(markup).toContain("4% of tasks complete");
    expect(markup).toContain("Progress");
    expect(markup).toContain("Needs Attention");
    expect(markup).toContain("Coverage");
  });

  it("keeps empty filtered metric scopes neutral instead of behind", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RiskMetricsSection, buildRiskViewScopeData({
        activePersonFilter: ["missing-member"],
        bootstrap: createMetricsBootstrap(),
      }).metrics),
    );

    expect(markup).toContain("Build Health: On Track");
    expect(markup).toContain("No tasks in scope");
  });

  it("preserves blocker counts, oldest age, and task activity metrics", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-02T12:00:00.000Z"));
    try {
      const { metrics } = buildRiskViewScopeData({
        activePersonFilter: [],
        bootstrap: createMetricsBootstrap(),
      });

      expect(metrics).toMatchObject({
        blockerBreakdown: {
          designIssue: 1,
          lostBrokenPart: 1,
          lostBrokenTool: 0,
          supplyMaterial: 0,
          other: 0,
        },
        oldestBlockerAgeDays: 7,
        unresolvedBlockerCount: 2,
      });
      expect(metrics.subsystemMetrics[0]).toMatchObject({
        blockerCount: 2,
        lastActivityAgeDays: 1,
        oldestBlockerAgeDays: 7,
      });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("parseTimestamp", () => {
  it("parses date-only values as local midnight", () => {
    expect(parseTimestamp("2026-05-01")).toBe(new Date(2026, 4, 1).getTime());
  });

  it("returns null for invalid date-only values", () => {
    expect(parseTimestamp("2026-02-31")).toBeNull();
  });
});
