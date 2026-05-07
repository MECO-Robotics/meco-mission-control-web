import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { IconPerson } from "@/components/shared/Icons";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";

export function TaskDetailsOverviewOwnerField({
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
}: TaskDetailsOverviewFieldProps) {
  return (
    <label className="field task-details-overview-owner">
      <span style={{ color: "var(--text-title)" }}>Owner</span>
      {canInlineEdit ? (
        editingField === "owner" ? (
          <FilterDropdown
            allLabel="Unassigned"
            ariaLabel="Set task owner"
            buttonInlineEditField="owner"
            className="task-queue-filter-menu-submenu"
            icon={<IconPerson />}
            singleSelect
            onChange={model.handleOwnerChange}
            options={model.editableMemberOptions}
            value={model.ownerIdText ? [model.ownerIdText] : []}
          />
        ) : (
          <div className="task-detail-inline-edit-shell">
            <button
              className="task-detail-inline-edit-trigger"
              data-inline-edit-field="owner"
              onClick={() => setEditingField("owner")}
              type="button"
            >
              <p className="task-detail-copy">{model.ownerText}</p>
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </div>
        )
      ) : (
        <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
          {model.ownerName}
        </p>
      )}
    </label>
  );
}
