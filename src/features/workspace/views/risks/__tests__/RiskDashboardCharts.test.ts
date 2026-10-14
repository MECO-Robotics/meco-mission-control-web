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

it("names the three chart regions and exposes observed counts with their denominators", () => {
  const html = renderCharts();
  expect(html).toContain('aria-labelledby="risk-areas-title"');
  expect(html).toContain('aria-labelledby="risk-deadlines-title"');
  expect(html).toContain('aria-labelledby="risk-response-title"');
  expect(html).toContain("Bottlenecks by area");
  expect(html).toContain("Deadline exposure");
  expect(html).toContain("Risk response");
  expect(html).toContain('aria-label="Drive, Robot: 2 blocked tasks of 2"');
  expect(html).toContain('aria-label="Overdue: 2 unfinished tasks"');
  expect(html).toContain('aria-label="No named owner, mitigation linked: 2 risks, 2 critical or high"');
  expect(html).toContain("2 open");
  expect(html).toContain("Tasks in multiple areas appear in each.");
});

it.each<RiskChartSelection>([
  { kind: "area", areaId: "subsystem-1", segment: "blocked" },
  { kind: "deadline", source: "task", bucket: "overdue" },
  { kind: "response", owner: false, mitigation: true },
])("exposes the selected %s chart control as pressed", selection => {
  expect(renderCharts(selection)).toContain('aria-pressed="true"');
});

it("makes zero-count selections unavailable and renders honest empty chart states", () => {
  const html = renderCharts(null, true);
  expect(html).toContain("No unfinished work in this scope.");
  expect(html).toContain("0 open");
  expect(html).not.toContain('aria-pressed="true"');
  expect(html).toContain('disabled="" aria-label="Overdue: 0 unfinished tasks"');
  expect(html).toContain('disabled="" aria-label="Named owner, mitigation linked: 0 risks, 0 critical or high"');
  expect(html).toContain("Recorded deadlines, not a delivery forecast.");
});
