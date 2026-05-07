import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { TaskPriorityBadge } from "@/features/workspace/views/taskQueue/taskQueueKanbanCardMeta";
import type { TaskPayload } from "@/types/payloads";
import type { TaskDetailsOverviewFieldProps } from "./TaskDetailsOverviewFieldProps";
import { getPriorityToneClassName } from "./taskDetailsOverviewTone";

export function TaskDetailsOverviewPriorityField({
  canInlineEdit,
  editingField,
  model,
  openTaskEditModal,
  setEditingField,
}: TaskDetailsOverviewFieldProps) {
  return (
    <label className="field task-detail-row task-detail-row-chip task-details-overview-priority">
      <span style={{ color: "var(--text-title)" }}>Priority</span>
      {canInlineEdit ? (
        editingField === "priority" ? (
          <FilterDropdown
            allLabel="Priority"
            ariaLabel="Set task priority"
            buttonInlineEditField="priority"
            className="task-queue-filter-menu-submenu"
            icon={<TaskPriorityBadge priority={model.priorityText} />}
            getOptionToneClassName={(option) => getPriorityToneClassName(option.id)}
            getSelectedToneClassName={(selection) =>
              selection[0] ? getPriorityToneClassName(selection[0]) : undefined
            }
            singleSelect
            onChange={(selection) => {
              const nextPriority = selection[0];
              if (!nextPriority) {
                return;
              }
              model.setPriority(nextPriority as TaskPayload["priority"]);
              setEditingField(null);
            }}
            options={model.taskPriorityOptions}
            value={model.priorityText ? [model.priorityText] : []}
          />
        ) : (
          <div className="task-detail-inline-edit-shell">
            <button
              className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-chip"
              data-inline-edit-field="priority"
              onClick={() => setEditingField("priority")}
              type="button"
            >
              <span className={model.priorityPillClassName} style={{ gap: "0.32rem" }}>
                <span aria-hidden="true">
                  <TaskPriorityBadge priority={model.priorityText} />
                </span>
                <span>{model.priorityText}</span>
              </span>
            </button>
            <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
          </div>
        )
      ) : (
        <span
          className={model.priorityPillClassName}
          onDoubleClick={openTaskEditModal}
          style={{ gap: "0.32rem" }}
        >
          <span aria-hidden="true">
            <TaskPriorityBadge priority={model.priorityText} />
          </span>
          <span>{model.priorityText}</span>
        </span>
      )}
    </label>
  );
}
