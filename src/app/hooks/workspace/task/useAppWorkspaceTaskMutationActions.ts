import { useCallback } from "react";

import { toErrorMessage } from "@/lib/appUtils/common";
import { createMilestoneRecord, deleteMilestoneRecord, updateMilestoneRecord } from "@/lib/auth/records/event";
import { deleteTaskRecord } from "@/lib/auth/records/task";
import { updateTaskBlockerRecord } from "@/lib/auth/records/taskRelations";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { MilestonePayload } from "@/types/payloads";

export type AppWorkspaceTaskMutationActions = ReturnType<typeof useAppWorkspaceTaskMutationActions>;

export function useAppWorkspaceTaskMutationActions(
  model: AppWorkspaceModel,
  closeTaskModal: () => void,
) {
  const handleTimelineMilestoneSave = useCallback(
    async (mode: "create" | "edit", milestoneId: string | null, payload: MilestonePayload) => {
      if (mode === "create") {
        await createMilestoneRecord(payload, model.handleUnauthorized);
      } else if (milestoneId) {
        await updateMilestoneRecord(milestoneId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
    },
    [model],
  );

  const handleTimelineMilestoneDelete = useCallback(
    async (milestoneId: string) => {
      await deleteMilestoneRecord(milestoneId, model.handleUnauthorized);
      await model.loadWorkspace();
    },
    [model],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      model.setIsDeletingTask(true);
      model.setDataMessage(null);

      try {
        await deleteTaskRecord(taskId, model.handleUnauthorized);
        if (model.activeTaskId === taskId) {
          closeTaskModal();
        }
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsDeletingTask(false);
      }
    },
    [closeTaskModal, model],
  );

  const handleResolveTaskBlocker = useCallback(
    async (blockerId: string) => {
      model.setDataMessage(null);

      try {
        await updateTaskBlockerRecord(blockerId, { status: "resolved" }, model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      }
    },
    [model],
  );

  return {
    handleDeleteTask,
    handleResolveTaskBlocker,
    handleTimelineMilestoneDelete,
    handleTimelineMilestoneSave,
  };
}
