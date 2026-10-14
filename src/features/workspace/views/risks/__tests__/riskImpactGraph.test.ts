import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import { buildRiskImpactGraph } from "../riskImpactGraph";
import { RiskImpactGraph } from "../RiskImpactGraph";
import type { BootstrapPayload } from "@/types/bootstrap";

function dependency(taskId: string, refId: string, kind: "task" | "part-instance" | "milestone" = "task"): BootstrapPayload["taskDependencies"][number] {
  return { id: `${taskId}:${kind}:${refId}`, taskId, refId, kind, dependencyType: "hard", createdAt: "2026-10-14T00:00:00Z" };
}

it("shows explicit risk blocking separately from attachment and mitigation associations", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [{ ...bootstrap.risks[0], blocksWork: true, relatedTargets: [{ kind: "task", id: "task-1" }, { kind: "subsystem", id: "subsystem-1" }], mitigationTaskId: "task-2" }];
  bootstrap.taskDependencies = [dependency("task-2", "task-1")];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "risk", id: bootstrap.risks[0].id });
  expect(graph.directlyBlockedTaskCount).toBe(1);
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "task:task-1", label: "blocks" });
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "subsystem:subsystem-1", label: "attached to" });
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "task:task-2", label: "mitigated by" });
  expect(graph.downstreamTaskCount).toBe(0);
});

it("counts unique unfinished downstream work, terminates cycles, and ignores soft edges", () => {
  const bootstrap = createBootstrap();
  const base = bootstrap.tasks[0];
  bootstrap.tasks = [1, 2, 3, 4].map((id) => ({ ...base, id: `task-${id}`, title: `Task ${id}`, status: id === 4 ? "complete" : "not-started" }));
  bootstrap.taskDependencies = [dependency("task-2", "task-1"), dependency("task-3", "task-2"), dependency("task-1", "task-3"), dependency("task-3", "task-1"), dependency("task-4", "task-1"), { ...dependency("soft-task", "task-1"), dependencyType: "soft" }];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "task", id: "task-1" });
  expect(graph.downstreamTaskCount).toBe(2);
  expect(graph.hasCycle).toBe(true);
  expect(graph.nodes.map((node) => node.key)).not.toContain("task:task-4");
  expect(graph.nodes.map((node) => node.key)).not.toContain("task:soft-task");
  bootstrap.taskDependencies.reverse();
  expect(buildRiskImpactGraph(bootstrap, { kind: "task", id: "task-1" })).toEqual(graph);
});

it("retains missing task, part and milestone prerequisites as unavailable typed nodes", () => {
  const bootstrap = createBootstrap();
  bootstrap.taskDependencies = [dependency("task-1", "lost-task"), dependency("task-1", "lost-part", "part-instance"), dependency("task-1", "lost-milestone", "milestone")];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "task", id: "task-1" });
  expect(graph.nodes.filter((node) => !node.available).map((node) => node.key).sort()).toEqual(["milestone:lost-milestone", "part-instance:lost-part", "task:lost-task"]);
  for (const to of ["task:lost-task", "part-instance:lost-part", "milestone:lost-milestone"]) expect(graph.edges).toContainEqual({ from: "task:task-1", to, label: "depends on" });
  expect(graph.hasCycle).toBe(false);
});

it("does not promote attached supply context or mitigation work into direct blocking", () => {
  const bootstrap = createBootstrap();
  bootstrap.purchaseItems = [{ id: "purchase-1", taskId: "task-1", kind: "cots-goods", title: "Ratchet hardware", partDefinitionId: null, materialId: null, quantity: 1, quotes: [], selectedQuoteId: null, approvalStatus: "pending", approvedById: null, approvedAt: null, purchaseOrderNumber: null, orderStatus: "not-ordered", finalCost: null, expectedDeliveryDate: null, trackingNumber: null, trackingUrl: null, orderedAt: null, deliveredAt: null }];
  bootstrap.risks = [{ ...bootstrap.risks[0], blocksWork: true, relatedTargets: [{ kind: "material", id: "missing-material" }, { kind: "purchase-item", id: "purchase-1" }], mitigationTaskId: "task-1" }];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "risk", id: bootstrap.risks[0].id });
  expect(graph.directlyBlockedTaskCount).toBe(0);
  expect(graph.edges.some((edge) => edge.label === "blocks")).toBe(false);
  expect(graph.nodes.some((node) => node.key === "material:missing-material" && !node.available)).toBe(true);
  expect(graph.edges).toContainEqual({ from: "purchase-item:purchase-1", to: "task:task-1", label: "associated work" });
  const taskGraph = buildRiskImpactGraph(bootstrap, { kind: "task", id: "task-1" });
  expect(taskGraph.edges).toContainEqual({ from: "purchase-item:purchase-1", to: "task:task-1", label: "associated work" });
  expect(taskGraph.directlyBlockedTaskCount).toBe(0);
});

it("treats a task source as attachment context without inventing a direct blocker", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [{ ...bootstrap.risks[0], blocksWork: true, relatedTargets: [], mitigationTaskId: null, source: { kind: "task", id: "task-1" } }];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "risk", id: bootstrap.risks[0].id });
  expect(graph.directlyBlockedTaskCount).toBe(0);
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "task:task-1", label: "attached to" });
});

it("retains test evidence without spreading milestone review context to every scheduled task", () => {
  const bootstrap = createBootstrap();
  bootstrap.milestones = [{ id: "readiness", seasonId: "season-1", projectIds: ["project-1"], title: "Robot readiness", type: "internal-review", status: "planned", startAt: "2026-10-14T12:00:00Z", endAt: null, description: "" }];
  bootstrap.tasks.forEach(task => { task.scheduleRefs = [{ kind: "milestone", id: "readiness" }]; });
  bootstrap.testResults = [{ id: "readiness-result", projectId: "project-1", title: "Robot readiness result", status: "blocked", targetRefs: [{ kind: "milestone", id: "readiness" }] }];
  bootstrap.risks = [{ ...bootstrap.risks[0], blocksWork: true, source: { kind: "test-result", id: "readiness-result" }, relatedTargets: [{ kind: "task", id: "task-1" }], mitigationTaskId: null }];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "risk", id: "risk-1" });
  expect(graph.nodes).toContainEqual(expect.objectContaining({ key: "test-result:readiness-result", kind: "test-result", available: true }));
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "test-result:readiness-result", label: "attached to" });
  expect(graph.nodes.filter(node => node.kind === "task").map(node => node.id)).toEqual(["task-1"]);
  expect(graph.directlyBlockedTaskCount).toBe(1);
});

it("shows the selected task's blocking CNC risk without traversing unrelated risk targets", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [{ ...bootstrap.risks[0], title: "CNC throughput", blocksWork: true, relatedTargets: [{ kind: "task", id: "task-1" }, { kind: "task", id: "task-2" }], mitigationTaskId: "task-1" }];
  const other = { ...bootstrap.tasks[0], id: "unrelated-downstream", title: "Other build" };
  bootstrap.tasks.push(other);
  bootstrap.taskDependencies = [dependency(other.id, "task-2")];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "task", id: "task-1" });
  expect(graph.nodes.find((node) => node.key === "risk:risk-1")?.label).toContain("CNC throughput");
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "task:task-1", label: "blocks" });
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "task:task-1", label: "mitigated by" });
  expect(graph.directlyBlockedTaskCount).toBe(1);
  expect(graph.downstreamTaskCount).toBe(0);
  expect(graph.nodes.some((node) => node.id === other.id || node.id === "task-2")).toBe(false);
});

it("places DAG tasks after their longest prerequisite path", () => {
  const bootstrap = createBootstrap();
  bootstrap.tasks = [1, 2, 3].map((id) => ({ ...bootstrap.tasks[0], id: `task-${id}` }));
  bootstrap.risks = [];
  bootstrap.taskDependencies = [dependency("task-2", "task-1"), dependency("task-3", "task-1"), dependency("task-3", "task-2")];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "task", id: "task-1" });
  const layer = (key: string) => graph.nodes.find((node) => node.key === key)!.layer;
  expect(layer("task:task-3")).toBeGreaterThan(layer("task:task-2"));
  expect(layer("task:task-2")).toBeGreaterThan(layer("task:task-1"));
  expect(graph.hasCycle).toBe(false);
});

it("keeps full impact counts while initially drawing only 30 records", () => {
  const bootstrap = createBootstrap();
  const base = bootstrap.tasks[0];
  bootstrap.tasks = Array.from({ length: 35 }, (_, index) => ({ ...base, id: `task-${index}`, title: `Task ${index}` }));
  bootstrap.taskDependencies = bootstrap.tasks.slice(1).map((task, index) => dependency(task.id, `task-${index}`));
  const selected = { kind: "task" as const, id: "task-0" };
  const graph = buildRiskImpactGraph(bootstrap, selected);
  expect(graph.nodes).toHaveLength(35);
  expect(graph.downstreamTaskCount).toBe(34);
  const markup = renderToStaticMarkup(React.createElement(RiskImpactGraph, { bootstrap, selected, onOpenRecord: jest.fn() }));
  expect(markup.match(/class="risk-impact-node/g)).toHaveLength(30);
  expect(markup).toContain("34 downstream unfinished tasks");
  expect(markup).toContain("Show all 35 records");
  expect(markup).toContain("Read all 34 relationships");
});

it("keeps mitigation and its prerequisites visible without treating its unrelated dependents as affected work", () => {
  const bootstrap = createBootstrap();
  bootstrap.tasks = [1, 2, 3, 4, 5].map((id) => ({ ...bootstrap.tasks[0], id: `task-${id}`, title: `Task ${id}` }));
  bootstrap.risks = [{ ...bootstrap.risks[0], source: { kind: "manual" }, relatedTargets: [{ kind: "task", id: "task-1" }], mitigationTaskId: "task-3", blocksWork: true }];
  bootstrap.taskDependencies = [dependency("task-2", "task-1"), dependency("task-4", "task-3"), dependency("task-3", "task-5")];
  const graph = buildRiskImpactGraph(bootstrap, { kind: "risk", id: bootstrap.risks[0].id });
  expect(graph.downstreamTaskCount).toBe(1);
  expect(graph.nodes.map((node) => node.key)).toEqual(expect.arrayContaining(["task:task-1", "task:task-2", "task:task-3", "task:task-5"]));
  expect(graph.nodes.some((node) => node.key === "task:task-4")).toBe(false);
  expect(graph.edges).toContainEqual({ from: "risk:risk-1", to: "task:task-3", label: "mitigated by" });
  expect(graph.edges).toContainEqual({ from: "task:task-3", to: "task:task-5", label: "depends on" });
});
