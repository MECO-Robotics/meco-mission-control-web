import type { Dispatch, SetStateAction } from "react";
import type { TaskPayload } from "@/types/payloads";

interface TaskEditorHeaderSectionProps {
  closeTaskModal: () => void;
  onSwitchCreateTypeToMilestone?: () => void;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  showCreateTypeToggle?: boolean;
  taskDraft: TaskPayload;
  taskModalMode: "create" | "edit";
}

export function TaskEditorHeaderSection({
  closeTaskModal,
  onSwitchCreateTypeToMilestone,
  setTaskDraft,
  showCreateTypeToggle,
  taskDraft,
  taskModalMode,
}: TaskEditorHeaderSectionProps) {
  return (
    <div className="panel-header compact-header task-details-header">
      <div>
        <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
          Task editor
        </p>
        <div className="task-detail-header-title-row">
          <div className="task-detail-header-title-stack">
            <div className="task-detail-header-title-main">
              {taskModalMode === "create" && showCreateTypeToggle ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    width: "100%",
                  }}
                >
                  <input
                    className="task-editor-title-input"
                    aria-label="Task title"
                    onChange={(milestone) =>
                      setTaskDraft((current) => ({ ...current, title: milestone.target.value }))
                    }
                    required
                    value={taskDraft.title}
                  />
                  <button className="primary-action" type="button">
                    Task
                  </button>
                  <button className="secondary-action" onClick={onSwitchCreateTypeToMilestone} type="button">
                    Milestone
                  </button>
                </div>
              ) : (
                <input
                  className="task-editor-title-input"
                  aria-label="Task title"
                  onChange={(milestone) =>
                    setTaskDraft((current) => ({ ...current, title: milestone.target.value }))
                  }
                  required
                  value={taskDraft.title}
                />
              )}
            </div>
            <p className="task-detail-copy task-detail-header-meta-line">
              <span className="task-detail-copy" style={{ color: "var(--text-copy)" }}>
                Edit the task details below.
              </span>
            </p>
          </div>
        </div>
      </div>
      <button
        className="icon-button"
        onClick={closeTaskModal}
        type="button"
        style={{ color: "var(--text-copy)", background: "transparent" }}
      >
        Close
      </button>
    </div>
  );
}
