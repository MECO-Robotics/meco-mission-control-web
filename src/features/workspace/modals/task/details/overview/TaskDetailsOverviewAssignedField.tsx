import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { IconPerson } from "@/components/shared/Icons";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";
import { TaskDetailsAssignedList } from "./TaskDetailsAssignedList";

export function TaskDetailsOverviewAssignedField({
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
}: TaskDetailsOverviewFieldProps) {
  const assignedContent = <TaskDetailsAssignedList assigneeNames={model.assigneeNames} />;

  return (
    <div className="task-details-overview-assigned">
      <span style={{ color: "var(--text-title)" }}>Assigned</span>
      {canInlineEdit ? (
        editingField === "assigned" ? (
          <FilterDropdown
            allLabel="Unassigned"
            ariaLabel="Set assigned members"
            buttonInlineEditField="assigned"
            className="task-queue-filter-menu-submenu task-details-assigned-list"
            buttonContent={assignedContent}
            icon={<IconPerson />}
            onChange={model.handleAssignedChange}
            options={model.editableMemberOptions}
            value={model.selectedAssigneeIds}
          />
        ) : (
          <div className="task-detail-inline-edit-shell">
            <button
              className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-assigned task-details-assigned-list"
              data-inline-edit-field="assigned"
              onClick={() => setEditingField("assigned")}
              type="button"
            >
              {assignedContent}
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </div>
        )
      ) : (
        <div className="task-details-assigned-list" onDoubleClick={openTaskEditModal}>
          {assignedContent}
        </div>
      )}
    </div>
  );
}
