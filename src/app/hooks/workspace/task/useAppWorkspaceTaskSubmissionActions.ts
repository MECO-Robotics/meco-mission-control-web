import { updateRiskRecord } from "@/lib/auth/records/reporting";
import { useCallback, useRef } from "react";

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
  const saveInFlight = useRef(false);
  const handleTaskSubmit = useCallback(
    async (milestone: React.FormEvent<HTMLFormElement>) => {
      milestone.preventDefault();
      if (saveInFlight.current) return;
      saveInFlight.current = true;
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

        model.setBootstrap((current) => ({ ...current, tasks: [...current.tasks.filter((task) => task.id !== savedTask.id), savedTask] }));
        model.setActiveTaskId(savedTask.id);
        model.setTaskModalMode("edit");

        await syncTaskDependencies({
          taskId: savedTask.id,
          desiredDependencies: model.taskDraft.taskDependencies,
          existingDependencies: (model.bootstrap.taskDependencies ?? []).filter(
            (dependency): dependency is TaskDependencyRecord => dependency.taskId === savedTask.id,
          ),
          handleUnauthorized: model.handleUnauthorized,
          onPersisted: (draft, record) => {
            model.setTaskDraft((current) => ({ ...current, taskDependencies: current.taskDependencies?.map((item) => item === draft || (draft.id && item.id === draft.id) ? { ...item, id: record.id } : item) }));
            model.setBootstrap((current) => ({ ...current, taskDependencies: [...(current.taskDependencies ?? []).filter((item) => item.id !== record.id), record] }));
          },
          onDeleted: (id) => model.setBootstrap((current) => ({ ...current, taskDependencies: (current.taskDependencies ?? []).filter((item) => item.id !== id) })),
        }, TASK_RELATION_PERSISTENCE);
        await syncTaskBlockers({
          taskId: savedTask.id,
          desiredBlockers: model.taskDraft.taskBlockers,
          existingBlockers: (model.bootstrap.taskBlockers ?? []).filter(
            (blocker): blocker is TaskBlockerRecord => blocker.blockedTaskId === savedTask.id,
          ),
          handleUnauthorized: model.handleUnauthorized,
          onPersisted: (draft, record) => {
            model.setTaskDraft((current) => ({ ...current, taskBlockers: current.taskBlockers?.map((item) => item === draft || (draft.id && item.id === draft.id) ? { ...item, id: record.id } : item) }));
            model.setBootstrap((current) => ({ ...current, taskBlockers: [...(current.taskBlockers ?? []).filter((item) => item.id !== record.id), record] }));
          },
          onDeleted: (id) => model.setBootstrap((current) => ({ ...current, taskBlockers: (current.taskBlockers ?? []).filter((item) => item.id !== id) })),
        }, TASK_RELATION_PERSISTENCE);
        const previousRisk = model.scopedBootstrap.risks.find((risk) => risk.mitigationTaskId === savedTask.id);
        const nextRiskId = model.taskDraft.targetRiskId ?? null;
        if (previousRisk?.id !== nextRiskId) {
          if (previousRisk) await updateRiskRecord(previousRisk.id, { mitigationTaskId: null }, model.handleUnauthorized);
          if (nextRiskId) await updateRiskRecord(nextRiskId, { mitigationTaskId: savedTask.id }, model.handleUnauthorized);
        }
        await model.loadWorkspace();
        if (isEdit) {
          model.enqueueTaskEditNotice(buildTaskEditSuccessNotice());
        }
        closeTaskModal();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        saveInFlight.current = false;
        model.setIsSavingTask(false);
      }
    },
    [closeTaskModal, model],
  );

  return {
    handleTaskSubmit,
  };
}
