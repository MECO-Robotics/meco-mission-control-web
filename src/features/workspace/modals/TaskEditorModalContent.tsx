import { useCallback, useLayoutEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskDetailsModal } from "./TaskDetailsModalContent";
import { PhotoUploadField } from "../shared/media/PhotoUploadField";
import { TaskEditorCreateMetadataSection } from "./task/TaskEditorCreateMetadataSection";
import { TaskEditorCreateProjectSection } from "./task/TaskEditorCreateProjectSection";

interface TaskEditorModalProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  advancedSectionOpen: boolean;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  milestonesById: Record<string, BootstrapPayload["milestones"][number]>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleResolveTaskBlocker: (blockerId: string) => Promise<void>;
  handleTaskSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isDeletingTask: boolean;
  isSavingTask: boolean;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  mentors: BootstrapPayload["members"];
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  students: BootstrapPayload["members"];
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  openTaskDetailsModal: (task: TaskRecord) => void;
  onTaskEditCanceled: () => void;
  setAdvancedSectionOpen: Dispatch<SetStateAction<boolean>>;
  taskDraft: TaskPayload;
  taskModalMode: "create" | "edit";
  showCreateTypeToggle?: boolean;
  onSwitchCreateTypeToMilestone?: () => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
}

function buildDraftTaskRecord(taskDraft: TaskPayload, activeTask: TaskRecord | null): TaskRecord {
  const { taskBlockers, taskDependencies, ...recordDraft } = taskDraft;
  void taskDependencies;

  return {
    ...recordDraft,
    id: activeTask?.id ?? "__new-task__",
    blockers: (taskBlockers ?? []).map((blocker) => blocker.description),
  };
}

function TaskEditorFooterActions({
  canSubmit,
  onCancel,
  onSwitchCreateTypeToMilestone,
  isSaving,
  saveLabel,
  savingLabel,
}: {
  canSubmit: boolean;
  onCancel: () => void;
  onSwitchCreateTypeToMilestone?: () => void;
  isSaving: boolean;
  saveLabel: string;
  savingLabel: string;
}) {
  return (
    <>
      {onSwitchCreateTypeToMilestone ? (
        <button className="secondary-action" onClick={onSwitchCreateTypeToMilestone} type="button">
          Switch to milestone
        </button>
      ) : null}
      <button
        className="secondary-action"
        onClick={onCancel}
        style={{
          background: "var(--bg-row-alt)",
          color: "var(--text-title)",
          border: "1px solid var(--border-base)",
        }}
        type="button"
      >
        Cancel
      </button>
      <button className="primary-action" disabled={!canSubmit} type="submit">
        {isSaving ? savingLabel : saveLabel}
      </button>
    </>
  );
}

export function TaskEditorModal(props: TaskEditorModalProps) {
  const {
    activeTask,
    bootstrap,
    closeTaskModal,
    advancedSectionOpen,
    handleResolveTaskBlocker,
    handleTaskSubmit,
    isDeletingTask,
    isSavingTask,
    openTaskDetailsModal,
    onTaskEditCanceled,
    requestPhotoUpload,
    setAdvancedSectionOpen,
    taskDraft,
    taskModalMode,
    showCreateTypeToggle,
    onSwitchCreateTypeToMilestone,
    setTaskDraft,
  } = props;

  const initialDraft = useRef(JSON.stringify(taskDraft));
  const confirmDiscard = () => JSON.stringify(taskDraft) === initialDraft.current || window.confirm("Discard unsaved changes?");
  const isBusy = isSavingTask || isDeletingTask;
  const busyRef = useRef(isBusy);
  useLayoutEffect(() => { busyRef.current = isBusy; }, [isBusy]);
  const updateDraftWhenIdle = useCallback<Dispatch<SetStateAction<TaskPayload>>>((update) => {
    // Portaled menus and completed uploads can retain a callback from before save.
    if (!busyRef.current) setTaskDraft(update);
  }, [setTaskDraft]);
  const resolveBlockerWhenIdle = useCallback(async (id: string) => {
    if (!busyRef.current) await handleResolveTaskBlocker(id);
  }, [handleResolveTaskBlocker]);
  const closeWhenIdle = () => { if (!busyRef.current && confirmDiscard()) closeTaskModal(); };

  const handleTaskEditClosed = () => {
    if (busyRef.current || !confirmDiscard()) return;
    onTaskEditCanceled();
    closeTaskModal();
  };

  const handleTaskEditCancel = () => {
    if (busyRef.current || !confirmDiscard()) return;
    onTaskEditCanceled();

    if (activeTask) {
      openTaskDetailsModal(activeTask);
    }

    closeTaskModal();
  };

  const isCreateTaskModal = taskModalMode === "create";
  const isEditTaskModal = taskModalMode === "edit";
  const createTaskRecord = isCreateTaskModal ? buildDraftTaskRecord(taskDraft, activeTask) : null;
  const canCreateTask = taskDraft.title.trim().length > 0;

  const handleCreateTaskSubmit = (milestone: FormEvent<HTMLFormElement>) => {
    if (isBusy || !canCreateTask) {
      milestone.preventDefault();
      return;
    }

    handleTaskSubmit(milestone);
  };

  const taskRecord = isCreateTaskModal ? createTaskRecord : isEditTaskModal ? activeTask : null;

  if (!taskRecord) return null;

  return (
    <form
      className={`task-editor-modal${isCreateTaskModal ? " task-editor-create-modal" : ""}`}
      onSubmit={isCreateTaskModal ? handleCreateTaskSubmit : handleTaskSubmit}
    >
      <fieldset disabled={isBusy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <TaskDetailsModal
          activeTask={taskRecord}
          bootstrap={bootstrap}
          closeTaskDetailsModal={isCreateTaskModal ? closeWhenIdle : handleTaskEditClosed}
          advancedSectionOpen={advancedSectionOpen}
          beforeOverviewContent={isCreateTaskModal ? (
            <>
              <TaskEditorCreateProjectSection
                bootstrap={bootstrap}
                currentTaskId={activeTask?.id ?? null}
                setTaskDraft={updateDraftWhenIdle}
                taskDraft={taskDraft}
              />
              <PhotoUploadField
                label="Task photo"
                currentUrl={taskDraft.photoUrl}
                onChange={(value) =>
                  updateDraftWhenIdle((current) => ({ ...current, photoUrl: value }))
                }
                onUpload={async (file) => {
                  const projectId = taskDraft.projectId || bootstrap.projects[0]?.id;

                  if (!projectId) {
                    throw new Error("No project is available for photo upload.");
                  }

                  return requestPhotoUpload(projectId, file);
                }}
              />
            </>
          ) : undefined}
          beforeFooterContent={isCreateTaskModal ? (
            <TaskEditorCreateMetadataSection
              setTaskDraft={updateDraftWhenIdle}
              taskDraft={taskDraft}
            />
          ) : undefined}
          dependencyTargetProjectId={isCreateTaskModal ? taskDraft.projectId : undefined}
          editableMemberOptions={isCreateTaskModal ? props.students : undefined}
          eyebrowLabel={isCreateTaskModal ? "Create Task Details" : undefined}
          footerActions={
            <TaskEditorFooterActions
              canSubmit={!isBusy && (!isCreateTaskModal || canCreateTask)}
              isSaving={isSavingTask}
              onCancel={isCreateTaskModal ? closeWhenIdle : handleTaskEditCancel}
              onSwitchCreateTypeToMilestone={isCreateTaskModal && showCreateTypeToggle && onSwitchCreateTypeToMilestone
                ? () => { if (!busyRef.current) onSwitchCreateTypeToMilestone(); }
                : undefined}
              saveLabel={isCreateTaskModal ? "Create task" : "Save changes"}
              savingLabel="Saving..."
            />
          }
          modalClassName="task-editor-modal"
          onEditTask={() => undefined}
          onResolveTaskBlocker={resolveBlockerWhenIdle}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
          setTaskDraft={updateDraftWhenIdle}
          showDependencyBlockersSection={isEditTaskModal}
          showEditButton={false}
          taskDraft={taskDraft}
        />
      </fieldset>
    </form>
  );
}
