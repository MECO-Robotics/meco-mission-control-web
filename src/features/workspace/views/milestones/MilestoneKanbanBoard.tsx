import type { CSSProperties } from "react";

import type { BootstrapPayload, MilestoneRecord } from "@/types";
import { EditableHoverIndicator } from "@/features/workspace/shared/WorkspaceViewShared";
import {
  DEFAULT_EVENT_TYPE as DEFAULT_MILESTONE_TYPE,
  EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES,
  getMilestoneTypeStyle,
} from "@/features/workspace/shared/events/eventStyles";
import { formatMilestoneDateTime } from "./milestonesViewUtils";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";

const MILESTONE_BOARD_TYPES = Object.keys(MILESTONE_TYPE_STYLES) as (keyof typeof MILESTONE_TYPE_STYLES)[];

function getMilestoneBoardType(milestone: MilestoneRecord) {
  return milestone.type in MILESTONE_TYPE_STYLES ? milestone.type : DEFAULT_MILESTONE_TYPE;
}

interface MilestoneKanbanBoardProps {
  milestones: MilestoneRecord[];
  onOpenMilestone: (milestone: MilestoneRecord) => void;
  projectLabelByMilestoneId: Record<string, string>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function MilestoneKanbanBoard({
  milestones,
  onOpenMilestone,
  projectLabelByMilestoneId,
  subsystemsById,
}: MilestoneKanbanBoardProps) {
  const milestonesByType = MILESTONE_BOARD_TYPES.reduce(
    (grouped, type) => {
      grouped[type] = [];
      return grouped;
    },
    {} as Record<(typeof MILESTONE_BOARD_TYPES)[number], MilestoneRecord[]>,
  );

  milestones.forEach((milestone) => {
    const type = getMilestoneBoardType(milestone);
    milestonesByType[type].push(milestone);
  });

  return (
    <KanbanColumns
      boardClassName="task-queue-board"
      columnBodyClassName="task-queue-board-column-body"
      columnClassName="task-queue-board-column"
      columnCountClassName="task-queue-board-column-count"
      columnEmptyClassName="task-queue-board-column-empty"
      columnHeaderClassName="task-queue-board-column-header"
      columns={MILESTONE_BOARD_TYPES.map((type) => {
        const milestoneStyle = getMilestoneTypeStyle(type);

        return {
          state: type,
          count: milestonesByType[type].length,
          header: (
            <span
              className="pill status-pill milestone-type-pill"
              style={
                {
                  "--milestone-type-chip-bg": milestoneStyle.chipBackground,
                  "--milestone-type-chip-border": milestoneStyle.columnBorder,
                  "--milestone-type-chip-text": milestoneStyle.chipText,
                  "--milestone-type-chip-bg-dark": milestoneStyle.darkChipBackground,
                  "--milestone-type-chip-border-dark": milestoneStyle.darkColumnBorder,
                  "--milestone-type-chip-text-dark": milestoneStyle.darkChipText,
                } as CSSProperties
              }
            >
              {milestoneStyle.label}
            </span>
          ),
        };
      })}
      emptyLabel="No milestones"
      itemsByState={milestonesByType}
      renderItem={(milestone) => {
        const milestoneStyle = getMilestoneTypeStyle(milestone.type);
        const relatedSubsystems = milestone.relatedSubsystemIds
          .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "Unknown subsystem")
          .join(", ");

        return (
          <button
            className="task-queue-board-card editable-hover-target editable-hover-target-row"
            data-tutorial-target="edit-milestone-row"
            key={milestone.id}
            onClick={() => onOpenMilestone(milestone)}
            type="button"
          >
            <div className="task-queue-board-card-header">
              <strong>{milestone.title}</strong>
              <span className="task-queue-board-card-due">
                Start {formatMilestoneDateTime(milestone.startDateTime)}
              </span>
            </div>
            <small className="task-queue-board-card-summary">
              {milestone.description.trim() || "No description"}
            </small>
            <div className="task-queue-board-card-meta">
              <span className="task-queue-board-card-context-chip" title={projectLabelByMilestoneId[milestone.id] ?? "All projects"}>
                {projectLabelByMilestoneId[milestone.id] ?? "All projects"}
              </span>
              <div className="task-queue-board-card-meta-person-group">
                <span
                  className="pill status-pill milestone-type-pill"
                  style={
                    {
                      "--milestone-type-chip-bg": milestoneStyle.chipBackground,
                      "--milestone-type-chip-border": milestoneStyle.columnBorder,
                      "--milestone-type-chip-text": milestoneStyle.chipText,
                      "--milestone-type-chip-bg-dark": milestoneStyle.darkChipBackground,
                      "--milestone-type-chip-border-dark": milestoneStyle.darkColumnBorder,
                      "--milestone-type-chip-text-dark": milestoneStyle.darkChipText,
                    } as CSSProperties
                  }
                >
                  {milestoneStyle.label}
                </span>
              </div>
            </div>
            <small className="task-queue-board-card-summary">
              End {milestone.endDateTime ? formatMilestoneDateTime(milestone.endDateTime) : "No end"}
              {relatedSubsystems.length > 0 ? ` · ${relatedSubsystems}` : ""}
            </small>
            <EditableHoverIndicator className="task-queue-board-card-hover" />
          </button>
        );
      }}
    />
  );
}

