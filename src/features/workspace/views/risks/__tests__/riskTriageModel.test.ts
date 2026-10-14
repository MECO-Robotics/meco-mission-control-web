import type { AttentionQueueRow } from "../../attention/attentionQueue";
import { filterRiskTriageRows, type RiskTriageFilters } from "../riskTriageModel";

const defaults: RiskTriageFilters = {
  search: "", source: "all", owner: "all", signal: "all", sortField: "priority", sortDirection: "asc",
};

function row(id: string, overrides: Partial<AttentionQueueRow> = {}): AttentionQueueRow {
  return {
    key: `risk:${id}`, recordId: id, source: "risk", action: "open-risk", title: id,
    context: "Brian · Robot", reasons: ["No mitigation task"], urgency: 50,
    ownerMemberId: "member-1", priority: "medium", status: "open", dueDate: null,
    signals: ["no-mitigation"], needsReview: false, ...overrides,
  };
}

const ids = (rows: AttentionQueueRow[], filters: Partial<RiskTriageFilters> = {}) =>
  filterRiskTriageRows(rows, { ...defaults, ...filters }).map(item => item.recordId);

it("combines source, owner, signal and search against the same queue", () => {
  const rows = [
    row("assigned", { signals: ["overdue"], reasons: ["Overdue"] }),
    row("unassigned", { ownerMemberId: null, signals: ["overdue"], reasons: ["Overdue"] }),
    row("task", { source: "task", action: "open-task", signals: ["overdue"], reasons: ["Overdue"] }),
    row("other"),
  ];
  expect(ids(rows, { source: "risk", owner: "member-1", signal: "overdue", search: "  ROBOT  " })).toEqual(["assigned"]);
  expect(ids(rows, { owner: "unassigned" })).toEqual(["unassigned"]);
  expect(ids(rows, { source: "task" })).toEqual(["task"]);
  expect(ids(rows, { owner: "missing-member" })).toEqual([]);
});

it("searches visible record context, priority, status and reasons without case sensitivity", () => {
  const rows = [row("one", { title: "Cable clearance", priority: "critical", status: "in-progress" })];
  for (const search of [" CABLE ", "brian", "ROBOT", "critical", "in-progress", "mitigation"]) {
    expect(ids(rows, { search })).toEqual(["one"]);
  }
  expect(ids(rows, { search: "unrelated" })).toEqual([]);
});

it("preserves urgency order by default and reverses it when requested without changing the input", () => {
  const rows = [row("blocked", { urgency: 100, priority: "low" }), row("critical", { urgency: 80, priority: "critical" }), row("routine")];
  expect(ids(rows)).toEqual(["blocked", "critical", "routine"]);
  expect(ids(rows, { sortDirection: "desc" })).toEqual(["routine", "critical", "blocked"]);
  expect(rows.map(item => item.recordId)).toEqual(["blocked", "critical", "routine"]);
});

it("sorts due dates in either direction while leaving undated records last", () => {
  const rows = [row("undated"), row("later", { dueDate: "2026-10-20" }), row("earlier", { dueDate: "2026-10-14" })];
  expect(ids(rows, { sortField: "dueDate" })).toEqual(["earlier", "later", "undated"]);
  expect(ids(rows, { sortField: "dueDate", sortDirection: "desc" })).toEqual(["later", "earlier", "undated"]);
});

it("uses record keys for deterministic title ties and supports descending title order", () => {
  const rows = [row("b", { title: "Same" }), row("z", { title: "Zulu" }), row("a", { title: "Same" })];
  expect(ids(rows, { sortField: "title" })).toEqual(["a", "b", "z"]);
  expect(ids(rows, { sortField: "title", sortDirection: "desc" })).toEqual(["z", "a", "b"]);
  expect(ids([], { sortField: "title" })).toEqual([]);
});
