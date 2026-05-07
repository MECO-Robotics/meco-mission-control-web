import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { EditableHoverIndicator } from "../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import { formatTaskStatusLabel } from "../../shared/model/workspaceOptions";
import { getTaskOpenBlockersForTask } from "../../shared/task/taskTargeting";
import type { TaskDetailsEditableField } from "./taskModalTypes";
import { getTimelineTaskStatusSignal } from "../../views/timeline/timelineGridBodyUtils";
import { TimelineTaskStatusLogo } from "../../views/timeline/TimelineTaskStatusLogo";
import { IconTasks } from "@/components/shared/Icons";

interface TaskDetailsHeaderSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  closeTaskDetailsModal: () => void;
  editingField: TaskDetailsEditableField | null;
  headerTitle?: ReactNode;
  openTaskEditModal: () => void;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
  canInlineEdit: boolean;
}

function formatTaskDetailDate(dateValue: string): string {
  if (!dateValue) {
    return "Not set";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString();
}

function isTaskDetailDateOverdue(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() < today.getTime();
}

function isTaskDetailDateToday(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() === today.getTime();
}

function TaskDetailsStatusIcon({
  label,
  signal,
  status,
}: {
  label: string;
  signal: ReturnType<typeof getTimelineTaskStatusSignal>;
  status: TaskRecord["status"];
}) {
  return (
    <span
      aria-label={label}
      className={`task-detail-header-status task-detail-header-status-signal-${signal}`}
      title={label}
    >
      <span className="task-detail-header-status-icon">
        <TimelineTaskStatusLogo signal={signal} status={status} />
      </span>
      <span className="task-detail-header-status-caption">{label}</span>
    </span>
  );
}

export function TaskDetailsHeaderSection({
  activeTask,
  bootstrap,
  closeTaskDetailsModal,
  editingField,
  headerTitle,
  openTaskEditModal,
  setEditingField,
  setTaskDraft,
  taskDraft,
  canInlineEdit,
}: TaskDetailsHeaderSectionProps) {
  const editableTask = taskDraft ?? activeTask;
  const milestonesById = Object.fromEntries(bootstrap.milestones.map((milestone) => [milestone.id, milestone]));
  const linkedMilestone =
    editableTask.targetMilestoneId && milestonesById[editableTask.targetMilestoneId]
      ? milestonesById[editableTask.targetMilestoneId]
      : null;
  const openBlockers = getTaskOpenBlockersForTask(activeTask.id, bootstrap);
  const isBlockedByDependency = openBlockers.length > 0;
  const statusText = taskDraft?.status ?? activeTask.status;
  const statusPreviewTask = taskDraft ? { ...activeTask, status: statusText } : activeTask;
  const detailStatusSignal = getTimelineTaskStatusSignal(statusPreviewTask, bootstrap);
  const detailStatusLabel = isBlockedByDependency ? "Blocked" : formatTaskStatusLabel(statusText);
  const estimatedHours = Number(activeTask.estimatedHours);
  const actualHours = Number(activeTask.actualHours);
  const dueDateText = formatTaskDetailDate(editableTask.dueDate);
  const dueDatePillClassName = editableTask.dueDate
    ? statusText === "complete"
      ? "pill task-detail-deadline-pill task-detail-deadline-pill-success"
      : isTaskDetailDateOverdue(editableTask.dueDate)
        ? "pill task-detail-deadline-pill task-detail-deadline-pill-danger"
        : isTaskDetailDateToday(editableTask.dueDate)
          ? "pill task-detail-deadline-pill task-detail-deadline-pill-warning"
          : "pill task-detail-deadline-pill task-detail-deadline-pill-success"
    : "pill status-pill status-pill-neutral";
  const loggedHoursClassName =
    estimatedHours > 0
      ? actualHours === 0
        ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
        : actualHours <= estimatedHours
          ? "pill task-detail-hours-pill task-detail-hours-pill-success"
          : actualHours < estimatedHours * 1.5
            ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
            : "pill task-detail-hours-pill task-detail-hours-pill-danger"
      : "pill task-detail-hours-pill task-detail-hours-pill-neutral";
  const targetMilestoneText = linkedMilestone ? linkedMilestone.title : "No target milestone";
  const targetMilestoneOptions = bootstrap.milestones.map((milestone) => ({
    id: milestone.id,
    name: milestone.title,
  }));

  return (
    <div className="panel-header compact-header task-details-header">
      <div>
        <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
          {canInlineEdit ? "Edit Task Details" : "View Task Details"}
        </p>
        <div className="task-detail-header-title-row">
          <div className="task-detail-header-title-stack">
            <div className="task-detail-header-title-main">
              {canInlineEdit ? (
                editingField === "title" ? (
                  <div className="task-detail-inline-edit-title-shell task-detail-inline-edit-title-shell-editing">
                    <h2>{taskDraft?.title ?? activeTask.title}</h2>
                    <input
                      aria-label="Task title"
                      autoFocus
                      className="task-detail-inline-edit-input task-detail-inline-edit-input-title"
                      data-inline-edit-field="title"
                      onBlur={() => setEditingField(null)}
                      onChange={(milestone) =>
                        setTaskDraft?.((current) => ({ ...current, title: milestone.target.value }))
                      }
                      required
                      value={taskDraft?.title ?? activeTask.title}
                    />
                  </div>
                ) : (
                  <div className="task-detail-inline-edit-title-shell">
                    <h2>{taskDraft?.title ?? activeTask.title}</h2>
                    <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator task-detail-inline-edit-indicator-title" />
                    <button
                      aria-label="Edit task title"
                      className="task-detail-inline-edit-hitarea"
                      data-inline-edit-field="title"
                      onClick={() => setEditingField("title")}
                      type="button"
                    />
                  </div>
                )
              ) : (
                <div onDoubleClick={openTaskEditModal}>
                  {headerTitle ?? <h2 style={{ color: "var(--text-title)" }}>{activeTask.title}</h2>}
                </div>
              )}
            </div>
            <div className="task-detail-copy task-detail-header-meta-line">
              {canInlineEdit ? (
                editingField === "dueDate" ? (
                  <input
                    aria-label="Due date"
                    autoFocus
                    className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
                    data-inline-edit-field="dueDate"
                    onBlur={() => setEditingField(null)}
                    onChange={(milestone) => {
                      setTaskDraft?.((current) => ({ ...current, dueDate: milestone.target.value }));
                      setEditingField(null);
                    }}
                    type="date"
                    value={editableTask.dueDate}
                  />
                ) : (
                  <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                    <button
                      className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                      data-inline-edit-field="dueDate"
                      onClick={() => setEditingField("dueDate")}
                      type="button"
                    >
                      <span className={dueDatePillClassName}>{dueDateText}</span>
                    </button>
                    <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                  </span>
                )
              ) : (
                <span className={dueDatePillClassName} onDoubleClick={openTaskEditModal}>
                  {dueDateText}
                </span>
              )}
              <span style={{ color: "var(--text-copy)" }}> {"->"} </span>
              {canInlineEdit ? (
                editingField === "targetMilestone" ? (
                  <FilterDropdown
                    allLabel="No target milestone"
                    ariaLabel="Set target milestone"
                    buttonInlineEditField="targetMilestone"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconTasks />}
                    singleSelect
                    onChange={(selection) => {
                      setTaskDraft?.((current) => ({
                        ...current,
                        targetMilestoneId: selection[0] ?? null,
                      }));
                      setEditingField(null);
                    }}
                    options={targetMilestoneOptions}
                    value={editableTask.targetMilestoneId ? [editableTask.targetMilestoneId] : []}
                  />
                ) : (
                  <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                    <button
                      className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                      data-inline-edit-field="targetMilestone"
                      onClick={() => setEditingField("targetMilestone")}
                      type="button"
                    >
                      <span>{targetMilestoneText}</span>
                    </button>
                    <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                  </span>
                )
              ) : (
                <span onDoubleClick={openTaskEditModal}>{targetMilestoneText}</span>
              )}
            </div>
          </div>
          <div className="task-detail-header-side-stack">
            <TaskDetailsStatusIcon label={detailStatusLabel} signal={detailStatusSignal} status={statusText} />
            <span className="task-detail-header-hours-inline task-detail-header-hours-right">
              <span className="task-detail-header-hours-label">Logged:</span>
              <span className={loggedHoursClassName}>{actualHours}h</span>
              <span className="task-detail-hour-separator">/</span>
              <span className="task-detail-hours-estimate">{estimatedHours}h</span>
            </span>
          </div>
        </div>
      </div>
      <div className="panel-actions">
        <button
          aria-label="Close task details"
          className="icon-button task-details-close-button"
          onClick={closeTaskDetailsModal}
          type="button"
        >
          {"\u00D7"}
        </button>
      </div>
    </div>
  );
}
