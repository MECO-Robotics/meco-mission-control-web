import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import { getRiskAffectedTaskIds, getRiskRecordReference } from "../riskRecordLinks";
import { buildRiskViewLookups } from "../riskViewDataLookups";

function fixture() {
  const bootstrap = createBootstrap();
  bootstrap.tasks[0].manufacturingDetails = {
    part: { kind: "part-definition", partDefinitionId: "definition:one" }, quantity: 1,
    processId: "cnc", fulfillmentSource: "in-house", material: { kind: "inventory-material", materialId: "material:one" },
    fileArtifactIds: [], tolerances: [], qaRequirements: [],
  };
  bootstrap.purchaseItems = [{ id: "purchase:one", taskId: bootstrap.tasks[1].id, title: "Intake bearings", kind: "cots-goods", partDefinitionId: null, materialId: "material:one", quantity: 1, quotes: [], selectedQuoteId: null, approvalStatus: "pending", approvedById: null, approvedAt: null, purchaseOrderNumber: null, orderStatus: "not-ordered", finalCost: null, expectedDeliveryDate: null, trackingNumber: null, trackingUrl: null, orderedAt: null, deliveredAt: null }];
  return bootstrap;
}

it("resolves manufacturing by task identity and purchasing by the recorded task association", () => {
  const bootstrap = fixture();
  expect(getRiskRecordReference({ kind: "manufacturing-details", id: "task-1" }, bootstrap)).toMatchObject({ available: true, taskIds: ["task-1"], label: "Manufacturing · Member one task" });
  expect(getRiskRecordReference({ kind: "purchase-item", id: "purchase:one" }, bootstrap)).toMatchObject({ key: "purchase-item:purchase:one", available: true, taskIds: ["task-2"], label: "Purchase · Intake bearings" });
  expect(getRiskRecordReference({ kind: "manufacturing-details", id: "task-2" }, bootstrap).available).toBe(false);
});

it("keeps missing references visible without fabricating associated work", () => {
  const bootstrap = fixture();
  for (const kind of ["task", "purchase-item", "manufacturing-details", "material", "unsupported"]) {
    expect(getRiskRecordReference({ kind, id: "deleted" }, bootstrap)).toMatchObject({ available: false, taskIds: [], label: `Unavailable ${kind} · deleted` });
  }
});

it("combines explicit source and attachments once while keeping mitigation separate", () => {
  const bootstrap = fixture();
  const risk = { ...bootstrap.risks[0], source: { kind: "manufacturing-details" as const, id: "task-1" }, relatedTargets: [{ kind: "task" as const, id: "task-1" }], mitigationTaskId: "task-2" };
  expect(getRiskAffectedTaskIds(risk, bootstrap)).toEqual(["task-1"]);
  risk.relatedTargets.push({ kind: "task", id: "task-2" });
  expect(getRiskAffectedTaskIds(risk, bootstrap)).toEqual(["task-1", "task-2"]);
});

it("uses explicit inventory and manufacturing associations without matching provisional names", () => {
  const bootstrap = fixture();
  bootstrap.materials = [{ id: "material:one", name: "Aluminum", category: "metal", unit: "piece", onHandQuantity: 1, reorderPoint: 0, location: "Shop", preferredVendorId: null, notes: "" }];
  expect(getRiskRecordReference({ kind: "material", id: "material:one" }, bootstrap).taskIds).toEqual(["task-1", "task-2"]);
  bootstrap.tasks[0].manufacturingDetails!.material = { kind: "specified-material", name: "Aluminum" };
  expect(getRiskRecordReference({ kind: "material", id: "material:one" }, bootstrap).taskIds).toEqual(["task-2"]);
});

it("follows report attachments and safely stops cyclic references", () => {
  const bootstrap = fixture();
  const report = bootstrap.reports[0]!;
  report.targetRefs = [{ kind: "task", id: "task-1" }, { kind: "report", id: report.id }];
  expect(getRiskRecordReference({ kind: "report", id: report.id }, bootstrap).taskIds).toEqual(["task-1"]);
});

it("uses concrete report subjects without expanding their project or workstream context", () => {
  const bootstrap = fixture();
  const report = bootstrap.reports[0]!;
  report.targetRefs = [{ kind: "project", id: "project-1" }, { kind: "task", id: "task-1" }];
  const risk = { ...bootstrap.risks[0], source: { kind: "report" as const, id: report.id }, relatedTargets: [], mitigationTaskId: null };
  expect(getRiskAffectedTaskIds(risk, bootstrap)).toEqual(["task-1"]);
  expect(getRiskRecordReference({ kind: "report", id: report.id }, bootstrap).taskIds).toEqual(["task-1"]);
  expect(getRiskRecordReference({ kind: "project", id: "project-1" }, bootstrap).taskIds).toEqual(["task-1", "task-2"]);
});

it("keeps milestone test provenance from implying every task scheduled for the review is affected", () => {
  const bootstrap = fixture();
  bootstrap.milestones = [{ id: "review", seasonId: "season-1", projectIds: ["project-1"], title: "Robot readiness", type: "internal-review", status: "planned", startAt: "2026-10-14T12:00:00Z", endAt: null, description: "" }];
  bootstrap.tasks.forEach(task => { task.scheduleRefs = [{ kind: "milestone", id: "review" }]; });
  bootstrap.testResults = [{ id: "test-review", projectId: "project-1", title: "Robot readiness result", status: "blocked", targetRefs: [{ kind: "milestone", id: "review" }] }];
  const risk = { ...bootstrap.risks[0], source: { kind: "test-result" as const, id: "test-review" }, relatedTargets: [{ kind: "task" as const, id: "task-1" }], mitigationTaskId: "task-2" };
  expect(getRiskAffectedTaskIds(risk, bootstrap)).toEqual(["task-1"]);
  expect(getRiskRecordReference({ kind: "test-result", id: "test-review" }, bootstrap)).toMatchObject({ available: true, taskIds: [] });
  expect(getRiskRecordReference({ kind: "milestone", id: "review" }, bootstrap).taskIds).toEqual(["task-1", "task-2"]);
});

it("offers purchase and manufacturing attachments with the same labels used by source details", () => {
  const bootstrap = fixture();
  const lookups = buildRiskViewLookups({ bootstrap, scopedTasks: [bootstrap.tasks[0]] });
  expect(lookups.targetOptions).toContainEqual({ id: "purchase-item:purchase:one", name: "Purchase · Intake bearings" });
  expect(lookups.targetOptions).toContainEqual({ id: "manufacturing-details:task-1", name: "Manufacturing · Member one task" });
  expect(lookups.mitigationTaskOptions.map(option => option.id)).toEqual(["task-1"]);
});
