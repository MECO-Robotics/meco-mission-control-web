import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AttentionQueueRow } from "../../attention/attentionQueue";
import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import { RiskTriageRow } from "../RiskTriageRow";

const bootstrap = createBootstrap();
const risk = { ...bootstrap.risks[0]!, title: "Intake clearance" };
const task = { ...bootstrap.tasks[0]!, title: "Check intake fit" };
const row: AttentionQueueRow = {
  key: `risk:${risk.id}`, recordId: risk.id, source: "risk", action: "open-risk",
  title: risk.title, context: "Alex Builder · Robot", reasons: ["Blocks work", "Overdue", "No mitigation task"],
  urgency: 100, ownerMemberId: risk.ownerMemberId, priority: risk.severity, status: risk.status,
  dueDate: "2026-10-14", signals: ["blocked", "overdue", "no-mitigation"], needsReview: false,
};
const props: React.ComponentProps<typeof RiskTriageRow> = {
  row, risk, members: bootstrap.members, mitigationTask: task, pending: false, editing: false,
  onOpenRisk: jest.fn(), onOpenTask: jest.fn(), onUpdateRisk: jest.fn(async () => undefined),
};

const render = (overrides: Partial<typeof props> = {}) => renderToStaticMarkup(React.createElement(RiskTriageRow, { ...props, ...overrides }));

it("provides one risk-opening action, labelled quick changes and mitigation navigation", () => {
  const markup = render();
  expect(markup.match(/>Intake clearance<\/button>/g)).toHaveLength(1);
  for (const label of ["Owner", "Severity", "Status"]) {
    expect(markup).toContain(`aria-label="${label} for Intake clearance"`);
  }
  expect(markup).toContain("Mitigation: Check intake fit");
  expect(markup).toContain('dateTime="2026-10-14"');
  expect(markup).toContain("Blocks work · Overdue");
  expect(markup).toMatch(/<summary>1 more signals?<\/summary>/);
  expect(markup).toContain("No mitigation task");
});

it("prevents conflicting risk changes and reports the pending write", () => {
  const markup = render({ pending: true });
  expect(markup).toContain('aria-busy="true"');
  expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Intake clearance<\/button>/);
  const fields = markup.match(/<select[^>]*>/g) ?? [];
  expect(fields).toHaveLength(3);
  expect(fields.every(field => field.includes('disabled=""'))).toBe(true);
  expect(markup).toContain('role="status">Saving risk…');
});

it("keeps quick changes disabled while the same risk is being edited", () => {
  const markup = render({ editing: true });
  expect((markup.match(/<select[^>]*>/g) ?? []).every(field => field.includes('disabled=""'))).toBe(true);
  expect(markup).not.toContain("Saving risk");
});

it("shows write failures as actionable row feedback", () => {
  const markup = render({ error: "The risk could not be saved." });
  expect(markup).toContain('role="alert"');
  expect(markup).toContain("The risk could not be saved. Choose the value again to retry.");
  expect(markup).not.toMatch(/<select[^>]*disabled/);
});

it("routes task signals through their task action without risk mutation controls", () => {
  const markup = render({
    risk: undefined, mitigationTask: undefined,
    row: { ...row, key: `task:${task.id}`, recordId: task.id, source: "task", action: "open-task", title: task.title, priority: "high", status: "waiting-for-qa" },
  });
  expect(markup).toContain("Check intake fit</button>");
  expect(markup).toContain("Task · Alex Builder · Robot · high · waiting-for-qa");
  expect(markup).not.toContain("<select");
  expect(markup).not.toContain('role="group"');
  expect(markup).not.toContain("Mitigation:");
});
