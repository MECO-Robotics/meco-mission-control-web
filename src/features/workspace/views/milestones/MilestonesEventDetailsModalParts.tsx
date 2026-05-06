import type { Dispatch, FocusEvent, ReactNode, SetStateAction } from "react";

import type { MilestoneRecord } from "@/types/recordsExecution";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import { MilestoneTaskStateIcon } from "@/features/workspace/shared/milestones/milestoneTaskState";
import type { TaskQueueBoardState } from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";
import { formatMilestoneDateTime, formatMilestoneEndDateTime } from "./milestonesViewUtils";
import type { MilestoneDetailEditableField } from "./sections/MilestonesEventDetailEditor";

export function MilestoneDetailValue({
  children,
  onOpenEditMilestone,
  showEditIndicator = false,
}: {
  children: ReactNode;
  onOpenEditMilestone: () => void;
  showEditIndicator?: boolean;
}) {
  return (
    <button
      className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-summary"
      onClick={onOpenEditMilestone}
      onDoubleClick={onOpenEditMilestone}
      type="button"
    >
      {children}
      {showEditIndicator ? (
        <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
      ) : null}
    </button>
  );
}

export function MilestoneDetailInlineValue({
  children,
  onOpenEditMilestone,
  showEditIndicator = false,
}: {
  children: ReactNode;
  onOpenEditMilestone: () => void;
  showEditIndicator?: boolean;
}) {
  return (
    <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline milestone-detail-inline-value">
      <button
        className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
        onClick={onOpenEditMilestone}
        onDoubleClick={onOpenEditMilestone}
        type="button"
      >
        {children}
        {showEditIndicator ? (
          <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
        ) : null}
      </button>
    </span>
  );
}

export function MilestoneDetailsStatusIcon({
  label,
  state,
}: {
  label: string;
  state: TaskQueueBoardState;
}) {
  return (
    <span
      aria-label={label}
      className={`task-detail-header-status task-detail-header-status-signal-${state}`}
      title={label}
    >
      <span className="task-detail-header-status-icon">
        <MilestoneTaskStateIcon compact state={state} />
      </span>
      <span className="task-detail-header-status-caption">{label}</span>
    </span>
  );
}

export function MilestoneEditTitleField({
  editingField,
  milestoneTitle,
  setEditingField,
  setMilestoneTitle,
}: {
  editingField: MilestoneDetailEditableField | null;
  milestoneTitle: string;
  setEditingField: Dispatch<SetStateAction<MilestoneDetailEditableField | null>>;
  setMilestoneTitle: (title: string) => void;
}) {
  if (editingField === "title") {
    return (
      <div className="task-detail-inline-edit-title-shell task-detail-inline-edit-title-shell-editing task-detail-header-title-main">
        <h2>{milestoneTitle}</h2>
        <input
          aria-label="Milestone title"
          autoFocus
          className="task-detail-inline-edit-input task-detail-inline-edit-input-title"
          onBlur={() => setEditingField(null)}
          onChange={(milestone) => setMilestoneTitle(milestone.target.value)}
          required
          value={milestoneTitle}
        />
      </div>
    );
  }

  return (
    <div className="task-detail-inline-edit-title-shell task-detail-header-title-main">
      <h2>{milestoneTitle}</h2>
      <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator task-detail-inline-edit-indicator-title" />
      <button
        aria-label="Edit milestone title"
        className="task-detail-inline-edit-hitarea"
        data-inline-edit-field="title"
        onClick={() => setEditingField("title")}
        type="button"
      />
    </div>
  );
}

export function MilestoneEditScheduleField({
  activeMilestone,
  editingField,
  milestoneEndDate,
  milestoneEndTime,
  milestoneStartDate,
  milestoneStartTime,
  setEditingField,
  setMilestoneEndDate,
  setMilestoneEndTime,
  setMilestoneStartDate,
  setMilestoneStartTime,
}: {
  activeMilestone: MilestoneRecord;
  editingField: MilestoneDetailEditableField | null;
  milestoneEndDate: string;
  milestoneEndTime: string;
  milestoneStartDate: string;
  milestoneStartTime: string;
  setEditingField: Dispatch<SetStateAction<MilestoneDetailEditableField | null>>;
  setMilestoneEndDate: (value: string) => void;
  setMilestoneEndTime: (value: string) => void;
  setMilestoneStartDate: (value: string) => void;
  setMilestoneStartTime: (value: string) => void;
}) {
  const startValue =
    milestoneStartDate && milestoneStartTime
      ? formatMilestoneDateTime(`${milestoneStartDate}T${milestoneStartTime}:00`)
      : formatMilestoneDateTime(activeMilestone.startDateTime);
  const endValue =
    milestoneEndDate && milestoneEndTime
      ? formatMilestoneDateTime(`${milestoneEndDate}T${milestoneEndTime}:00`)
      : formatMilestoneEndDateTime(activeMilestone.startDateTime, activeMilestone.endDateTime);

  if (editingField === "schedule") {
    return (
      <div
        className="task-detail-copy task-detail-header-meta-line"
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setEditingField(null);
          }
        }}
        style={{ marginTop: "0.35rem" }}
      >
        <input
          aria-label="Start date"
          autoFocus
          className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
          onChange={(milestone) => setMilestoneStartDate(milestone.target.value)}
          required
          type="date"
          value={milestoneStartDate}
        />
        <input
          aria-label="Start time"
          className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
          onChange={(milestone) => setMilestoneStartTime(milestone.target.value)}
          type="time"
          value={milestoneStartTime}
        />
        <span style={{ color: "var(--text-copy)" }}> to </span>
        <input
          aria-label="End date"
          className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
          onChange={(milestone) => setMilestoneEndDate(milestone.target.value)}
          type="date"
          value={milestoneEndDate}
        />
        <input
          aria-label="End time"
          className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
          onChange={(milestone) => setMilestoneEndTime(milestone.target.value)}
          type="time"
          value={milestoneEndTime}
        />
      </div>
    );
  }

  return (
    <MilestoneDetailInlineValue onOpenEditMilestone={() => setEditingField("schedule")}>
      <span className="pill status-pill status-pill-neutral">{startValue}</span>
      {endValue ? (
        <>
          <span style={{ color: "var(--text-copy)" }}> to </span>
          <span className="pill status-pill status-pill-neutral">{endValue}</span>
        </>
      ) : null}
    </MilestoneDetailInlineValue>
  );
}
