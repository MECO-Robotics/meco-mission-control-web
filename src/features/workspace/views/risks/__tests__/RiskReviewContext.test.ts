import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import { RiskReviewContext } from "../RiskReviewContext";
import { ConcernContext } from "../prototype/EngineeringRisksPrototype";
import { createConcernScenarios } from "../prototype/riskConcernPrototypeModel";

function renderContext(bootstrap = createBootstrap(), selected: { kind: "risk" | "task"; id: string } = { kind: "risk", id: "risk-1" }, pending = false) {
  return renderToStaticMarkup(React.createElement(RiskReviewContext, { bootstrap, selected, pending, onClose: jest.fn(), onEditRisk: jest.fn(), onUpdateRisk: jest.fn(async () => undefined), onOpenRecord: jest.fn() }));
}

it("keeps a completed mitigation distinct from resolution of the risk", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks[0].mitigationTaskId = "task-1";
  bootstrap.tasks[0].status = "complete";
  const markup = renderContext(bootstrap);
  expect(markup).toContain("Mitigation complete; risk still open");
  expect(markup).toContain("Open mitigation task");
  expect(markup).toContain('aria-label="Close risk details"');
  expect(markup).toContain("Linked work and dependencies");
  expect(markup).not.toContain("Risk detailed view");

  const scenario = createConcernScenarios()[0];
  const prototypeMarkup = renderToStaticMarkup(React.createElement(ConcernContext, {
    concern: scenario,
    bootstrap,
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onReplace: jest.fn(),
    onTaskComplete: jest.fn(),
    onResolve: jest.fn(),
  }));
  expect(prototypeMarkup).toContain("Risk detailed view");
  expect(prototypeMarkup).toContain(`<h2 tabindex="-1">${scenario.title}</h2>`);
});

it("preserves missing supply attachments as visibly unavailable context", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks[0].relatedTargets = [{ kind: "purchase-item", id: "deleted:purchase" }, { kind: "manufacturing-details", id: "deleted:task" }];
  const markup = renderContext(bootstrap);
  expect(markup).toContain("Attached records");
  expect(markup).toContain("Unavailable purchase-item · deleted:purchase");
  expect(markup).toContain("Unavailable manufacturing-details · deleted:task");
  expect(markup).toMatch(/disabled=""[^>]*>Unavailable purchase-item/);
});

it("makes risk changes unavailable during a write and opens tasks through their existing detail action", () => {
  const riskMarkup = renderContext(createBootstrap(), { kind: "risk", id: "risk-1" }, true);
  expect(riskMarkup).toContain('aria-busy="true"');
  expect((riskMarkup.match(/<select[^>]*>/g) ?? []).every(field => field.includes('disabled=""'))).toBe(true);
  expect(riskMarkup).toContain("Saving risk…");
  const taskMarkup = renderContext(createBootstrap(), { kind: "task", id: "task-1" });
  expect(taskMarkup).toContain("Open task");
  expect(taskMarkup).not.toContain("<select");
  expect(taskMarkup).not.toContain("Edit risk");
  expect(taskMarkup).not.toContain("Risk detailed view");
});
