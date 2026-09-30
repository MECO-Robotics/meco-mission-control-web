import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { toErrorMessage } from "@/lib/appUtils/common";
import { createTask, updateTaskRecord, deleteTaskRecord } from "@/lib/auth/records/task";
import {
  createTaskDependencyRecord,
  deleteTaskDependencyRecord,
  updateTaskDependencyRecord,
} from "@/lib/auth/records/taskRelations";
import {
  normalizeTaskPayload,
} from "@/features/workspace/tasks/domain/taskPayloadNormalization";
import {
  syncTaskDependencies,
  type TaskRelationPersistence,
} from "@/features/workspace/tasks/services/taskRelationsSync";
import type { TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import { buildTaskEditSuccessNotice } from "@/features/workspace/workspaceEditToastNotice";

import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils/taskTargets";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { useCatalogEditorLifecycle } from "@/app/workspaceCatalog/useCatalogEditorLifecycle";
import { applyTaskEditIntentToDraft } from "./taskEditIntentDraft";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import type { TaskStatus } from "@/types/common";
import type { OpenEditTaskModalOptions } from "@/types/taskEditIntent";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import type { WorkspaceEditToastNotice } from "@/features/workspace/workspaceEditToastNotice";

const TASK_RELATION_PERSISTENCE: TaskRelationPersistence = {
  createTaskDependencyRecord,
  updateTaskDependencyRecord,
  deleteTaskDependencyRecord,
};

export function useTaskEditor({ bootstrap, scopedBootstrap, selectedProjectId, selectedSeasonId,
  setBootstrap, handleUnauthorized, loadWorkspace, setDataMessage, enqueueTaskEditNotice,
}: {
  bootstrap: BootstrapPayload;
  scopedBootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  setDataMessage: (message: string | null) => void;
  enqueueTaskEditNotice: (notice: WorkspaceEditToastNotice) => void;
}) {
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit" | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTimelineTaskDetailId, setActiveTimelineTaskDetailId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskPayload>(() => buildEmptyTaskPayload(EMPTY_BOOTSTRAP));
  const [showTimelineCreateToggleInTaskModal, setShowTimelineCreateToggleInTaskModal] = useState(false);
  const [timelineMilestoneCreateSignal, setTimelineMilestoneCreateSignal] = useState(0);
  const { beginOperation, captureWorkspace, captureEditor, resetEditor, isSaving: isSavingTask, isDeleting: isDeletingTask } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const activeTask = scopedBootstrap.tasks.find((task) => task.id === activeTaskId) ?? null;
  const activeTimelineTaskDetail = scopedBootstrap.tasks.find((task) => task.id === activeTimelineTaskDetailId) ?? null;

  const closeTaskModal = useCallback(() => {
    resetEditor();
    setTaskModalMode(null);
    setActiveTaskId(null);
    setShowTimelineCreateToggleInTaskModal(false);
  }, [resetEditor]);

  useEffect(() => closeTaskModal(), [closeTaskModal, selectedProjectId, selectedSeasonId]);
  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (taskModalMode === "edit" && !bootstrap.tasks.some((task) => task.id === activeTaskId))) closeTaskModal();
    if (activeTimelineTaskDetailId && !activeTimelineTaskDetail) setActiveTimelineTaskDetailId(null);
  }, [activeTaskId, activeTimelineTaskDetail, activeTimelineTaskDetailId, bootstrap, closeTaskModal, taskModalMode]);

  function openCreateTaskModal(options: { memberId?: string; fromTimeline?: boolean } = {}) {
    resetEditor();
    setActiveTimelineTaskDetailId(null);
    setActiveTaskId(null);
    const draft = buildEmptyTaskPayload(scopedBootstrap);
    setTaskDraft(options.memberId ? { ...draft, assigneeIds: [options.memberId], ownerId: options.memberId } : draft);
    setShowTimelineCreateToggleInTaskModal(options.fromTimeline ?? false);
    setTaskModalMode("create");
  }
  function openEditTaskModal(task: TaskRecord, options?: OpenEditTaskModalOptions) {
    resetEditor();
    setActiveTimelineTaskDetailId(null);
    setActiveTaskId(task.id);
    setTaskDraft(applyTaskEditIntentToDraft(taskToPayload(task, scopedBootstrap), options));
    setShowTimelineCreateToggleInTaskModal(false);
    setTaskModalMode("edit");
  }
  function restoreTimelineTaskDetails(taskId: string | null) {
    closeTaskModal();
    setActiveTimelineTaskDetailId(taskId);
  }
  function leaveTaskDetails(taskId?: string) {
    restoreTimelineTaskDetails(null);
    const editor = captureEditor();
    return () => { if (editor.isCurrent()) setActiveTimelineTaskDetailId(taskId ?? null); };
  }
  function switchTaskCreateToMilestone() {
    closeTaskModal();
    setTimelineMilestoneCreateSignal((current) => current + 1);
  }

  async function handleTaskSubmit(milestone: React.FormEvent<HTMLFormElement>) {
    milestone.preventDefault();
    if (!taskModalMode || (taskModalMode === "edit" && !activeTaskId)) return;
    const operation = beginOperation();
    if (!operation) return;
    const workspace = captureWorkspace();
    const publish = (update: (current: BootstrapPayload) => BootstrapPayload) =>
      setBootstrap((current) => workspace.isCurrent() ? update(current) : current);
    setDataMessage(null);

    try {
      const payload = normalizeTaskPayload(taskDraft);
      const isEdit = taskModalMode === "edit";
      let savedTask: TaskRecord;

      if (taskModalMode === "create") {
        savedTask = await createTask(payload, handleUnauthorized);
      } else if (taskModalMode === "edit" && activeTaskId) {
        savedTask = await updateTaskRecord(activeTaskId, payload, handleUnauthorized);
      } else {
        return;
      }
      if (!workspace.isCurrent()) return;

      publish((current) => ({ ...current, tasks: [...current.tasks.filter((task) => task.id !== savedTask.id), savedTask] }));
      if (operation.isCurrent()) {
        setActiveTaskId(savedTask.id);
        setTaskModalMode("edit");
      }

      if (!await syncTaskDependencies({
        taskId: savedTask.id,
        canPersist: workspace.isCurrent,
        desiredDependencies: taskDraft.taskDependencies,
        existingDependencies: (bootstrap.taskDependencies ?? []).filter(
          (dependency): dependency is TaskDependencyRecord => dependency.taskId === savedTask.id,
        ),
        handleUnauthorized,
        onPersisted: (draft, record) => {
          if (!workspace.isCurrent()) return;
          if (operation.isCurrent()) setTaskDraft((current) => operation.isCurrent() ? ({ ...current, taskDependencies: current.taskDependencies?.map((item) => item === draft || (draft.id && item.id === draft.id) ? { ...item, id: record.id } : item) }) : current);
          publish((current) => ({ ...current, taskDependencies: [...(current.taskDependencies ?? []).filter((item) => item.id !== record.id), record] }));
        },
        onDeleted: (id) => { if (workspace.isCurrent()) publish((current) => ({ ...current, taskDependencies: (current.taskDependencies ?? []).filter((item) => item.id !== id) })); },
      }, TASK_RELATION_PERSISTENCE)) return;
      if (!workspace.isCurrent()) return;
      await workspace.refresh();
      if (operation.isCurrent()) {
        if (isEdit) enqueueTaskEditNotice(buildTaskEditSuccessNotice());
        closeTaskModal();
      }
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }

  async function handleTaskStatusChange(task: TaskRecord, status: TaskStatus) {
    if (task.status === status) return;
    const workspace = captureWorkspace();
    setDataMessage(null);
    try {
      await updateTaskRecord(task.id, { status }, handleUnauthorized);
      await workspace.refresh();
      if (workspace.isCurrent()) enqueueTaskEditNotice(buildTaskEditSuccessNotice());
    } catch (error) {
      if (workspace.isCurrent()) setDataMessage(toErrorMessage(error));
    }
  }
  async function handleDeleteTask(taskId: string) {
    const operation = beginOperation("delete");
    if (!operation) return;
    setDataMessage(null);
    try {
      await deleteTaskRecord(taskId, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent() && activeTaskId === taskId) closeTaskModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }
  return {
    taskModalMode, activeTaskId, taskDraft, setTaskDraft, activeTask,
    activeTimelineTaskDetailId, activeTimelineTaskDetail, isSavingTask, isDeletingTask,
    showTimelineCreateToggleInTaskModal, timelineMilestoneCreateSignal,
    closeTaskModal, openCreateTaskModal, openEditTaskModal, restoreTimelineTaskDetails, leaveTaskDetails,
    openCreateTaskModalForMember: (memberId: string) => openCreateTaskModal({ memberId }),
    openCreateTaskModalFromTimeline: () => openCreateTaskModal({ fromTimeline: true }),
    openTimelineTaskDetailsModal: (task: TaskRecord) => restoreTimelineTaskDetails(task.id),
    closeTimelineTaskDetailsModal: () => restoreTimelineTaskDetails(null),
    switchTaskCreateToMilestone, handleTaskSubmit, handleDeleteTask, handleTaskStatusChange,
  };
}
