import { useCallback } from "react";
import { useAppWorkspaceTaskSubmissionActions } from "../useAppWorkspaceTaskSubmissionActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets/payloadDefaults";
import { createTask, updateTaskRecord } from "@/lib/auth/records/task";
import { createTaskDependencyRecord, createTaskBlockerRecord } from "@/lib/auth/records/taskRelations";
jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback) }));
jest.mock("@/lib/auth/records/task", () => ({ createTask: jest.fn(), updateTaskRecord: jest.fn() }));
jest.mock("@/lib/auth/records/taskRelations", () => ({ createTaskDependencyRecord: jest.fn(), updateTaskDependencyRecord: jest.fn(), deleteTaskDependencyRecord: jest.fn(), createTaskBlockerRecord: jest.fn(), updateTaskBlockerRecord: jest.fn(), deleteTaskBlockerRecord: jest.fn() }));
it("retries the saved task and acknowledged dependency after a later blocker write fails", async () => {
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  const bootstrap = createBootstrap();
  const model = { bootstrap, scopedBootstrap: bootstrap, taskModalMode: "create", activeTaskId: null,
    taskDraft: { ...buildEmptyTaskPayload(bootstrap), title: "Retry task", summary: "Retain writes", taskDependencies: [{ kind: "task", refId: bootstrap.tasks[0].id, requiredState: "complete", dependencyType: "hard" }], taskBlockers: [{ blockerType: "external", blockerId: null, description: "Delivery", severity: "medium", status: "open" }] },
    setIsSavingTask: jest.fn(), setDataMessage: jest.fn(), handleUnauthorized: jest.fn(), loadWorkspace: jest.fn(async () => {}), enqueueTaskEditNotice: jest.fn(),
  } as unknown as AppWorkspaceModel;
  model.setTaskDraft = (next) => { model.taskDraft = typeof next === "function" ? next(model.taskDraft) : next; };
  model.setBootstrap = (next) => { model.bootstrap = typeof next === "function" ? next(model.bootstrap) : next; };
  model.setTaskModalMode = (next) => { model.taskModalMode = typeof next === "function" ? next(model.taskModalMode) : next; };
  model.setActiveTaskId = (next) => { model.activeTaskId = typeof next === "function" ? next(model.activeTaskId) : next; };
  const saved = { ...bootstrap.tasks[0], id: "new-task" };
  jest.mocked(createTask).mockResolvedValue(saved);
  jest.mocked(updateTaskRecord).mockResolvedValue(saved);
  jest.mocked(createTaskDependencyRecord).mockImplementation(async (payload) => ({ ...payload, id: "saved-edge", createdAt: "2026-09-08" }));
  jest.mocked(createTaskBlockerRecord).mockRejectedValueOnce(new Error("blocker unavailable"));
  jest.mocked(createTaskBlockerRecord).mockImplementationOnce(async (payload) => ({ ...payload, id: "saved-blocker", createdAt: "2026-09-08" } as never));
  const close = jest.fn();
  const useSubmit = () => useAppWorkspaceTaskSubmissionActions(model, close).handleTaskSubmit;
  const event = { preventDefault: jest.fn() } as never;
  await useSubmit()(event);
  expect(close).not.toHaveBeenCalled();
  expect(model.activeTaskId).toBe("new-task");
  expect(model.taskDraft.taskDependencies?.[0].id).toBe("saved-edge");
  await useSubmit()(event);
  expect(createTask).toHaveBeenCalledTimes(1);
  expect(updateTaskRecord).toHaveBeenCalledTimes(1);
  expect(createTaskDependencyRecord).toHaveBeenCalledTimes(1);
  expect(createTaskBlockerRecord).toHaveBeenCalledTimes(2);
  expect(close).toHaveBeenCalledTimes(1);
});
