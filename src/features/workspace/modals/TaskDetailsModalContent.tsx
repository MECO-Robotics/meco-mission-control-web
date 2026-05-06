import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskDetailsAdvancedSection } from "./task/TaskDetailsAdvancedSection";
import { TaskDetailsDependencyBlockersSection } from "./task/TaskDetailsDependencyBlockersSection";
import { TaskDetailsHeaderSection } from "./task/TaskDetailsHeaderSection";
import { TaskDetailsOverviewSection } from "./task/TaskDetailsOverviewSection";
import type { TaskDetailsEditableField } from "./task/taskModalTypes";

interface TaskDetailsModalProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  closeTaskDetailsModal: () => void;
  advancedSectionOpen: boolean;
  footerActions?: ReactNode;
  headerTitle?: ReactNode;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  setAdvancedSectionOpen: Dispatch<SetStateAction<boolean>>;
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
  advancedSectionOpen,
  footerActions,
  headerTitle,
  setTaskDraft,
  setAdvancedSectionOpen,
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
            advancedSectionOpen={advancedSectionOpen}
            canInlineEdit={canInlineEdit}
            editingField={editingField}
            openTaskEditModal={openTaskEditModal}
            setAdvancedSectionOpen={setAdvancedSectionOpen}
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
