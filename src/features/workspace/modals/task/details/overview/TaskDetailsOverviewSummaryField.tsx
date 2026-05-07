import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";

interface TaskDetailsOverviewSummaryFieldProps extends TaskDetailsOverviewFieldProps {
  activeSummary: string;
}

export function TaskDetailsOverviewSummaryField({
  activeSummary,
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
}: TaskDetailsOverviewSummaryFieldProps) {
  const summaryText = model.taskSummary || "No summary provided.";

  return (
    <label className="field task-detail-row modal-wide">
      <span style={{ color: "var(--text-title)" }}>Summary</span>
      {canInlineEdit ? (
        editingField === "summary" ? (
          <textarea
            autoFocus
            className="task-detail-inline-edit-textarea"
            onBlur={() => setEditingField(null)}
            onChange={(milestone) => model.setSummary(milestone.target.value)}
            value={model.taskSummary}
          />
        ) : (
          <div className="task-detail-inline-edit-shell">
            <button
              className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-summary"
              data-inline-edit-field="summary"
              onClick={() => setEditingField("summary")}
              type="button"
            >
              <p className="task-detail-copy">{summaryText}</p>
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </div>
        )
      ) : (
        <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
          {activeSummary || "No summary provided."}
        </p>
      )}
    </label>
  );
}
