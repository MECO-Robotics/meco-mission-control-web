import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskEditorAdvancedFieldsSection } from "./task/TaskEditorAdvancedFieldsSection";
import { TaskEditorCoreFieldsSection } from "./task/TaskEditorCoreFieldsSection";
import { TaskEditorDependencyEditorSection } from "./task/TaskEditorDependencyEditorSection";
import { TaskEditorHeaderSection } from "./task/TaskEditorHeaderSection";

interface TaskEditorModalProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleResolveTaskBlocker: (blockerId: string) => Promise<void>;
  handleTaskSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
  taskDraft: TaskPayload;
  taskModalMode: "create" | "edit";
  showCreateTypeToggle?: boolean;
  onSwitchCreateTypeToMilestone?: () => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
}

export function TaskEditorModal(props: TaskEditorModalProps) {
  const {
    activeTask,
    bootstrap,
    closeTaskModal,
    handleResolveTaskBlocker,
    handleTaskSubmit,
    isDeletingTask,
    isSavingTask,
    mentors,
    requestPhotoUpload,
    openTaskDetailsModal,
    onTaskEditCanceled,
    taskDraft,
    taskModalMode,
    showCreateTypeToggle,
    onSwitchCreateTypeToMilestone,
    setTaskDraft,
    students,
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

  if (isEditTaskModal && activeTask) {
    return (
      <form className="task-editor-modal" onSubmit={handleTaskSubmit}>
        <TaskDetailsModal
          activeTask={activeTask}
          bootstrap={bootstrap}
          closeTaskDetailsModal={handleTaskEditClosed}
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
          setTaskDraft={setTaskDraft}
          showDependencyBlockersSection
          showEditButton={false}
          taskDraft={taskDraft}
        />
      </form>
    );
  }

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal task-editor-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <TaskEditorHeaderSection
          closeTaskModal={closeTaskModal}
          onSwitchCreateTypeToMilestone={onSwitchCreateTypeToMilestone}
          setTaskDraft={setTaskDraft}
          showCreateTypeToggle={showCreateTypeToggle}
          taskDraft={taskDraft}
          taskModalMode={taskModalMode}
        />
        <form className="modal-form task-details-grid" onSubmit={handleTaskSubmit} style={{ color: "var(--text-copy)" }}>
          <TaskEditorCoreFieldsSection mentors={mentors} setTaskDraft={setTaskDraft} students={students} taskDraft={taskDraft} />

          {isCreateTaskModal ? (
            <>
              <TaskEditorAdvancedFieldsSection
                activeTask={activeTask}
                bootstrap={bootstrap}
                closeTaskModal={closeTaskModal}
                currentTaskId={activeTask?.id ?? null}
                isDeletingTask={isDeletingTask}
                isSavingTask={isSavingTask}
                requestPhotoUpload={requestPhotoUpload}
                setTaskDraft={setTaskDraft}
                taskDraft={taskDraft}
              />
              <TaskEditorDependencyEditorSection bootstrap={bootstrap} setTaskDraft={setTaskDraft} taskDraft={taskDraft} />
            </>
          ) : null}
        </form>
      </section>
    </div>
  );
}
