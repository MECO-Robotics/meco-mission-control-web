import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { bootstrap as seed } from "@/features/workspace/shared/__tests__/taskPlanningFixture";
import type { TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import { buildHomeDependencyModel } from "../homeDependencyModel";
import { HomeDependencyTree } from "../HomeDependencyTree";

const task = (id: string, status: TaskRecord["status"] = "not-started"): TaskRecord => ({ ...seed.tasks[0], id, title: id, status });
const link = (taskId: string, refId: string, extra: Partial<TaskDependencyRecord> = {}): TaskDependencyRecord => ({
  id: `${taskId}:${refId}`, taskId, refId, kind: "task", dependencyType: "hard", createdAt: "2026-10-20", ...extra,
});

it("uses hard unsatisfied task, milestone and part conditions while retaining missing prerequisites", () => {
  const waiting = task("waiting");
  const bootstrap = { ...seed, tasks: [waiting, task("upstream"), task("done", "complete"), task("finished", "complete")],
    milestones: [{ ...seed.milestones[0], readinessStatus: "not-ready" as const }],
    partInstances: [{ ...seed.partInstances[0], readinessStatus: "not-ready" as const }],
    taskDependencies: [link("waiting", "upstream"), link("waiting", "done"), link("waiting", "soft", { dependencyType: "soft" }),
      link("waiting", "missing"), link("finished", "upstream"),
      link("waiting", seed.milestones[0].id, { kind: "milestone", requiredState: "ready" }),
      link("waiting", seed.partInstances[0].id, { kind: "part-instance", requiredCondition: { kind: "derived-readiness", value: "ready" } })],
  };
  const model = buildHomeDependencyModel([waiting, bootstrap.tasks[3]], bootstrap);
  expect(model.branches.map(branch => branch.key).sort()).toEqual([
    `milestone:${seed.milestones[0].id}`, `part-instance:${seed.partInstances[0].id}`, "task:missing", "task:upstream",
  ].sort());
  expect(model.waitingTaskCount).toBe(1);
  expect(model.branches.find(branch => branch.key === "task:missing")).toMatchObject({ available: false, waitingTaskIds: ["waiting"] });
});

it("deduplicates shared branches and scopes dependents while showing prerequisite context", () => {
  const tasks = [task("alice"), task("bob"), task("outside"), task("prerequisite")];
  const bootstrap = { ...seed, tasks, taskDependencies: [link("alice", "prerequisite"),
    link("alice", "prerequisite", { id: "different-requirement", requiredState: "in-progress" }), link("bob", "prerequisite"), link("outside", "different")] };
  const model = buildHomeDependencyModel(tasks.slice(0, 2), bootstrap);
  expect(model.branches).toHaveLength(1);
  expect(model.branches[0]).toMatchObject({ outsideScope: true, waitingTaskIds: ["alice", "bob"] });
  expect(model.branches[0].dependencies).toHaveLength(3);
  expect(model.waitingTaskCount).toBe(2);
});

it("terminates on self cycles and upstream cycles outside the selected task scope", () => {
  const tasks = [task("waiting"), task("first"), task("second"), task("self")];
  const bootstrap = { ...seed, tasks, taskDependencies: [link("waiting", "first"), link("first", "second"), link("second", "first"), link("self", "self")] };
  const model = buildHomeDependencyModel([tasks[0], tasks[3]], bootstrap);
  expect(model.hasCycle).toBe(true);
  expect(model.branches.every(branch => branch.hasCycle)).toBe(true);
  expect(model.branches.find(branch => branch.key === "task:first")?.outsideScope).toBe(true);
});

it("keeps every branch reachable beyond the finite preview and avoids dead missing-record buttons in details", () => {
  const waiting = task("waiting");
  const bootstrap = { ...seed, tasks: [waiting], taskDependencies: Array.from({ length: 5 }, (_, index) => link("waiting", `missing-${index}`)) };
  const model = buildHomeDependencyModel([waiting], bootstrap);
  const props = { model, bootstrap, onSelect: jest.fn(), onShowAll: jest.fn(), onOpenTask: jest.fn(), onOpenSchedule: jest.fn() };
  const preview = renderToStaticMarkup(createElement(HomeDependencyTree, props));
  expect(preview).toContain("Review all 5 prerequisites");
  const expanded = renderToStaticMarkup(createElement(HomeDependencyTree, { ...props, expanded: true }));
  expect(expanded).toContain("missing-4");
  expect(expanded).not.toMatch(/<button[^>]*home-dependency-root/);
});
