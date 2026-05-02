// @ts-nocheck
import { useCallback } from "react";

import { toErrorMessage } from "@/lib/appUtils";
import {
  createEventRecord,
  deleteEventRecord,
  deleteTaskRecord,
  updateEventRecord,
  updateTaskBlockerRecord,
} from "@/lib/auth";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { EventPayload } from "@/types";

export type AppWorkspaceTaskMutationActions = ReturnType<typeof useAppWorkspaceTaskMutationActions>;

export function useAppWorkspaceTaskMutationActions(
  model: AppWorkspaceModel,
  closeTaskModal: () => void,
) {
  const handleTimelineEventSave = useCallback(
    async (mode: "create" | "edit", eventId: string | null, payload: EventPayload) => {
      if (mode === "create") {
        await createEventRecord(payload, model.handleUnauthorized);
      } else if (eventId) {
        await updateEventRecord(eventId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
    },
    [model],
  );

  const handleTimelineEventDelete = useCallback(
    async (eventId: string) => {
      await deleteEventRecord(eventId, model.handleUnauthorized);
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
    handleTimelineEventDelete,
    handleTimelineEventSave,
  };
}
