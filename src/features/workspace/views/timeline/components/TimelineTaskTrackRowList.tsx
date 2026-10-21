import type { TaskRecord } from "@/types/recordsExecution";
import { TimelineTaskTrackRow } from "./TimelineTaskTrackRow";
import { TimelineGroupSummary } from "./TimelineGroupSummary";
import { buildTimelineTaskToneStyle } from "../model/timelineTaskColors";
import type { TimelineTaskPresentation } from "../model/timelineTaskPresentation";
import type { TimelineDayHeaderCell, TimelineTaskSpan } from "../timelineViewModel";

interface TimelineTaskTrackRowListProps {
  clearHoveredTaskRow: () => void;
  firstDayGridColumn: number;
  hoveredTaskId?: string | null;
  hoverTaskRow: (id: string) => void;
  mode: "project-collapsed" | "subsystem-collapsed" | "subsystem-expanded";
  onExpandGroup?: () => void;
  onCollapsedRowMouseEnter?: () => void;
  onCollapsedRowMouseLeave?: () => void;
  onExpandedRowMouseEnter?: (task: TimelineTaskSpan) => void;
  onExpandedRowMouseLeave?: () => void;
  onSelectTaskRow?: (task: TimelineTaskSpan) => void;
  onOpenTask: (task: TaskRecord) => void;
  ownerId: string;
  rowStart: number;
  selectedTaskId?: string | null;
  showTopBorderForExpandedRows?: boolean;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  taskPresentationsById: Record<string, TimelineTaskPresentation>;
  tasks: TimelineTaskSpan[];
  timelineDayHeaderCells: TimelineDayHeaderCell[];
}
export function TimelineTaskTrackRowList({
  tasks, mode, onExpandGroup, rowStart, taskPresentationsById, firstDayGridColumn,
  onCollapsedRowMouseEnter, onCollapsedRowMouseLeave,
  onExpandedRowMouseEnter, onExpandedRowMouseLeave, onSelectTaskRow,
  showTopBorderForExpandedRows, ...props
}: TimelineTaskTrackRowListProps) {
  if (mode !== "subsystem-expanded") return <TimelineGroupSummary
    tasks={tasks} presentations={taskPresentationsById} gridRow={rowStart}
    firstDayGridColumn={firstDayGridColumn} taskColumnIndex={props.taskColumnIndex}
    taskColumnWidth={props.taskColumnWidth} taskStickyLeft={props.taskStickyLeft}
    onExpand={onExpandGroup} onMouseEnter={onCollapsedRowMouseEnter} onMouseLeave={onCollapsedRowMouseLeave} />;
  return tasks.map((task, index) => {
    const presentation = taskPresentationsById[task.id];
    const gridRow = rowStart + index;
    return <TimelineTaskTrackRow {...props} key={`${props.ownerId}-${task.id}`}
      firstDayGridColumn={firstDayGridColumn} gridRow={gridRow}
      rowKey={`task-${props.ownerId}-${task.id}`} task={task} presentation={presentation}
      includeTopBorder={showTopBorderForExpandedRows && index > 0}
      onRowClick={() => onSelectTaskRow?.(task)}
      onRowMouseEnter={() => onExpandedRowMouseEnter?.(task)} onRowMouseLeave={onExpandedRowMouseLeave}
      taskBarStyle={buildTimelineTaskToneStyle(presentation.signal, {
        gridRow, gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
        borderRadius: "4px", alignSelf: "center",
      })}
      timelineDayHeaderCells={props.timelineDayHeaderCells}
      title={presentation.description} spillsLeft={task.spillsLeft} spillsRight={task.spillsRight} />;
  });
}
