import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { IconPerson } from "@/components/shared/Icons";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";

type PersonFieldKind = "mentor" | "owner";

export function TaskDetailsOverviewPersonField({
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
  kind,
}: TaskDetailsOverviewFieldProps & { kind: PersonFieldKind }) {
  const isMentor = kind === "mentor";
  const label = isMentor ? "Mentor" : "Owner";
  const options = isMentor ? model.editableMentorOptions : model.editableMemberOptions;
  const value = isMentor ? model.mentorIdText : model.ownerIdText;
  const displayValue = isMentor ? model.mentorText : model.ownerText;
  const readOnlyValue = isMentor ? model.mentorName : model.ownerName;
  const changeHandler = isMentor ? model.handleMentorChange : model.handleOwnerChange;

  return (
    <label className={`field task-details-overview-${kind}`}>
      <span style={{ color: "var(--text-title)" }}>{label}</span>
      {canInlineEdit ? (
        editingField === kind ? (
          <FilterDropdown
            allLabel="Unassigned"
            ariaLabel={isMentor ? "Set mentor" : "Set task owner"}
            buttonInlineEditField={kind}
            className="task-queue-filter-menu-submenu"
            icon={<IconPerson />}
            singleSelect
            onChange={changeHandler}
            options={options}
            value={value ? [value] : []}
          />
        ) : (
          <div className="task-detail-inline-edit-shell">
            <button
              className="task-detail-inline-edit-trigger"
              data-inline-edit-field={kind}
              onClick={() => setEditingField(kind)}
              type="button"
            >
              <p className="task-detail-copy">{displayValue}</p>
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </div>
        )
      ) : (
        <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
          {readOnlyValue}
        </p>
      )}
    </label>
  );
}
