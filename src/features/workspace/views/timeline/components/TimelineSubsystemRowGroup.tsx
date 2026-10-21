import type { TimelineTaskPresentation } from "../model/timelineTaskPresentation";
import React from "react";
import type { TaskRecord } from "@/types/recordsExecution";
import { TimelineGridDaySlots } from "../TimelineGridDaySlots";
import { TimelineSubsystemHeaderCell } from "./TimelineSubsystemHeaderCell";
import { TimelineTaskTrackRowList } from "./TimelineTaskTrackRowList";

import type { TimelineDayHeaderCell, TimelineSubsystemRow } from "../timelineViewModel";

interface TimelineSubsystemRowGroupProps {
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  collapsedSubsystems: Record<string, boolean>;
  firstDayGridColumn: number;
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
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  subsystem: TimelineSubsystemRow;
  subsystemColumnIndex: number;
  subsystemStickyLeft: number;
  taskPresentationsById: Record<string, TimelineTaskPresentation>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  toggleSubsystem: (id: string) => void;
  gridAutoRows?: string;
  rowStyle?: React.CSSProperties;
}

export const TimelineSubsystemRowGroup: React.FC<TimelineSubsystemRowGroupProps> = ({
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  collapsedSubsystems,
  firstDayGridColumn,
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
  taskColumnIndex,
  taskColumnWidth,
  taskStickyLeft,
  gridAutoRows,
  rowStyle,
  subsystem,
  subsystemColumnIndex,
  subsystemStickyLeft,
  taskPresentationsById,
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
          clearHoveredTaskRow={clearHoveredTaskRow}
          firstDayGridColumn={firstDayGridColumn}
          hoveredTaskId={hoveredTaskId}
          hoverTaskRow={hoverTaskRow}
          mode="subsystem-collapsed"
          onExpandGroup={() => toggleSubsystem(subsystem.id)}
          onCollapsedRowMouseEnter={() => hoverSubsystemRow(subsystem.id)}
          onCollapsedRowMouseLeave={clearHoveredSubsystemRow}
          onOpenTask={openTaskDetailModal}
          ownerId={subsystem.id}
          rowStart={rowIndex}
          selectedTaskId={selectedTaskId}
          taskColumnIndex={taskColumnIndex}
          taskColumnWidth={taskColumnWidth}
          taskStickyLeft={taskStickyLeft}
          taskPresentationsById={taskPresentationsById}
          tasks={subsystem.tasks}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

      {!collapsed && subsystem.tasks.length > 0 ? (
        <TimelineTaskTrackRowList
          clearHoveredTaskRow={clearHoveredTaskRow}
          firstDayGridColumn={firstDayGridColumn}
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
          taskColumnIndex={taskColumnIndex}
          taskColumnWidth={taskColumnWidth}
          taskStickyLeft={taskStickyLeft}
          taskPresentationsById={taskPresentationsById}
          tasks={subsystem.tasks}
          timelineDayHeaderCells={timelineDayHeaderCells}
        />
      ) : null}

      {!collapsed && subsystem.tasks.length === 0 ? (
        <TimelineGridDaySlots
          firstDayGridColumn={firstDayGridColumn}
          gridRow={rowIndex}
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
