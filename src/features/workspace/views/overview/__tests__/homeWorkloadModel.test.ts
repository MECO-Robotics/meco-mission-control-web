import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { TaskRecord } from "@/types/recordsExecution";
import { buildHomeWorkloadModel } from "../homeWorkloadModel";

function setup() {
  const bootstrap = createBootstrap();
  bootstrap.risks = [];
  bootstrap.taskDependencies = [];
  const task = (id: string, overrides: Partial<TaskRecord> = {}): TaskRecord => ({
    ...bootstrap.tasks[0], id, status: "in-progress", ownerId: null, assigneeIds: [],
    responsibleGroupId: null, mentorId: null, requestedById: null, isBlocked: false, ...overrides,
  });
  return { bootstrap, task };
}

it("uses explicit teams, retaining archived and unavailable teams without membership inference", () => {
  const { bootstrap, task } = setup();
  bootstrap.responsibleGroups = [{ id: "old", name: "Archived crew", seasonId: "season-2026", projectIds: [], workTypeIds: [], memberIds: ["person"], primaryMemberIds: [], isArchived: true }];
  const tasks = [task("a", { responsibleGroupId: "old" }), task("b", { responsibleGroupId: "missing" }), task("c", { ownerId: "person" }), task("done", { status: "complete" })];
  const model = buildHomeWorkloadModel({ tasks, bootstrap, mode: "team" });
  expect(model.taskCount).toBe(3);
  expect(model.hasSharedAssignments).toBe(false);
  expect(model.rows.map(row => [row.id, row.label, row.tasks.map(item => item.id)])).toEqual([
    ["team:old", "Archived crew", ["a"]],
    ["unassigned:team", "Unassigned", ["c"]],
    ["team:missing", "Unavailable team · missing", ["b"]],
  ]);
});

it("attributes individuals to unique owners and assignees, excluding mentors and requesters", () => {
  const { bootstrap, task } = setup();
  bootstrap.members = [{ ...bootstrap.members[0], id: "alex", name: "Alex" }];
  const tasks = [task("shared", { ownerId: "alex", assigneeIds: ["alex", "missing", "missing"], mentorId: "mentor", requestedById: "requester" }), task("none", { mentorId: "mentor" })];
  const model = buildHomeWorkloadModel({ tasks, bootstrap, mode: "individual" });
  expect(model.taskCount).toBe(2);
  expect(model.hasSharedAssignments).toBe(true);
  expect(model.rows.map(row => [row.id, row.label, row.tasks.length])).toEqual([
    ["person:alex", "Alex", 1], ["unassigned:individual", "Unassigned", 1], ["person:missing", "Unavailable person · missing", 1],
  ]);
});

it("uses only supplied scoped tasks, counts each task identity once, and orders by workload", () => {
  const { bootstrap, task } = setup();
  const first = task("first", { ownerId: "z" });
  const second = task("second", { ownerId: "z" });
  bootstrap.tasks = [first, second, task("outside", { ownerId: "a" })];
  const model = buildHomeWorkloadModel({ tasks: [first, first, second, task("third", { ownerId: "a" })], bootstrap, mode: "individual" });
  expect(model.taskCount).toBe(3);
  expect(model.rows.map(row => [row.id, row.tasks.map(item => item.id)])).toEqual([
    ["person:z", ["first", "second"]], ["person:a", ["third"]],
  ]);
});

it("gives explicit blockers precedence over dependencies, then uses actual task status", () => {
  const { bootstrap, task } = setup();
  const tasks = [task("blocked", { isBlocked: true, status: "waiting-for-qa" }), task("dependency", { status: "waiting-for-qa" }), task("qa", { status: "waiting-for-qa" }), task("started"), task("new", { status: "not-started" })];
  bootstrap.tasks = tasks;
  bootstrap.taskDependencies = ["blocked", "dependency"].map(taskId => ({ id: taskId, taskId, kind: "task", refId: "unavailable", dependencyType: "hard", createdAt: "2026-10-19" }));
  const row = buildHomeWorkloadModel({ tasks, bootstrap, mode: "team" }).rows[0];
  expect(Object.fromEntries(Object.entries(row.tasksByState).map(([state, items]) => [state, items.map(item => item.id)]))).toEqual({
    blocked: ["blocked"], "waiting-on-dependency": ["dependency"], "waiting-for-qa": ["qa"], "in-progress": ["started"], "not-started": ["new"],
  });
});

it("returns an empty model when scoped tasks are empty or complete", () => {
  const { bootstrap, task } = setup();
  expect(buildHomeWorkloadModel({ tasks: [task("done", { status: "complete" })], bootstrap, mode: "team" })).toEqual({ rows: [], taskCount: 0, hasSharedAssignments: false });
});
