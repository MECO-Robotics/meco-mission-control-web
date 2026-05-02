import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { TaskDetailsAdvancedSection } from "./TaskDetailsAdvancedSection";
import { TaskDetailsDependencyBlockersSection } from "./TaskDetailsDependencyBlockersSection";
import { TaskDetailsHeaderSection } from "./TaskDetailsHeaderSection";
import { TaskDetailsOverviewSection } from "./TaskDetailsOverviewSection";
import type { TaskDetailsEditableField } from "./taskModalTypes";

interface TaskDetailsModalProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  closeTaskDetailsModal: () => void;
  footerActions?: ReactNode;
  headerTitle?: ReactNode;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
  onEditTask: (task: TaskRecord) => void;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  showDependencyBlockersSection?: boolean;
  showEditButton?: boolean;
}

export function TaskDetailsModal({
  activeTask,
  bootstrap,
  closeTaskDetailsModal,
  footerActions,
  headerTitle,
  setTaskDraft,
  taskDraft,
  onEditTask,
  onResolveTaskBlocker,
  showDependencyBlockersSection = true,
  showEditButton = true,
}: TaskDetailsModalProps) {
  const [editingField, setEditingField] = useState<TaskDetailsEditableField | null>(null);
  const canInlineEdit = Boolean(taskDraft && setTaskDraft);

  useEffect(() => {
    setEditingField(null);
  }, [activeTask.id]);

  const openTaskEditModal = () => onEditTask(activeTask);

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <TaskDetailsHeaderSection
          activeTask={activeTask}
          bootstrap={bootstrap}
          canInlineEdit={canInlineEdit}
          closeTaskDetailsModal={closeTaskDetailsModal}
          editingField={editingField}
          headerTitle={headerTitle}
          openTaskEditModal={openTaskEditModal}
          setEditingField={setEditingField}
          setTaskDraft={setTaskDraft}
          taskDraft={taskDraft}
        />

        <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
          <TaskDetailsOverviewSection
            activeTask={activeTask}
            bootstrap={bootstrap}
            canInlineEdit={canInlineEdit}
            editingField={editingField}
            openTaskEditModal={openTaskEditModal}
            setEditingField={setEditingField}
            setTaskDraft={setTaskDraft}
            taskDraft={taskDraft}
          />

          {showDependencyBlockersSection ? (
            <TaskDetailsDependencyBlockersSection
              activeTask={activeTask}
              bootstrap={bootstrap}
              canInlineEdit={canInlineEdit}
              onResolveTaskBlocker={onResolveTaskBlocker}
              setTaskDraft={setTaskDraft}
              taskDraft={taskDraft}
            />
          ) : null}

          <TaskDetailsAdvancedSection
            activeTask={activeTask}
            bootstrap={bootstrap}
            canInlineEdit={canInlineEdit}
            editingField={editingField}
            openTaskEditModal={openTaskEditModal}
            setEditingField={setEditingField}
            setTaskDraft={setTaskDraft}
            taskDraft={taskDraft}
          />

          <div className="modal-actions modal-wide">
            {footerActions}
            {showEditButton ? (
              <button
                className="primary-action task-details-edit-button"
                data-tutorial-target="timeline-edit-task-button"
                onClick={() => onEditTask(activeTask)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path
                    d="M11.854 1.646a.5.5 0 0 1 .707 0l1.793 1.793a.5.5 0 0 1 0 .707l-8.52 8.52-3.183.71.71-3.183 8.493-8.547ZM3.74 10.995l1.265-.282 7.574-7.6-1.06-1.06-7.6 7.574-.179.81ZM2 13.5h12a.5.5 0 0 1 0 1H2a.5.5 0 0 1 0-1Z"
                    fill="currentColor"
                  />
                </svg>
                Edit task
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
