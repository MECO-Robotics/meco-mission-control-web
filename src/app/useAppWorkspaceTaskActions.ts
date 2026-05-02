// @ts-nocheck
import { useCallback } from "react";

import { buildEmptyTaskPayload, taskToPayload, toErrorMessage } from "@/lib/appUtils";
import {
  createEventRecord,
  createTask,
  createTaskBlockerRecord,
  createTaskDependencyRecord,
  deleteEventRecord,
  deleteTaskBlockerRecord,
  deleteTaskDependencyRecord,
  deleteTaskRecord,
  updateEventRecord,
  updateTaskBlockerRecord,
  updateTaskDependencyRecord,
  updateTaskRecord,
} from "@/lib/auth";
import type {
  EventPayload,
  TaskBlockerPayload,
  TaskDependencyPayload,
  TaskBlockerSeverity,
  TaskBlockerType,
  TaskPayload,
  TaskRecord,
} from "@/types";
import type { AppWorkspaceModel } from "@/app/useAppWorkspaceModel";

export type AppWorkspaceTaskActions = ReturnType<typeof useAppWorkspaceTaskActions>;

export function useAppWorkspaceTaskActions(model: AppWorkspaceModel) {
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

  const handleTaskSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      model.setIsSavingTask(true);
      model.setDataMessage(null);

      try {
        const payload: TaskPayload = {
          ...model.taskDraft,
          title: model.taskDraft.title.trim(),
          summary: model.taskDraft.summary.trim(),
          assigneeIds: Array.from(new Set(model.taskDraft.assigneeIds)),
          taskDependencies: (model.taskDraft.taskDependencies ?? []).map((dependency) => ({
            ...dependency,
            refId: dependency.refId.trim(),
            requiredState: dependency.requiredState?.trim(),
          })),
          taskBlockers: (model.taskDraft.taskBlockers ?? []).map((blocker) => ({
            ...blocker,
            description: blocker.description.trim(),
          })),
        };

        const syncTaskDependencies = async (taskId: string) => {
          const desiredDependencies = model.taskDraft.taskDependencies ?? [];
          const existingDependencies = (model.scopedBootstrap.taskDependencies ?? []).filter(
            (dependency) => dependency.taskId === taskId,
          );
          const existingById = new Map(existingDependencies.map((dependency) => [dependency.id, dependency] as const));
          const desiredIds = new Set<string>();

          for (const dependency of desiredDependencies) {
            const payload: TaskDependencyPayload = {
              taskId,
              kind: dependency.kind,
              refId: dependency.refId.trim(),
              requiredState: dependency.requiredState?.trim(),
              dependencyType: dependency.dependencyType,
            };
            const existingDependency = dependency.id ? existingById.get(dependency.id) : null;

            if (existingDependency) {
              desiredIds.add(existingDependency.id);
              if (
                existingDependency.kind !== payload.kind ||
                existingDependency.refId !== payload.refId ||
                existingDependency.requiredState !== payload.requiredState ||
                existingDependency.dependencyType !== payload.dependencyType
              ) {
                await updateTaskDependencyRecord(existingDependency.id, payload, model.handleUnauthorized);
              }
            } else {
              const createdDependency = await createTaskDependencyRecord(payload, model.handleUnauthorized);
              desiredIds.add(createdDependency.id);
            }
          }

          for (const dependency of existingDependencies) {
            if (!desiredIds.has(dependency.id)) {
              await deleteTaskDependencyRecord(dependency.id, model.handleUnauthorized);
            }
          }
        };

        const syncTaskBlockers = async (taskId: string) => {
          const desiredBlockers = model.taskDraft.taskBlockers ?? [];
          const existingBlockers = (model.scopedBootstrap.taskBlockers ?? []).filter(
            (blocker) => blocker.blockedTaskId === taskId,
          );
          const existingById = new Map(existingBlockers.map((blocker) => [blocker.id, blocker] as const));
          const desiredIds = new Set<string>();

          for (const blocker of desiredBlockers) {
            const payload: TaskBlockerPayload = {
              blockedTaskId: taskId,
              blockerType: blocker.blockerType as TaskBlockerType,
              blockerId: blocker.blockerId ?? null,
              description: blocker.description.trim(),
              severity: blocker.severity as TaskBlockerSeverity,
              status: "open",
            };
            const existingBlocker = blocker.id ? existingById.get(blocker.id) : null;

            if (existingBlocker) {
              desiredIds.add(existingBlocker.id);
              if (
                existingBlocker.blockerType !== payload.blockerType ||
                existingBlocker.blockerId !== payload.blockerId ||
                existingBlocker.description !== payload.description ||
                existingBlocker.severity !== payload.severity ||
                existingBlocker.status !== payload.status
              ) {
                await updateTaskBlockerRecord(existingBlocker.id, payload, model.handleUnauthorized);
              }
            } else {
              const createdBlocker = await createTaskBlockerRecord(payload, model.handleUnauthorized);
              desiredIds.add(createdBlocker.id);
            }
          }

          for (const blocker of existingBlockers) {
            if (!desiredIds.has(blocker.id)) {
              await deleteTaskBlockerRecord(blocker.id, model.handleUnauthorized);
            }
          }
        };

        let savedTask: TaskRecord;
        if (model.taskModalMode === "create") {
          savedTask = await createTask(payload, model.handleUnauthorized);
        } else if (model.taskModalMode === "edit" && model.activeTaskId) {
          savedTask = await updateTaskRecord(model.activeTaskId, payload, model.handleUnauthorized);
        } else {
          savedTask = await createTask(payload, model.handleUnauthorized);
        }

        await syncTaskDependencies(savedTask.id);
        await syncTaskBlockers(savedTask.id);
        await model.loadWorkspace();
        closeTaskModal();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingTask(false);
      }
    },
    [closeTaskModal, model],
  );

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
    closeTaskModal,
    closeTimelineTaskDetailsModal,
    handleDeleteTask,
    handleResolveTaskBlocker,
    handleTaskSubmit,
    handleTimelineEventDelete,
    handleTimelineEventSave,
    openCreateTaskModal,
    openCreateTaskModalFromTimeline,
    openEditTaskModal,
    openTimelineTaskDetailsModal,
    switchTaskCreateToMilestone,
  };
}
