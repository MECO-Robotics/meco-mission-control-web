import { useCallback } from "react";

import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils/taskTargets";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import type { TaskRecord } from "@/types/recordsExecution";

export type AppWorkspaceTaskModalActions = ReturnType<typeof useAppWorkspaceTaskModalActions>;

export function useAppWorkspaceTaskModalActions(model: AppWorkspaceModel) {
  const openCreateTaskModal = useCallback(() => {
    model.suppressNextAutoWorkspaceLoad();
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setActiveTimelineTaskDetailId(null);
    model.setActiveTaskId(null);
    model.setTaskDraft(buildEmptyTaskPayload(model.scopedBootstrap));
    model.setTaskModalMode("create");
  }, [model]);

  const openCreateTaskModalFromTimeline = useCallback(() => {
    model.suppressNextAutoWorkspaceLoad();
    model.setShowTimelineCreateToggleInTaskModal(true);
    model.setActiveTimelineTaskDetailId(null);
    model.setActiveTaskId(null);
    model.setTaskDraft(buildEmptyTaskPayload(model.scopedBootstrap));
    model.setTaskModalMode("create");
  }, [model]);

  const openEditTaskModal = useCallback((task: TaskRecord) => {
    model.suppressNextAutoWorkspaceLoad();
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setActiveTimelineTaskDetailId(null);
    model.setActiveTaskId(task.id);
    model.setTaskDraft(taskToPayload(task, model.scopedBootstrap));
    model.setTaskModalMode("edit");
  }, [model]);

  const openTimelineTaskDetailsModal = useCallback((task: TaskRecord) => {
    model.suppressNextAutoWorkspaceLoad();
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setActiveTimelineTaskDetailId(task.id);
  }, [model]);

  const closeTimelineTaskDetailsModal = useCallback(() => {
    model.suppressNextAutoWorkspaceLoad();
    model.setActiveTimelineTaskDetailId(null);
  }, [model]);

  const closeTaskModal = useCallback(() => {
    model.suppressNextAutoWorkspaceLoad();
    model.setShowTimelineCreateToggleInTaskModal(false);
    model.setTaskModalMode(null);
    model.setActiveTaskId(null);
  }, [model]);

  const switchTaskCreateToMilestone = useCallback(() => {
    model.suppressNextAutoWorkspaceLoad();
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
