import type { CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { MilestoneType } from "@/types/common";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { getMilestoneTaskBoardStateForMilestone, MilestoneTaskStateIcon } from "@/features/workspace/shared/milestones/milestoneTaskState";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import {
  DEFAULT_EVENT_TYPE as DEFAULT_MILESTONE_TYPE,
  EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES,
  getMilestoneTypeStyle,
} from "@/features/workspace/shared/events/eventStyles";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import {
  TASK_QUEUE_BOARD_COLUMNS,
  formatTaskQueueBoardState,
  type TaskQueueBoardState,
} from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";
import { MilestoneSearchHighlight } from "./MilestoneSearchHighlight";
import { formatMilestoneDateTime } from "./milestonesViewUtils";

const MILESTONE_TYPE_BADGE_LABELS: Record<MilestoneType, string> = {
  practice: "Practice",
  competition: "Competition",
  deadline: "Deadline",
  "internal-review": "Internal review",
  demo: "Demo",
};

function getMilestoneBoardType(milestone: MilestoneRecord) {
  return milestone.type in MILESTONE_TYPE_STYLES ? milestone.type : DEFAULT_MILESTONE_TYPE;
}

function isSameLocalCalendarDay(start: Date, end: Date) {
  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );
}

function readTimePortion(value: string) {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

function shouldRenderDateOnly(value: string) {
  const timePortion = readTimePortion(value);
  return timePortion === null || timePortion === "12:00";
}

function formatMilestoneDate(value: string) {
  const datePortion = value.slice(0, 10);
  return new Date(`${datePortion}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMilestoneStartDateTime(startDateTime: string) {
  if (shouldRenderDateOnly(startDateTime)) {
    return formatMilestoneDate(startDateTime);
  }

  return formatMilestoneDateTime(startDateTime);
}

function formatMilestoneEndDateTime(startDateTime: string, endDateTime: string | null) {
  if (!endDateTime) {
    return null;
  }

  if (shouldRenderDateOnly(endDateTime)) {
    return formatMilestoneDate(endDateTime);
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isSameLocalCalendarDay(start, end)) {
    return end.toLocaleString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return formatMilestoneDateTime(endDateTime);
}

function groupMilestonesByBoardState(
  milestones: MilestoneRecord[],
  bootstrap: BootstrapPayload,
) {
  const grouped = TASK_QUEUE_BOARD_COLUMNS.reduce(
    (accumulator, { state }) => {
      accumulator[state] = [];
      return accumulator;
    },
    {} as Record<TaskQueueBoardState, MilestoneRecord[]>,
  );

  milestones.forEach((milestone) => {
    grouped[getMilestoneTaskBoardStateForMilestone(milestone, bootstrap)].push(milestone);
  });

  return grouped;
}

interface MilestoneKanbanBoardProps {
  boardStyle?: CSSProperties;
  bootstrap: BootstrapPayload;
  milestones: MilestoneRecord[];
  onOpenMilestone: (milestone: MilestoneRecord) => void;
  projectLabelByMilestoneId: Record<string, string>;
  searchFilter: string;
}

export function MilestoneKanbanBoard({
  boardStyle,
  bootstrap,
  milestones,
  onOpenMilestone,
  projectLabelByMilestoneId,
  searchFilter,
}: MilestoneKanbanBoardProps) {
  const milestonesByState = groupMilestonesByBoardState(milestones, bootstrap);

  return (
    <KanbanColumns
      boardClassName="task-queue-board milestone-board"
      columnBodyClassName="task-queue-board-column-body"
      columnClassName="task-queue-board-column"
      columnCountClassName="task-queue-board-column-count"
      columnEmptyClassName="task-queue-board-column-empty"
      columnHeaderClassName="task-queue-board-column-header"
      style={boardStyle}
      columns={TASK_QUEUE_BOARD_COLUMNS.map(({ state }) => {
        const stateLabel = formatTaskQueueBoardState(state);

        return {
          state,
          count: milestonesByState[state].length,
          header: (
            <span className={getStatusPillClassName(state)}>
              <span aria-hidden="true" className="task-queue-board-column-header-icon">
                <MilestoneTaskStateIcon compact state={state} />
              </span>
              <span className="task-queue-board-column-header-label">{stateLabel}</span>
            </span>
          ),
        };
      })}
      emptyLabel="No milestones"
      itemsByState={milestonesByState}
      renderItem={(milestone) => {
        const milestoneType = getMilestoneBoardType(milestone);
        const milestoneTypeStyle = getMilestoneTypeStyle(milestoneType);
        const milestoneTypeBadge = MILESTONE_TYPE_BADGE_LABELS[milestoneType];
        const milestoneStartLabel = formatMilestoneStartDateTime(milestone.startDateTime);
        const milestoneEndLabel = formatMilestoneEndDateTime(milestone.startDateTime, milestone.endDateTime);
        const projectLabel = projectLabelByMilestoneId[milestone.id] ?? "All projects";
        const milestoneTypeBadgeStyle = {
          "--milestone-type-chip-bg": milestoneTypeStyle.chipBackground,
          "--milestone-type-chip-border": milestoneTypeStyle.columnBorder,
          "--milestone-type-chip-text": milestoneTypeStyle.chipText,
          "--milestone-type-chip-bg-dark": milestoneTypeStyle.darkChipBackground,
          "--milestone-type-chip-border-dark": milestoneTypeStyle.darkColumnBorder,
          "--milestone-type-chip-text-dark": milestoneTypeStyle.darkChipText,
        } as CSSProperties;

        return (
          <button
            className="task-queue-board-card editable-hover-target editable-hover-target-row"
            data-tutorial-target="edit-milestone-row"
            key={milestone.id}
            onClick={() => onOpenMilestone(milestone)}
            type="button"
          >
            <div className="task-queue-board-card-header">
              <strong>
                <MilestoneSearchHighlight searchFilter={searchFilter} text={milestone.title} />
              </strong>
              <span
                style={{
                  alignItems: "flex-end",
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  whiteSpace: "normal",
                }}
              >
                <span className="task-queue-board-card-due">{milestoneStartLabel}</span>
                {milestoneEndLabel ? (
                  <span style={{ alignItems: "center", display: "inline-flex", gap: "0.25rem" }}>
                    <span style={{ color: "var(--text-copy)", fontSize: "0.65rem", fontWeight: 700 }}>to</span>
                    <span className="task-queue-board-card-due">{milestoneEndLabel}</span>
                  </span>
                ) : null}
              </span>
            </div>
            <small className="task-queue-board-card-summary">
              <MilestoneSearchHighlight
                searchFilter={searchFilter}
                text={milestone.description.trim() || "No description"}
              />
            </small>
            <div className="task-queue-board-card-meta">
              <span
                aria-label={`Milestone type: ${milestoneTypeStyle.label}`}
                className="pill status-pill milestone-type-pill task-queue-board-card-type-badge"
                style={milestoneTypeBadgeStyle}
                title={`Milestone type: ${milestoneTypeStyle.label}`}
              >
                <span aria-hidden="true">
                  <MilestoneSearchHighlight searchFilter={searchFilter} text={milestoneTypeBadge} />
                </span>
              </span>
              <span
                className="task-queue-board-card-context-chip"
                title={projectLabel}
              >
                <MilestoneSearchHighlight searchFilter={searchFilter} text={projectLabel} />
              </span>
            </div>
            <EditableHoverIndicator className="task-queue-board-card-hover" />
          </button>
        );
      }}
    />
  );
}
