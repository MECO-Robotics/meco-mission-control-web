import React from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { TimelineTaskTrackRow } from "./TimelineTaskTrackRow";
import { buildTimelineTaskToneStyle } from "../timelineTaskColors";
import type { TimelineDayHeaderCell, TimelineTaskSpan } from "../timelineViewModel";
import type {
  TimelineTaskDependencyCounts,
  TimelineTaskStatusSignal,
} from "../timelineGridBodyUtils";

type TimelineTaskTrackRowListMode = "project-collapsed" | "subsystem-collapsed" | "subsystem-expanded";

interface TimelineTaskTrackRowListProps {
  clearHoveredMilestonePopup: () => void;
  clearHoveredTaskRow: () => void;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  hoveredTaskId?: string | null;
  hoverTaskRow: (id: string) => void;
  mode: TimelineTaskTrackRowListMode;
  onOpenTask: (task: TaskRecord) => void;
  onCollapsedRowMouseEnter?: () => void;
  onCollapsedRowMouseLeave?: () => void;
  onExpandedRowMouseEnter?: (task: TimelineTaskSpan) => void;
  onExpandedRowMouseLeave?: () => void;
  onSelectTaskRow?: (task: TimelineTaskSpan) => void;
  ownerId: string;
  rowStart: number;
  selectedTaskId?: string | null;
  showTopBorderForExpandedRows?: boolean;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  taskDependencyCountsById: Record<string, TimelineTaskDependencyCounts>;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  tasks: TimelineTaskSpan[];
  timelineDayHeaderCells: TimelineDayHeaderCell[];
}

export const TimelineTaskTrackRowList: React.FC<TimelineTaskTrackRowListProps> = ({
  clearHoveredMilestonePopup,
  clearHoveredTaskRow,
  disciplinesById,
  firstDayGridColumn,
  handleTimelineDayMouseEnter,
  hoveredTaskId,
  hoverTaskRow,
  mode,
  onOpenTask,
  onCollapsedRowMouseEnter,
  onCollapsedRowMouseLeave,
  onExpandedRowMouseEnter,
  onExpandedRowMouseLeave,
  onSelectTaskRow,
  ownerId,
  rowStart,
  selectedTaskId,
  showTopBorderForExpandedRows = false,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
  taskDependencyCountsById,
  taskStatusSignalsById,
  tasks,
  timelineDayHeaderCells,
}) => {
  const isCollapsed = mode !== "subsystem-expanded";
  const buildTaskBarStyle = (task: TimelineTaskSpan, index: number) => {
    if (mode === "subsystem-expanded") {
        return buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
          gridRow: rowStart + index,
          gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
          margin: 0,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 10018,
          borderRadius: "4px",
              border: "none",
              color: "#fff",
              fontSize: "0.7rem",
              textAlign: "left",
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          alignSelf: "center",
          minWidth: 0,
        });
    }

    return buildTimelineTaskToneStyle(task.disciplineId, disciplinesById, {
      gridRow: rowStart,
      gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
          height: "8px",
          margin: 0,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 10018,
          borderRadius: "2px",
      border: "none",
      cursor: "pointer",
      alignSelf: "center",
      minWidth: 0,
      opacity: 0.7,
    });
  };

  return (
    <>
      {tasks.map((task, index) => {
        const showDaySlots = isCollapsed ? index === 0 : true;
        const rowKey =
          mode === "project-collapsed"
            ? `project-${ownerId}-${index === 0 ? "collapsed" : `task-${task.id}`}`
            : mode === "subsystem-collapsed"
              ? `subsystem-${ownerId}-${index === 0 ? "collapsed" : `task-${task.id}`}`
              : `subsystem-${ownerId}-task-${task.id}`;
        const gridRow = isCollapsed ? rowStart : rowStart + index;

        return (
          <TimelineTaskTrackRow
            key={task.id}
            clearHoveredMilestonePopup={clearHoveredMilestonePopup}
            clearHoveredTaskRow={clearHoveredTaskRow}
            firstDayGridColumn={firstDayGridColumn}
            gridRow={gridRow}
            handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
            hoveredTaskId={hoveredTaskId}
            hoverTaskRow={hoverTaskRow}
            includeTopBorder={showTopBorderForExpandedRows && !isCollapsed ? gridRow > 1 : false}
            onOpenTask={onOpenTask}
            onRowClick={mode === "subsystem-expanded" ? () => onSelectTaskRow?.(task) : undefined}
            onRowMouseEnter={
              mode === "subsystem-collapsed" && index === 0
                ? onCollapsedRowMouseEnter
                : mode === "subsystem-expanded"
                  ? () => onExpandedRowMouseEnter?.(task)
                  : undefined
            }
            onRowMouseLeave={
              mode === "subsystem-collapsed" && index === 0
                ? onCollapsedRowMouseLeave
                : mode === "subsystem-expanded"
                  ? onExpandedRowMouseLeave
                  : undefined
            }
            rowKey={rowKey}
            selectedTaskId={selectedTaskId}
            showDaySlots={showDaySlots}
            statusIconColumnIndex={statusIconColumnIndex}
            statusIconColumnWidth={statusIconColumnWidth}
            statusIconStickyRight={statusIconStickyRight}
            task={task}
            taskBarStyle={buildTaskBarStyle(task, index)}
            taskDependencyCounts={taskDependencyCountsById[task.id] ?? { incoming: 0, outgoing: 0 }}
            taskStatusSignalsById={taskStatusSignalsById}
            timelineDayHeaderCells={timelineDayHeaderCells}
            title={mode === "subsystem-expanded" ? `View details for ${task.title}` : `${task.title} (${task.status})`}
            ownerId={ownerId}
            spillsLeft={task.spillsLeft}
            spillsRight={task.spillsRight}
          />
        );
      })}
    </>
  );
};
