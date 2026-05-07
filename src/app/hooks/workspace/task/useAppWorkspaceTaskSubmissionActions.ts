import { useCallback } from "react";

import { toErrorMessage } from "@/lib/appUtils/common";
import { createTask, updateTaskRecord } from "@/lib/auth/records/task";
import {
  createTaskBlockerRecord,
  createTaskDependencyRecord,
  deleteTaskBlockerRecord,
  deleteTaskDependencyRecord,
  updateTaskBlockerRecord,
  updateTaskDependencyRecord,
} from "@/lib/auth/records/taskRelations";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import {
  normalizeTaskPayload,
} from "@/features/workspace/tasks/domain/taskPayloadNormalization";
import {
  syncTaskBlockers,
  syncTaskDependencies,
  type TaskRelationPersistence,
} from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskBlockerRecord, TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import { buildTaskEditSuccessNotice } from "@/features/workspace/workspaceEditToastNotice";

export type AppWorkspaceTaskSubmissionActions = ReturnType<typeof useAppWorkspaceTaskSubmissionActions>;

const TASK_RELATION_PERSISTENCE: TaskRelationPersistence = {
  createTaskDependencyRecord,
  updateTaskDependencyRecord,
  deleteTaskDependencyRecord,
  createTaskBlockerRecord,
  updateTaskBlockerRecord,
  deleteTaskBlockerRecord,
};

export function useAppWorkspaceTaskSubmissionActions(
  model: AppWorkspaceModel,
  closeTaskModal: () => void,
) {
  const handleTaskSubmit = useCallback(
    async (milestone: React.FormEvent<HTMLFormElement>) => {
      milestone.preventDefault();
      model.setIsSavingTask(true);
      model.setDataMessage(null);

      try {
        const payload = normalizeTaskPayload(model.taskDraft);
        const isEdit = model.taskModalMode === "edit";
        let savedTask: TaskRecord;

        if (model.taskModalMode === "create") {
          savedTask = await createTask(payload, model.handleUnauthorized);
        } else if (model.taskModalMode === "edit" && model.activeTaskId) {
          savedTask = await updateTaskRecord(model.activeTaskId, payload, model.handleUnauthorized);
        } else {
          savedTask = await createTask(payload, model.handleUnauthorized);
        }

        await syncTaskDependencies({
          taskId: savedTask.id,
          desiredDependencies: model.taskDraft.taskDependencies,
          existingDependencies: (model.scopedBootstrap.taskDependencies ?? []).filter(
            (dependency): dependency is TaskDependencyRecord => dependency.taskId === savedTask.id,
          ),
          handleUnauthorized: model.handleUnauthorized,
        }, TASK_RELATION_PERSISTENCE);
        await syncTaskBlockers({
          taskId: savedTask.id,
          desiredBlockers: model.taskDraft.taskBlockers,
          existingBlockers: (model.scopedBootstrap.taskBlockers ?? []).filter(
            (blocker): blocker is TaskBlockerRecord => blocker.blockedTaskId === savedTask.id,
          ),
          handleUnauthorized: model.handleUnauthorized,
        }, TASK_RELATION_PERSISTENCE);
        await model.loadWorkspace();
        if (isEdit) {
          model.enqueueTaskEditNotice(buildTaskEditSuccessNotice());
        }
        closeTaskModal();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingTask(false);
      }
    },
    [closeTaskModal, model],
  );

  return {
    handleTaskSubmit,
  };
}
