import { buildAttentionQueue } from "../attentionQueue";
import { createBootstrap } from "../../__tests__/riskViewTestFixtures";

const today = new Date(2026, 3, 23, 12);

it("keeps one row per record with all signals, excluding completed tasks", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks[0] = { ...bootstrap.risks[0], mitigationDueDate: "2026-04-22", mitigationTaskId: null };
  bootstrap.tasks[1] = { ...bootstrap.tasks[1], status: "complete" };
  const rows = buildAttentionQueue({ bootstrap, activePersonFilter: [], today });
  expect(rows.filter(row => row.key === "risk:risk-1")).toHaveLength(1);
  expect(rows.find(row => row.key === "risk:risk-1")?.signals).toEqual(["blocked", "overdue", "high-risk", "unassigned", "no-mitigation"]);
  expect(rows.some(row => row.key === "task:task-2")).toBe(false);
});

it("matches risk ownership or linked task people, within project scope", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks.push({ ...bootstrap.risks[0], id: "owned", ownerMemberId: "member-1", relatedTargets: [], mitigationTaskId: null });
  bootstrap.risks.push({ ...bootstrap.risks[0], id: "other-project", projectId: "other", ownerMemberId: "member-1" });
  const rows = buildAttentionQueue({ bootstrap, activePersonFilter: ["member-1"], projectId: "project-1", today });
  expect(rows.filter(row => row.source === "risk").map(row => row.recordId)).toEqual(["owned", "risk-1"]);
  expect(rows.some(row => row.recordId === "risk-2" || row.recordId === "other-project")).toBe(false);
  bootstrap.risks[0] = { ...bootstrap.risks[0], relatedTargets: [], mitigationTaskId: "task-1" };
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: ["member-1"], today }).some(row => row.recordId === "risk-1")).toBe(true);
});

it("orders blockers, overdue, high risks, QA waits, due soon and lower risks", () => {
  const bootstrap = createBootstrap();
  const risk = bootstrap.risks[0];
  bootstrap.risks = [
    { ...risk, id: "critical", severity: "critical", blocksWork: false },
    { ...risk, id: "lower", severity: "medium", blocksWork: false },
    { ...risk, id: "blocker", severity: "low", blocksWork: true, relatedTargets: [] },
  ];
  const task = bootstrap.tasks[0];
  bootstrap.tasks = [
    { ...task, id: "overdue", dueDate: "2026-04-22" },
    { ...task, id: "qa", dueDate: "2026-05-20", status: "waiting-for-qa" },
    { ...task, id: "soon", dueDate: "2026-04-25" },
  ];
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: [], today }).map(row => row.recordId)).toEqual(["blocker", "overdue", "critical", "qa", "soon", "lower"]);
});

it("keeps resolved risks out by default and includes them without active signals on request", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [{ ...bootstrap.risks[0], status: "resolved", mitigationDueDate: "2026-01-01" }];
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: [], today }).every(row => row.source === "task")).toBe(true);
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: [], today, includeResolvedRisks: true }).find(row => row.source === "risk")).toMatchObject({ urgency: 0, signals: ["resolved"] });
});

it("uses priority, due date, title and identity for deterministic ties", () => {
  const bootstrap = createBootstrap();
  const risk = { ...bootstrap.risks[0], blocksWork: false, severity: "low" as const };
  bootstrap.tasks = [];
  bootstrap.risks = [
    { ...risk, id: "z", title: "Same", mitigationDueDate: null },
    { ...risk, id: "b", title: "Same", mitigationDueDate: "2026-05-01" },
    { ...risk, id: "a", title: "Same", mitigationDueDate: "2026-05-01" },
    { ...risk, id: "priority", severity: "medium", mitigationDueDate: null },
  ];
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: [], today }).map(row => row.recordId)).toEqual(["priority", "a", "b", "z"]);
});

it("keeps coincident task and risk identities separate and catches unfinished dependencies", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [{ ...bootstrap.risks[0], id: "same", blocksWork: false, relatedTargets: [] }];
  bootstrap.tasks[0] = { ...bootstrap.tasks[0], id: "same", dueDate: "2026-05-20" };
  bootstrap.taskDependencies = [{ id: "dependency", taskId: "same", kind: "task", refId: "task-2", dependencyType: "hard", createdAt: "2026-04-20" }];
  const rows = buildAttentionQueue({ bootstrap, activePersonFilter: [], today });
  expect(rows.filter(row => row.recordId === "same").map(row => row.key)).toEqual(["task:same", "risk:same"]);
  expect(rows.find(row => row.key === "task:same")?.signals).toContain("blocked");
});

it("includes upcoming mitigation deadlines without marking undated risks due soon", () => {
  const bootstrap = createBootstrap();
  bootstrap.tasks = [];
  bootstrap.risks = bootstrap.risks.map((risk, index) => ({ ...risk, severity: "low", blocksWork: false, mitigationDueDate: index === 0 ? "2026-04-25" : null }));
  const rows = buildAttentionQueue({ bootstrap, activePersonFilter: [], today });
  expect(rows[0]).toMatchObject({ recordId: "risk-1", urgency: 60, dueDate: "2026-04-25", signals: expect.arrayContaining(["due-soon"]) });
  expect(rows[1].signals).not.toContain("due-soon");
});

it("adds detail and scope metadata without exposing ordinary unfinished tasks in Home", () => {
  const bootstrap = createBootstrap();
  bootstrap.risks = [];
  bootstrap.tasks = [{ ...bootstrap.tasks[0], dueDate: "2026-06-01", summary: "Known work", ownerId: "member-1" }];
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: [], today })).toEqual([]);
  expect(buildAttentionQueue({ bootstrap, activePersonFilter: [], today, includeAllUnfinishedTasks: true })[0]).toMatchObject({ detail: "Known work", projectId: "project-1", areaIds: ["subsystem-1"], areaLabels: ["Drive"], affectedTaskIds: ["task-1"], planningState: "ready" });
});
