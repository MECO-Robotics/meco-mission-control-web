import { useCallback, useState, useRef } from "react";
import { useTaskEditor } from "../useTaskEditor";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { createTask, updateTaskRecord } from "@/lib/auth/records/task";
import * as relations from "@/lib/auth/records/taskRelations";
import { beginSessionChange } from "@/lib/auth/core/sessionStorage";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useRef: jest.fn(), useEffect: jest.fn(), useCallback: jest.fn() }));
jest.mock("@/lib/auth/records/task");
jest.mock("@/lib/auth/records/taskRelations");
jest.mock("@/lib/auth/records/reporting");

// Command tests retain state between calls; real React lifecycle behavior is
// exercised separately in the browser, including scope effects and cleanup.
function setup() {
  const slots: unknown[] = [];
  let cursor = 0;
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
  });
  jest.mocked(useRef).mockImplementation((initial) => (slots[cursor++] ??= { current: initial }) as ReturnType<typeof useRef>);
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  const bootstrap = createBootstrap();
  const dependencies: Parameters<typeof useTaskEditor>[0] = {
    bootstrap, scopedBootstrap: bootstrap, selectedProjectId: null, selectedSeasonId: null,
    setBootstrap: (next) => {
      dependencies.bootstrap = typeof next === "function" ? next(dependencies.bootstrap) : next;
      dependencies.scopedBootstrap = dependencies.bootstrap;
    },
    setDataMessage: jest.fn(), handleUnauthorized: jest.fn(), loadWorkspace: jest.fn(async () => {}), enqueueTaskEditNotice: jest.fn(),
  };
  const Render = () => { cursor = 0; return useTaskEditor(dependencies); };
  const saved = { ...bootstrap.tasks[0], id: "new-task" };
  jest.mocked(createTask).mockResolvedValue(saved);
  jest.mocked(updateTaskRecord).mockResolvedValue(saved);
  jest.mocked(relations.createTaskDependencyRecord).mockImplementation(async (payload) => ({ ...payload, id: "saved-edge", createdAt: "2026-09-08" }));
  Render().openCreateTaskModal();
  Render().setTaskDraft((draft) => ({
  ...draft, title: "Retry task", summary: "Retain writes", taskDependencies: [{ id: "draft-edge", kind: "task", refId: bootstrap.tasks[0].id, requiredState: "complete", dependencyType: "hard" }] }));
  return { render: Render, dependencies, saved };
}
const event = { preventDefault: jest.fn() } as never;
beforeEach(() => jest.resetAllMocks());

it("retries dependency creation after the Task write has succeeded", async () => {
  const { render } = setup();
  jest.mocked(relations.createTaskDependencyRecord).mockRejectedValueOnce(new Error("dependency unavailable"));
  let finishCreate!: () => void;
  const saved = { ...createBootstrap().tasks[0], id: "new-task" };
  jest.mocked(createTask).mockImplementationOnce(() => new Promise((resolve) => { finishCreate = () => resolve(saved); }));
  const pending = render().handleTaskSubmit(event);
  await render().handleTaskSubmit(event);
  expect(createTask).toHaveBeenCalledTimes(1);
  finishCreate();
  await pending;
  expect(render().activeTaskId).toBe("new-task");
  expect(render().taskModalMode).toBe("edit");
  expect(render().taskDraft.title).toBe("Retry task");
  await render().handleTaskSubmit(event);
  expect(createTask).toHaveBeenCalledTimes(1);
  expect(updateTaskRecord).toHaveBeenCalledTimes(1);
  expect(relations.createTaskDependencyRecord).toHaveBeenCalledTimes(2);
  expect(render().taskModalMode).toBeNull();
});

it("does nothing when submitted after closing", async () => {
  const { render } = setup();
  render().closeTaskModal();
  await render().handleTaskSubmit(event);
  expect(createTask).not.toHaveBeenCalled();
});

it.each([false, true])("does not alter a newer draft when an older save completes (reject=%s)", async (reject) => {
  const { render, dependencies, saved } = setup();
  let complete!: () => void;
  jest.mocked(createTask).mockImplementationOnce(() => new Promise((resolve, fail) => { complete = () => reject ? fail(new Error("old error")) : resolve(saved); }));
  const pending = render().handleTaskSubmit(event);
  render().closeTaskModal();
  render().openCreateTaskModalForMember("new-member");
  render().setTaskDraft((draft) => ({
  ...draft, title: "New draft" }));
  complete(); await pending;
  expect(render().taskModalMode).toBe("create");
  expect(render().activeTaskId).toBeNull();
  expect(render().taskDraft.title).toBe("New draft");
  expect(render().taskDraft.assigneeIds).toEqual(["new-member"]);
  expect(render().isSavingTask).toBe(false);
  expect(dependencies.setDataMessage).not.toHaveBeenCalledWith("old error");
  expect(dependencies.loadWorkspace).toHaveBeenCalledTimes(reject ? 0 : 1);
});

it.each(["task", "dependency"])("stops subsequent save stages after session changes during %s", async (stage) => {
  const { render, dependencies, saved } = setup();
  if (stage === "task") jest.mocked(createTask).mockImplementationOnce(async () => { beginSessionChange(); return saved; });
  if (stage === "dependency") jest.mocked(relations.createTaskDependencyRecord).mockImplementationOnce(async (payload) => { beginSessionChange(); return { ...payload, id: "saved-edge", createdAt: "today" }; });
  await render().handleTaskSubmit(event);
  if (stage === "task") expect(relations.createTaskDependencyRecord).not.toHaveBeenCalled();
  expect(dependencies.loadWorkspace).not.toHaveBeenCalled();
});

it("preserves create contexts, edit intent, and report return without stacking dialogs", () => {
  const { render, dependencies } = setup();
  render().openCreateTaskModalFromTimeline();
  expect(render().showTimelineCreateToggleInTaskModal).toBe(true);
  render().switchTaskCreateToMilestone();
  expect(render().taskModalMode).toBeNull();
  expect(render().timelineMilestoneCreateSignal).toBe(1);
  const task = dependencies.bootstrap.tasks[0];
  render().openEditTaskModal(task, { intentState: "blocked" });
  expect(render().taskDraft.taskDependencies).toEqual([]);
  const restore = render().leaveTaskDetails(task.id);
  expect(render().taskModalMode).toBeNull();
  restore();
  expect(render().activeTimelineTaskDetail?.id).toBe(task.id);
  const staleRestore = render().leaveTaskDetails(task.id);
  beginSessionChange(); staleRestore();
  expect(render().activeTimelineTaskDetailId).toBeNull();
});

it("does not restore an old report's task over a newer editor or details selection", () => {
  const { render, dependencies } = setup();
  const task = dependencies.bootstrap.tasks[0];
  const returnToOldTask = render().leaveTaskDetails(task.id);
  render().openCreateTaskModal();
  returnToOldTask();
  expect(render().taskModalMode).toBe("create");
  expect(render().activeTimelineTaskDetailId).toBeNull();
  const secondReturn = render().leaveTaskDetails(task.id);
  render().restoreTimelineTaskDetails("other-task");
  secondReturn();
  expect(render().activeTimelineTaskDetailId).toBe("other-task");
});
