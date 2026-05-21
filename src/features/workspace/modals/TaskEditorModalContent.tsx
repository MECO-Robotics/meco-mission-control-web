import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskDetailsModal } from "./TaskDetailsModalContent";
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
    targetMilestoneId: taskDraft.targetMilestoneId,
    photoUrl: taskDraft.photoUrl,
    ownerId: taskDraft.ownerId,
    assigneeIds: taskDraft.assigneeIds,
    mentorId: taskDraft.mentorId,
    startDate: taskDraft.startDate,
    dueDate: taskDraft.dueDate,
    priority: taskDraft.priority,
    status: taskDraft.status,
    dependencyIds: [],
    blockers: taskDraft.blockers,
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
    setAdvancedSectionOpen,
    taskDraft,
    taskModalMode,
    showCreateTypeToggle,
    onSwitchCreateTypeToMilestone,
    setTaskDraft,
  } = props;

  const handleTaskEditClosed = () => {
    onTaskEditCanceled();
    closeTaskModal();
  };

  const handleTaskEditCancel = () => {
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
    if (!canCreateTask) {
      milestone.preventDefault();
      return;
    }

    handleTaskSubmit(milestone);
  };

  if (isEditTaskModal && activeTask) {
    return (
      <form className="task-editor-modal" onSubmit={handleTaskSubmit}>
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
          onResolveTaskBlocker={handleResolveTaskBlocker}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
          setTaskDraft={setTaskDraft}
          showDependencyBlockersSection
          showEditButton={false}
          taskDraft={taskDraft}
        />
      </form>
    );
  }

  if (createTaskRecord) {
    return (
      <form className="task-editor-modal task-editor-create-modal" onSubmit={handleCreateTaskSubmit}>
        <TaskDetailsModal
          activeTask={createTaskRecord}
          bootstrap={bootstrap}
          closeTaskDetailsModal={closeTaskModal}
          advancedSectionOpen={advancedSectionOpen}
          beforeOverviewContent={
            <TaskEditorCreateProjectSection
              bootstrap={bootstrap}
              currentTaskId={activeTask?.id ?? null}
              setTaskDraft={setTaskDraft}
              taskDraft={taskDraft}
            />
          }
          eyebrowLabel="Create Task Details"
          footerActions={
            <>
              {showCreateTypeToggle && onSwitchCreateTypeToMilestone ? (
                <button
                  className="secondary-action"
                  onClick={onSwitchCreateTypeToMilestone}
                  type="button"
                >
                  Switch to milestone
                </button>
              ) : null}
              <button
                className="secondary-action"
                onClick={closeTaskModal}
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
          onResolveTaskBlocker={handleResolveTaskBlocker}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
          setTaskDraft={setTaskDraft}
          showDependencyBlockersSection
          showEditButton={false}
          taskDraft={taskDraft}
        />
      </form>
    );
  }

  return null;
}
