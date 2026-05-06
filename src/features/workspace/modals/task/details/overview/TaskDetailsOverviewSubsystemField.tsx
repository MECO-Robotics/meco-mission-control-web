import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { IconManufacturing } from "@/components/shared/Icons";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";

export function TaskDetailsOverviewSubsystemField({
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
}: TaskDetailsOverviewFieldProps) {
  return (
    <label
      className={`field task-detail-row task-detail-row-chip task-details-overview-subsystem ${
        canInlineEdit ? "task-details-inline-edit-left" : ""
      }`}
    >
      <span style={{ color: "var(--text-title)" }}>{model.subsystemFieldLabel}</span>
      {canInlineEdit ? (
        editingField === "subsystem" ? (
          <FilterDropdown
            allLabel={`No ${model.subsystemFieldLabel.toLowerCase()} linked`}
            ariaLabel={`Set ${model.subsystemFieldLabel.toLowerCase()}`}
            buttonInlineEditField="subsystem"
            className="task-queue-filter-menu-submenu"
            icon={<IconManufacturing />}
            getOptionToneClassName={model.getSubsystemOptionToneClassName}
            getSelectedToneClassName={(selection) =>
              selection[0] ? model.getSubsystemOptionToneClassName({ id: selection[0] }) : undefined
            }
            singleSelect
            onChange={model.handleSubsystemChange}
            options={model.primaryTargetNameOptions.map((name) => ({ id: name, name }))}
            value={model.selectedPrimaryTargetId ? [model.selectedPrimaryTargetId] : []}
          />
        ) : (
          <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline task-detail-inline-edit-shell-inline-left">
            <button
              className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
              data-inline-edit-field="subsystem"
              onClick={() => setEditingField("subsystem")}
              type="button"
            >
              <span className={model.subsystemPillClassName} style={model.subsystemPillStyle}>
                {model.subsystemText}
              </span>
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </span>
        )
      ) : (
        <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
          <span className={model.subsystemPillClassName} style={model.subsystemPillStyle}>
            {model.subsystemText}
          </span>
        </p>
      )}
    </label>
  );
}
