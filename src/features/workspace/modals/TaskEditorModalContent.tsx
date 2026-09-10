import { useCallback, useLayoutEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskDetailsModal } from "./TaskDetailsModalContent";
import { TaskEditorAdvancedMediaSection } from "./task/editorAdvanced/TaskEditorAdvancedMediaSection";
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
  return {
    id: activeTask?.id ?? "__new-task__",
    projectId: taskDraft.projectId,
    workstreamId: taskDraft.workstreamId,
    workstreamIds: taskDraft.workstreamIds,
    title: taskDraft.title,
    summary: taskDraft.summary,
    subsystemId: taskDraft.subsystemId,
    subsystemIds: taskDraft.subsystemIds,
    disciplineId: taskDraft.disciplineId,
    mechanismId: taskDraft.mechanismId,
    mechanismIds: taskDraft.mechanismIds,
    partInstanceId: taskDraft.partInstanceId,
    partInstanceIds: taskDraft.partInstanceIds,
    artifactId: taskDraft.artifactId,
    artifactIds: taskDraft.artifactIds,
    targetRiskId: taskDraft.targetRiskId,
    targetMilestoneId: taskDraft.targetMilestoneId,
    photoUrl: taskDraft.photoUrl,
    ownerId: taskDraft.ownerId,
    assigneeIds: taskDraft.assigneeIds,
    mentorId: taskDraft.mentorId,
    startDate: taskDraft.startDate,
    dueDate: taskDraft.dueDate,
    priority: taskDraft.priority,
    status: taskDraft.status,
    blockers: (taskDraft.taskBlockers ?? []).map((blocker) => blocker.description),
    linkedManufacturingIds: taskDraft.linkedManufacturingIds,
    linkedPurchaseIds: taskDraft.linkedPurchaseIds,
    estimatedHours: taskDraft.estimatedHours,
    actualHours: taskDraft.actualHours,
    requiresDocumentation: taskDraft.requiresDocumentation,
    documentationLinked: taskDraft.documentationLinked,
  };
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

  if (isEditTaskModal && activeTask) {
    return (
      <form className="task-editor-modal" onSubmit={handleTaskSubmit}>
        <fieldset disabled={isBusy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <TaskDetailsModal
          activeTask={activeTask}
          bootstrap={bootstrap}
          closeTaskDetailsModal={handleTaskEditClosed}
          advancedSectionOpen={advancedSectionOpen}
          footerActions={
            <>
              <button
                className="secondary-action"
                onClick={handleTaskEditCancel}
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="primary-action"
                disabled={isSavingTask || isDeletingTask}
                type="submit"
              >
                {isSavingTask ? "Saving..." : "Save changes"}
              </button>
            </>
          }
          onEditTask={() => undefined}
          onResolveTaskBlocker={resolveBlockerWhenIdle}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
          setTaskDraft={updateDraftWhenIdle}
          showDependencyBlockersSection
          showEditButton={false}
          taskDraft={taskDraft}
        />
        </fieldset>
      </form>
    );
  }

  if (createTaskRecord) {
    return (
      <form className="task-editor-modal task-editor-create-modal" onSubmit={handleCreateTaskSubmit}>
        <fieldset disabled={isBusy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <TaskDetailsModal
          activeTask={createTaskRecord}
          bootstrap={bootstrap}
          closeTaskDetailsModal={closeWhenIdle}
          advancedSectionOpen={advancedSectionOpen}
          beforeOverviewContent={
            <>
              <TaskEditorCreateProjectSection
                bootstrap={bootstrap}
                currentTaskId={activeTask?.id ?? null}
                setTaskDraft={updateDraftWhenIdle}
                taskDraft={taskDraft}
              />
              <TaskEditorAdvancedMediaSection
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
          }
          beforeFooterContent={
            <TaskEditorCreateMetadataSection
              setTaskDraft={updateDraftWhenIdle}
              taskDraft={taskDraft}
            />
          }
          dependencyTargetProjectId={taskDraft.projectId}
          editableMemberOptions={props.students}
          eyebrowLabel="Create Task Details"
          footerActions={
            <>
              {showCreateTypeToggle && onSwitchCreateTypeToMilestone ? (
                <button
                  className="secondary-action"
                  onClick={() => { if (!busyRef.current) onSwitchCreateTypeToMilestone(); }}
                  type="button"
                >
                  Switch to milestone
                </button>
              ) : null}
              <button
                className="secondary-action"
                onClick={closeWhenIdle}
                style={{
                  background: "var(--bg-row-alt)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="primary-action"
                disabled={!canCreateTask || isSavingTask || isDeletingTask}
                type="submit"
              >
                {isSavingTask ? "Saving..." : "Create task"}
              </button>
            </>
          }
          modalClassName="task-editor-modal"
          onEditTask={() => undefined}
          onResolveTaskBlocker={resolveBlockerWhenIdle}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
          setTaskDraft={updateDraftWhenIdle}
          showDependencyBlockersSection
          showEditButton={false}
          taskDraft={taskDraft}
        />
        </fieldset>
      </form>
    );
  }

  return null;
}
