import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import { buildRiskDashboard } from "../riskDashboardModel";
import type { RiskTriageFilters } from "../riskTriageModel";

const filters: RiskTriageFilters = { search: "", source: "all", owner: "all", signal: "all", sortField: "priority", sortDirection: "asc" };
const today = new Date(2026, 3, 23, 12);

it("counts tasks once per area regardless of how many risks block them", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks.push({ ...bootstrap.risks[0], id: "additional" });
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today });
  expect(model.areas[0]).toMatchObject({ id: "subsystem-1", taskCount: 2, blocked: 2, dependency: 0, qa: 0, other: 0 });
  expect(model.responses.reduce((total, cell) => total + cell.count, 0)).toBe(3);
});

it("includes ordinary unfinished work in charts and contextual selection, keeping default queue actionable", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [];
  bootstrap.tasks = bootstrap.tasks.map(task => ({ ...task, dueDate: "2026-06-01", ownerId: "member-1" }));
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today });
  expect(model.rows).toHaveLength(2);
  expect(model.queueRows).toHaveLength(0);
  expect(model.areas[0].other).toBe(2);
  const selected = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today, selection: { kind: "area", areaId: "subsystem-1", segment: "other" } });
  expect(selected.queueRows).toHaveLength(2);
  expect(selected.areas).toEqual(model.areas);
});

it("buckets task and risk dates separately with local calendar boundaries and invalid dates", () => {
  const bootstrap = createBootstrap();
  bootstrap.tasks[0].dueDate = "2026-04-23";
  bootstrap.tasks[1].dueDate = "invalid";
  bootstrap.risks[0].mitigationDueDate = "2026-04-30";
  bootstrap.risks[1].mitigationDueDate = "2026-04-31";
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today });
  expect(model.deadlines.find(bucket => bucket.id === "today")).toMatchObject({ taskCount: 1, riskCount: 0 });
  expect(model.deadlines.find(bucket => bucket.id === "soon")).toMatchObject({ taskCount: 0, riskCount: 1 });
  expect(model.deadlines.find(bucket => bucket.id === "undated")).toMatchObject({ taskCount: 1, riskCount: 1 });
  expect(buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today, selection: { kind: "deadline", source: "risk", bucket: "soon" } }).queueRows.map(row => row.recordId)).toEqual(["risk-1"]);
});

it("partitions only unresolved risks by valid owner and resolvable mitigation", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks[0] = { ...bootstrap.risks[0], ownerMemberId: "member-1" };
  bootstrap.risks[1] = { ...bootstrap.risks[1], ownerMemberId: "missing", mitigationTaskId: "missing" };
  bootstrap.risks.push({ ...bootstrap.risks[0], id: "resolved", status: "resolved" });
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today, includeResolvedRisks: true });
  expect(model.responses.find(cell => cell.owner && cell.mitigation)).toMatchObject({ count: 1, highCount: 1 });
  expect(model.responses.find(cell => !cell.owner && !cell.mitigation)?.count).toBe(1);
  expect(model.responses.reduce((total, cell) => total + cell.count, 0)).toBe(2);
});

it("applies source, search and people scope before chart aggregation", () => {
  const bootstrap = createBootstrap();
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: ["member-1"], filters: { ...filters, source: "risk", search: "Only Alex" }, today });
  expect(model.rows.map(row => row.recordId)).toEqual(["risk-1"]);
  expect(model.areas).toEqual([]);
  expect(model.responses.reduce((total, cell) => total + cell.count, 0)).toBe(1);
});

it("handles overlapping subsystem assignments and per-project unassigned work without inventing a global sum", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [];
  bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "second", name: "Arm" });
  bootstrap.tasks[0].subsystemIds = ["subsystem-1", "second", "second"];
  bootstrap.tasks[1].subsystemIds = [];
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today });
  expect(model.areas.find(area => area.id === "subsystem-1")?.taskCount).toBe(1);
  expect(model.areas.find(area => area.id === "second")?.taskCount).toBe(1);
  expect(model.areas.find(area => area.id === "unassigned:project-1")?.taskCount).toBe(1);
  bootstrap.tasks[1].status = "complete";
  expect(buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today }).areas.some(area => area.id.startsWith("unassigned:"))).toBe(false);
});

it("separates dependency waits from explicit blockers and QA, retaining associated risks", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [{ ...bootstrap.risks[0], blocksWork: false }];
  bootstrap.tasks[0].status = "waiting-for-qa";
  bootstrap.taskDependencies = [{ id: "d", taskId: "task-1", kind: "task", refId: "task-2", dependencyType: "hard", createdAt: "2026-04-20" }];
  bootstrap.tasks[1].isBlocked = true;
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today, selection: { kind: "area", areaId: "subsystem-1", segment: "dependency" } });
  expect(model.areas[0]).toMatchObject({ blocked: 1, dependency: 1, qa: 0, other: 0 });
  expect(model.queueRows.map(row => row.key)).toEqual(["task:task-1", "risk:risk-1"]);
});

it("attributes placed-part-only tasks to explicit intended or installed areas", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [];
  bootstrap.mechanisms = [{ id: "mechanism", subsystemId: "subsystem-1", name: "Module", description: "", googleSheetsUrl: "", iteration: 1 }];
  bootstrap.partInstances = [
    { id: "intended", partDefinitionId: "definition", intendedSubsystemId: null, intendedMechanismId: "mechanism", location: { kind: "stock", location: "Bin" } },
    { id: "installed", partDefinitionId: "definition", intendedSubsystemId: null, intendedMechanismId: null, location: { kind: "installed", subsystemId: "subsystem-1", mechanismId: null } },
  ];
  bootstrap.tasks = bootstrap.tasks.map((task, index) => ({ ...task, subsystemIds: [], mechanismIds: [], partInstanceIds: [index ? "installed" : "intended"] }));
  const model = buildRiskDashboard({ bootstrap, activePersonFilter: [], filters, today });
  expect(model.areas).toHaveLength(1);
  expect(model.areas[0]).toMatchObject({ id: "subsystem-1", taskCount: 2 });
});
