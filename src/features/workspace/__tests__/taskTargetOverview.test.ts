import { createBootstrap, createSubsystem } from "@/lib/appUtilsTestFixtures";
import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets";
import { useTaskDetailsOverviewModel } from "../modals/task/details/overview/useTaskDetailsOverviewModel";

it("keeps record IDs in the selector and distinguishes subsystem revisions by label", () => {
  const bootstrap = createBootstrap();
  bootstrap.subsystems.push(createSubsystem({ id: "drive-v2", name: "Drive", iteration: 2 }));
  let draft = buildEmptyTaskPayload(bootstrap);
  const setEditingField = jest.fn();
  const model = useTaskDetailsOverviewModel({
    activeTask: bootstrap.tasks[0],
    bootstrap,
    taskDraft: draft,
    setTaskDraft: (next) => { draft = typeof next === "function" ? next(draft) : next; },
    setEditingField,
  });

  expect(model.primaryTargetOptions).toContainEqual({ id: model.selectedPrimaryTargetId, name: "Drive (v1)" });
  expect(model.primaryTargetOptions).toContainEqual({ id: "drive-v2", name: "Drive (v2)" });
  model.handleSubsystemChange(["drive-v2"]);
  expect(draft.subsystemIds).toEqual(["drive-v2"]);
  expect(draft.subsystemId).toBe("drive-v2");
  expect(setEditingField).toHaveBeenCalledWith(null);
});
