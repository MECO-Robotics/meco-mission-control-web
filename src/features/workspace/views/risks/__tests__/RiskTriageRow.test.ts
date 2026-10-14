import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AttentionQueueRow } from "../../attention/attentionQueue";
import { RiskTriageRow } from "../RiskTriageRow";

const row: AttentionQueueRow = {
  key: "risk:one", recordId: "one", source: "risk", action: "open-risk", title: "Intake clearance",
  detail: "Roller contacts the frame at full extension.", context: "Alex · Competition robot", reasons: ["Blocks work", "Overdue"],
  urgency: 100, ownerMemberId: "alex", priority: "critical", status: "in-progress", dueDate: "2026-10-14",
  signals: ["blocked", "overdue"], needsReview: false, areaLabels: ["Intake"],
};
const render = (props: Partial<React.ComponentProps<typeof RiskTriageRow>> = {}) => renderToStaticMarkup(React.createElement(RiskTriageRow, { row, selected: false, pending: false, onSelect: jest.fn(), ...props }));

it("makes risk context readable before opening the inspector", () => {
  const markup = render();
  expect(markup.match(/>Intake clearance<\/strong>/g)).toHaveLength(1);
  for (const text of ["Roller contacts the frame", "Alex · Competition robot", "critical risk", "in progress", "Intake", "Blocks work", "Overdue"]) expect(markup).toContain(text);
  expect(markup).toContain('dateTime="2026-10-14"');
  expect(markup).not.toContain("<select");
});

it("exposes the current selection and prevents opening a pending risk twice", () => {
  const markup = render({ selected: true, pending: true });
  expect(markup).toContain('aria-pressed="true"');
  expect(markup).toContain('aria-busy="true"');
  expect(markup).toMatch(/<button[^>]*disabled=""/);
  expect(markup).toContain('role="status">Saving risk…');
});

it("labels task priority separately and retains useful undated context", () => {
  const markup = render({ row: { ...row, key: "task:one", source: "task", action: "open-task", title: "Check intake fit", priority: "high", status: "waiting-for-qa", dueDate: null, detail: "" } });
  expect(markup).toContain("high priority");
  expect(markup).toContain("Task · Alex");
  expect(markup).toContain("waiting for qa");
  expect(markup).toContain("No due date");
  expect(markup).not.toContain("<select");
});
