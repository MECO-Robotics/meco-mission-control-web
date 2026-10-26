import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { TaskRecord } from "@/types/recordsExecution";
import { HomeYourTasks } from "../HomeYourTasks";
import { buildHomeYourTasks } from "../homeYourTasksModel";
import { buildHomeViewModel } from "../overviewViewModel";

function fixture() {
  const bootstrap = createBootstrap();
  const task = (id: string, overrides: Partial<TaskRecord> = {}): TaskRecord => ({ ...bootstrap.tasks[0],
    id, title: id, summary: "", ownerId: null, assigneeIds: [], mentorId: null, requestedById: null,
    status: "in-progress", priority: "medium", dueDate: "2026-10-22", ...overrides,
  });
  return { bootstrap, task };
}

it("selects only the signed-in member's unfinished owned or assigned work, deduplicating identities", () => {
  const { task } = fixture();
  const owned = task("owned", { ownerId: "self", assigneeIds: ["self", "self"] });
  const tasks = [owned, owned, task("assigned", { assigneeIds: ["self"] }),
    task("mentor-only", { mentorId: "self" }), task("requested-only", { requestedById: "self" }),
    task("other", { ownerId: "other" }), task("done", { ownerId: "self", status: "complete" })];
  expect(buildHomeYourTasks(tasks, "self").map(item => item.id)).toEqual(["assigned", "owned"]);
  expect(buildHomeYourTasks(tasks, null)).toEqual([]);
  expect(buildHomeYourTasks(tasks, "unlinked")).toEqual([]);
});

it("sorts by priority, valid due date, title and identity; invalid or missing dates come last within priority", () => {
  const { task } = fixture();
  const tasks = [
    task("low", { priority: "low", dueDate: "2020-01-01" }),
    task("missing", { priority: "critical", dueDate: "", title: "Z" }),
    task("invalid", { priority: "critical", dueDate: "2026-02-30", title: "A" }),
    task("late", { priority: "critical", dueDate: "2026-11-01" }),
    task("b", { priority: "critical", dueDate: "2026-10-21", title: "Same" }),
    task("a", { priority: "critical", dueDate: "2026-10-21", title: "Same" }),
    task("high", { priority: "high", dueDate: "2020-01-01" }),
    task("medium", { priority: "medium", dueDate: "2020-01-01" }),
  ].map(item => ({ ...item, ownerId: "self" }));
  expect(buildHomeYourTasks(tasks, "self").map(item => item.id)).toEqual(["a", "b", "late", "invalid", "missing", "high", "medium", "low"]);
  expect(tasks[0].id).toBe("low");
});

it("intersects dashboard project, search and person scope with the signed-in identity rather than impersonating another person", () => {
  const { bootstrap, task } = fixture();
  const projectId = bootstrap.projects[0].id;
  bootstrap.tasks = [task("match", { title: "Review shared", projectId, ownerId: "self", assigneeIds: ["other"] }),
    task("other-owner", { title: "Review other", projectId, ownerId: "other" }),
    task("different-project", { title: "Review elsewhere", projectId: "different", ownerId: "self", assigneeIds: ["other"] }),
    task("different-search", { title: "Build shared", projectId, ownerId: "self", assigneeIds: ["other"] }),
    task("different-person", { title: "Review solo", projectId, ownerId: "self" })];
  const scope = buildHomeViewModel({ bootstrap, projectId, search: "Review", activePersonFilter: ["other"] });
  expect(buildHomeYourTasks(scope.tasks, "self").map(item => item.id)).toEqual(["match"]);
});

it("distinguishes missing identity from empty assignments and renders invalid dates safely", () => {
  const { task } = fixture();
  const render = (signedInMemberId: string | null, tasks: TaskRecord[] = []) => renderToStaticMarkup(createElement(HomeYourTasks, { signedInMemberId, tasks, onOpenTask: jest.fn() }));
  expect(render(null)).toContain("Sign in with a linked member account to see your tasks.");
  expect(render("self")).toContain("No unfinished tasks in this scope.");
  const html = render("self", [task("bad", { dueDate: "2026-10-22-extra" }), task("good")]);
  expect(html).toContain("Due date unknown");
  expect(html).toContain('dateTime="2026-10-22"');
});
