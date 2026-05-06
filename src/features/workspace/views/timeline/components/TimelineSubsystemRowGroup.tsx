import React from "react";
import type { BootstrapPayload, TaskRecord } from "@/types";
import { TimelineGridDaySlots } from "../TimelineGridDaySlots";
import { TimelineSubsystemHeaderCell } from "./TimelineSubsystemHeaderCell";
import { TimelineTaskTrackRowList } from "./TimelineTaskTrackRowList";
import type {
  TimelineTaskDependencyCounts,
  TimelineTaskStatusSignal,
} from "../timelineGridBodyUtils";
import type { TimelineDayHeaderCell, TimelineSubsystemRow } from "../timelineViewModel";

interface TimelineSubsystemRowGroupProps {
  clearHoveredMilestonePopup: () => void;
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  collapsedSubsystems: Record<string, boolean>;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  firstDayGridColumn: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  hoveredSubsystemId: string | null;
  hoveredTaskId?: string | null;
  hoverSubsystemRow: (id: string) => void;
  hoverTaskRow: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  rowBackground: string;
  rowIndex: number;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  selectedSubsystemId: string | null;
  selectedTaskId?: string | null;
  showSubsystemCol: boolean;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemStickyLeft: number;
  taskDependencyCountsById: Record<string, TimelineTaskDependencyCounts>;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  toggleSubsystem: (id: string) => void;
  gridAutoRows?: string;
  rowStyle?: React.CSSProperties;
}

export const TimelineSubsystemRowGroup: React.FC<TimelineSubsystemRowGroupProps> = ({
  clearHoveredMilestonePopup,
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  collapsedSubsystems,
  disciplinesById,
  firstDayGridColumn,
  handleTimelineDayMouseEnter,
  hoveredSubsystemId,
  hoveredTaskId,
  hoverSubsystemRow,
  hoverTaskRow,
  openTaskDetailModal,
  rowBackground,
  rowIndex,
  selectSubsystemRow,
  selectTaskRow,
  selectedSubsystemId,
  selectedTaskId,
  showSubsystemCol,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
  gridAutoRows,
  rowStyle,
  subsystem,
  subsystemColumnIndex,
  subsystemStickyLeft,
  taskDependencyCountsById,
  taskStatusSignalsById,
  timelineDayHeaderCells,
  toggleSubsystem,
}) => {
  const canToggleSubsystem = subsystem.tasks.length > 1;
  const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
  const taskCount = Math.max(1, subsystem.tasks.length);
  const accentColor = subsystem.color;
  const isSubsystemHovered = hoveredSubsystemId === subsystem.id;
  const isSubsystemSelected = selectedSubsystemId === subsystem.id;

  return (
      <div
      className="subsystem-group"
      style={{
        display: "contents",
        ...(gridAutoRows ? { gridAutoRows } : null),
        ...rowStyle,
      }}
      key={subsystem.id}
    >
      <div
        aria-hidden="true"
        className="timeline-row-highlight-anchor"
        data-timeline-row-anchor={`subsystem:${subsystem.id}`}
        style={{
          gridRow: collapsed ? `${rowIndex}` : `${rowIndex} / span ${taskCount}`,
          gridColumn: `${firstDayGridColumn} / -1`,
        }}
      />
      {showSubsystemCol ? (
        <TimelineSubsystemHeaderCell
          accentColor={accentColor}
          canToggleSubsystem={canToggleSubsystem}
          collapsed={collapsed}
          isSubsystemHovered={isSubsystemHovered}
          isSubsystemSelected={isSubsystemSelected}
          onHover={() => hoverSubsystemRow(subsystem.id)}
          onHoverLeave={clearHoveredSubsystemRow}
          onSelect={() => selectSubsystemRow(subsystem.id)}
          rowIndex={rowIndex}
          rowBackground={rowBackground}
          subsystem={subsystem}
          subsystemColumnIndex={subsystemColumnIndex}
          subsystemStickyLeft={subsystemStickyLeft}
          taskCount={taskCount}
          toggleSubsystem={toggleSubsystem}
        />
      ) : null}

      {collapsed && subsystem.tasks.length > 0 ? (
        <TimelineTaskTrackRowList
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          clearHoveredTaskRow={clearHoveredTaskRow}
          disciplinesById={disciplinesById}
          firstDayGridColumn={firstDayGridColumn}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          hoveredTaskId={hoveredTaskId}
          hoverTaskRow={hoverTaskRow}
          mode="subsystem-collapsed"
          onCollapsedRowMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onCollapsedRowMouseLeave={clearHoveredSubsystemRow}
          onOpenTask={openTaskDetailModal}
          ownerId={subsystem.id}
          rowStart={rowIndex}
          selectedTaskId={selectedTaskId}
          statusIconColumnIndex={statusIconColumnIndex}
          statusIconColumnWidth={statusIconColumnWidth}
          statusIconStickyRight={statusIconStickyRight}
          taskDependencyCountsById={taskDependencyCountsById}
          taskStatusSignalsById={taskStatusSignalsById}
          tasks={subsystem.tasks}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

      {!collapsed && subsystem.tasks.length > 0 ? (
        <TimelineTaskTrackRowList
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          clearHoveredTaskRow={clearHoveredTaskRow}
          disciplinesById={disciplinesById}
          firstDayGridColumn={firstDayGridColumn}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          hoveredTaskId={hoveredTaskId}
          hoverTaskRow={hoverTaskRow}
          mode="subsystem-expanded"
          onExpandedRowMouseEnter={() => {
            clearHoveredTaskRow();
            hoverSubsystemRow(subsystem.id);
          }}
          onExpandedRowMouseLeave={clearHoveredSubsystemRow}
          onOpenTask={openTaskDetailModal}
          onSelectTaskRow={selectTaskRow}
          ownerId={subsystem.id}
          rowStart={rowIndex}
          selectedTaskId={selectedTaskId}
          showTopBorderForExpandedRows
          statusIconColumnIndex={statusIconColumnIndex}
          statusIconColumnWidth={statusIconColumnWidth}
          statusIconStickyRight={statusIconStickyRight}
          taskDependencyCountsById={taskDependencyCountsById}
          taskStatusSignalsById={taskStatusSignalsById}
          tasks={subsystem.tasks}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

      {!collapsed && subsystem.tasks.length === 0 ? (
        <TimelineGridDaySlots
          clearHoveredMilestonePopup={clearHoveredMilestonePopup}
          firstDayGridColumn={firstDayGridColumn}
          gridRow={rowIndex}
          handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
          includeTopBorder={rowIndex > 1}
          onRowMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onRowMouseLeave={clearHoveredSubsystemRow}
          rowKey={`subsystem-${subsystem.id}-empty`}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}
    </div>
  );
};
