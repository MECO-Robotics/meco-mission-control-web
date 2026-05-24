import { useCallback } from "react";

import { toErrorMessage } from "@/lib/appUtils/common";
import { createMeetingRecord, createMilestoneRecord, deleteMilestoneRecord, updateMilestoneRecord } from "@/lib/auth/records/event";
import { deleteTaskRecord, updateTaskRecord } from "@/lib/auth/records/task";
import { updateTaskBlockerRecord } from "@/lib/auth/records/taskRelations";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskStatus } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";
import { buildTaskEditSuccessNotice } from "@/features/workspace/workspaceEditToastNotice";

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

  const handleMeetingSave = useCallback(
    async (payload: MeetingPayload) => {
      await createMeetingRecord(payload, model.handleUnauthorized);
      await model.loadWorkspace();
    },
    [model],
  );

  const handleTaskStatusChange = useCallback(
    async (task: TaskRecord, status: TaskStatus) => {
      if (task.status === status) {
        return;
      }

      model.setIsSavingTask(true);
      model.setDataMessage(null);
      try {
        await updateTaskRecord(task.id, { status }, model.handleUnauthorized);
        await model.loadWorkspace();
        model.enqueueTaskEditNotice(buildTaskEditSuccessNotice());
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingTask(false);
      }
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
    handleMeetingSave,
    handleTaskStatusChange,
    handleTimelineMilestoneDelete,
    handleTimelineMilestoneSave,
  };
}
