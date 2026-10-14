import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import { buildRiskDashboard, type RiskChartSelection } from "../riskDashboardModel";
import { RiskDashboardCharts } from "../RiskDashboardCharts";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderCharts(selection: RiskChartSelection | null = null, empty = false) {
  const bootstrap = createBootstrap();
  if (empty) { bootstrap.risks = []; bootstrap.tasks = []; }
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], today: new Date(2026, 3, 23), filters: { search: "", source: "all", owner: "all", signal: "all", sortField: "priority", sortDirection: "asc" } });
  return renderToStaticMarkup(React.createElement(RiskDashboardCharts, { ...model, selection, onSelect: jest.fn() }));
}

it("shows area and deadline charts with observed counts and denominators", () => {
  const html = renderCharts();
  expect(html).toContain('aria-labelledby="risk-areas-title"');
  expect(html).toContain('aria-labelledby="risk-deadlines-title"');
  expect(html).toContain("Bottlenecks by area");
  expect(html).toContain("Deadline exposure");
  expect(html).not.toContain("Risk response");
  expect(html).toContain('aria-label="Drive, Robot: 2 blocked tasks of 2"');
  expect(html).toContain('aria-label="Overdue: 2 unfinished tasks"');
  expect(html).toContain("Tasks in multiple areas appear in each.");
});

it.each<RiskChartSelection>([
  { kind: "area", areaId: "subsystem-1", segment: "blocked" },
  { kind: "deadline", source: "task", bucket: "overdue" },
])("exposes the selected %s chart control as pressed", selection => {
  expect(renderCharts(selection)).toContain('aria-pressed="true"');
});

it("makes zero-count selections unavailable and renders honest empty chart states", () => {
  const html = renderCharts(null, true);
  expect(html).toContain("No unfinished work in this scope.");
  expect(html).not.toContain('aria-pressed="true"');
  expect(html).toContain('disabled="" aria-label="Overdue: 0 unfinished tasks"');
  expect(html).toContain("Recorded deadlines, not a delivery forecast.");
});
