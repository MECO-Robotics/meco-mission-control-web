import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { IconPerson } from "@/components/shared/Icons";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";

export function TaskDetailsOverviewMentorField({
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
}: TaskDetailsOverviewFieldProps) {
  return (
    <label className="field task-details-overview-mentor">
      <span style={{ color: "var(--text-title)" }}>Mentor</span>
      {canInlineEdit ? (
        editingField === "mentor" ? (
          <FilterDropdown
            allLabel="Unassigned"
            ariaLabel="Set mentor"
            buttonInlineEditField="mentor"
            className="task-queue-filter-menu-submenu"
            icon={<IconPerson />}
            singleSelect
            onChange={model.handleMentorChange}
            options={model.editableMentorOptions}
            value={model.mentorIdText ? [model.mentorIdText] : []}
          />
        ) : (
          <div className="task-detail-inline-edit-shell">
            <button
              className="task-detail-inline-edit-trigger"
              data-inline-edit-field="mentor"
              onClick={() => setEditingField("mentor")}
              type="button"
            >
              <p className="task-detail-copy">{model.mentorText}</p>
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </div>
        )
      ) : (
        <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
          {model.mentorName}
        </p>
      )}
    </label>
  );
}
