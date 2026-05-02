// @ts-nocheck
import { useCallback } from "react";

import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { TaskRecord } from "@/types";

export type AppWorkspaceTaskModalActions = ReturnType<typeof useAppWorkspaceTaskModalActions>;

export function useAppWorkspaceTaskModalActions(model: AppWorkspaceModel) {
  const openCreateTaskModal = useCallback(() => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setActiveTimelineTaskDetailId(null);
    model.setActiveTaskId(null);
    model.setTaskDraft(buildEmptyTaskPayload(model.scopedBootstrap));
    model.setTaskModalMode("create");
  }, [model]);

  const openCreateTaskModalFromTimeline = useCallback(() => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    model.setShowTimelineCreateToggleInTaskModal(true);
    model.setActiveTimelineTaskDetailId(null);
    model.setActiveTaskId(null);
    model.setTaskDraft(buildEmptyTaskPayload(model.scopedBootstrap));
    model.setTaskModalMode("create");
  }, [model]);

  const openEditTaskModal = useCallback((task: TaskRecord) => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setActiveTimelineTaskDetailId(null);
    model.setActiveTaskId(task.id);
    model.setTaskDraft(taskToPayload(task, model.scopedBootstrap));
    model.setTaskModalMode("edit");
  }, [model]);

  const openTimelineTaskDetailsModal = useCallback((task: TaskRecord) => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setActiveTimelineTaskDetailId(task.id);
  }, [model]);

  const closeTimelineTaskDetailsModal = useCallback(() => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    model.setActiveTimelineTaskDetailId(null);
  }, [model]);

  const closeTaskModal = useCallback(() => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setTaskModalMode(null);
    model.setActiveTaskId(null);
  }, [model]);

  const switchTaskCreateToMilestone = useCallback(() => {
    model.suppressNextAutoWorkspaceLoadRef.current = true;
    closeTaskModal();
    model.setTimelineMilestoneCreateSignal((current) => current + 1);
  }, [closeTaskModal, model]);

  return {
    closeTaskModal,
    closeTimelineTaskDetailsModal,
    openCreateTaskModal,
    openCreateTaskModalFromTimeline,
    openEditTaskModal,
    openTimelineTaskDetailsModal,
    switchTaskCreateToMilestone,
  };
}
