import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { buildAttentionQueue } from "../../attention/attentionQueue";
import { buildHomePressureGroups } from "../homePressureModel";
import { buildHomeWorkloadModel } from "../homeWorkloadModel";

const today = new Date("2026-10-20T12:00:00");
function setup() {
  const bootstrap = createBootstrap();
  bootstrap.risks = [];
  bootstrap.taskDependencies = [];
  const base = { ...bootstrap.tasks[0], ownerId: null, assigneeIds: [], responsibleGroupId: null,
    status: "in-progress" as const, dueDate: "2026-12-01", isBlocked: false };
  return { bootstrap, base };
}

it("partitions pressure signals from ordinary unfinished work without treating unassigned alone as pressure", () => {
  const { bootstrap, base } = setup();
  bootstrap.tasks = [
    { ...base, id: "blocked", isBlocked: true }, { ...base, id: "overdue", dueDate: "2026-10-19" },
    { ...base, id: "soon", dueDate: "2026-10-25" }, { ...base, id: "qa", status: "waiting-for-qa" },
    { ...base, id: "new", status: "not-started" }, { ...base, id: "ordinary" },
    { ...base, id: "complete", status: "complete" },
  ];
  const items = buildAttentionQueue({ bootstrap, activePersonFilter: [], today, includeAllUnfinishedTasks: true });
  const groups = buildHomePressureGroups(items, "team", bootstrap);
  const model = buildHomeWorkloadModel({ tasks: bootstrap.tasks, groups });
  expect(model.taskCount).toBe(6);
  expect(model.attentionCount).toBe(4);
  expect(model.rows[0].tasksByState.attention.map(task => task.id).sort()).toEqual(["blocked", "overdue", "qa", "soon"]);
  expect(model.rows[0].tasksByState["in-progress"].map(task => task.id)).toEqual(["ordinary"]);
  expect(model.rows[0].tasksByState["not-started"].map(task => task.id)).toEqual(["new"]);
});

it("keeps risk-only groups, separate unique record totals, overlapping attribution and exact drilldown subsets", () => {
  const { bootstrap, base } = setup();
  bootstrap.tasks = [{ ...base, id: "shared", ownerId: "alex", assigneeIds: ["alex", "lee", "lee"] }];
  const items = buildAttentionQueue({ bootstrap, activePersonFilter: [], today, includeAllUnfinishedTasks: true });
  const risk = { ...items[0], key: "risk:solo", recordId: "solo", source: "risk" as const,
    action: "open-risk" as const, ownerMemberId: "risk-owner", affectedTaskIds: [] };
  const groups = buildHomePressureGroups([...items, items[0], risk], "individual", bootstrap);
  const model = buildHomeWorkloadModel({ tasks: [...bootstrap.tasks, bootstrap.tasks[0]], groups });
  expect(model.taskCount).toBe(1);
  expect(model.risks.map(item => item.recordId)).toEqual(["solo"]);
  expect(model.hasSharedAssignments).toBe(true);
  expect(model.rows.map(row => [row.id, row.tasks.length, row.risks.length])).toEqual([
    ["individual:alex", 1, 0], ["individual:lee", 1, 0], ["individual:risk-owner", 0, 1],
  ]);
});

it("limits task totals and row subsets to supplied scoped task identities", () => {
  const { bootstrap, base } = setup();
  bootstrap.tasks = [{ ...base, id: "selected" }, { ...base, id: "outside" }];
  const items = buildAttentionQueue({ bootstrap, activePersonFilter: [], today, includeAllUnfinishedTasks: true });
  const groups = buildHomePressureGroups(items, "project", bootstrap);
  const model = buildHomeWorkloadModel({ tasks: [bootstrap.tasks[0]], groups });
  expect(model.taskCount).toBe(1);
  expect(model.rows[0].tasks.map(task => task.id)).toEqual(["selected"]);
  expect(model.hasSharedAssignments).toBe(false);
});

it("deduplicates records within groups and global attention totals across groups", () => {
  const { bootstrap, base } = setup();
  bootstrap.tasks = [{ ...base, id: "shared", ownerId: "alex", assigneeIds: ["lee"], isBlocked: true }];
  const items = buildAttentionQueue({ bootstrap, activePersonFilter: [], today, includeAllUnfinishedTasks: true });
  const groups = buildHomePressureGroups(items, "individual", bootstrap);
  groups.forEach(group => group.items.push(...group.items));
  const model = buildHomeWorkloadModel({ tasks: bootstrap.tasks, groups });
  expect(model.attentionCount).toBe(1);
  expect(model.rows.every(row => row.tasksByState.attention.length === 1)).toBe(true);
  expect(buildHomeWorkloadModel({ tasks: [], groups: [] })).toEqual({ rows: [], taskCount: 0, attentionCount: 0, risks: [], hasSharedAssignments: false });
});
