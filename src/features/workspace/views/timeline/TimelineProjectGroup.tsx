import React from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { TimelineProjectHeaderCell } from "./components/TimelineProjectHeaderCell";
import { TimelineProjectSummaryCell } from "./components/TimelineProjectSummaryCell";
import { TimelineSubsystemRowGroup } from "./components/TimelineSubsystemRowGroup";
import { TimelineTaskTrackRowList } from "./components/TimelineTaskTrackRowList";
import { buildTimelineSubsystemHighlightStyle } from "./model/timelineTaskColors";
import {
  type TimelineTaskDependencyCounts,
  type TimelineTaskStatusSignal,
} from "./timelineGridBodyUtils";
import type { TimelineDayHeaderCell, TimelineProjectRow } from "./timelineViewModel";

interface TimelineProjectGroupProps {
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  clearHoveredMilestonePopup: () => void;
  collapsedProjects: Record<string, boolean>;
  collapsedSubsystems: Record<string, boolean>;
  workTypesById: Record<string, BootstrapPayload["workTypes"][number]>;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  hoveredSubsystemId: string | null;
  hoveredTaskId?: string | null;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  project: TimelineProjectRow;
  projectIndex: number;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  selectedSubsystemId: string | null;
  selectedTaskId?: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystemColumnIndex: number;
  subsystemStickyLeft: number;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
  taskDependencyCountsById: Record<string, TimelineTaskDependencyCounts>;
  taskStatusSignalsById: Record<string, TimelineTaskStatusSignal>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineGridTemplate: string;
  toggleProject: (id: string) => void;
  toggleSubsystem: (id: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
}

export const TimelineProjectGroup: React.FC<TimelineProjectGroupProps> = ({
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  clearHoveredMilestonePopup,
  collapsedProjects,
  collapsedSubsystems,
  workTypesById,
  firstDayGridColumn,
  gridMinWidth,
  handleTimelineDayMouseEnter,
  hoveredSubsystemId,
  hoveredTaskId,
  hoverTaskRow,
  hoverSubsystemRow,
  project,
  projectIndex,
  selectSubsystemRow,
  selectTaskRow,
  selectedSubsystemId,
  selectedTaskId,
  showProjectCol,
  showSubsystemCol,
  subsystemColumnIndex,
  subsystemStickyLeft,
  statusIconColumnIndex,
  statusIconColumnWidth,
  statusIconStickyRight,
  taskDependencyCountsById,
  taskStatusSignalsById,
  timelineDayHeaderCells,
  timelineGridTemplate,
  toggleProject,
  toggleSubsystem,
  openTaskDetailModal,
}) => {
  const projectCollapsed = collapsedProjects[project.id] ?? false;
  const projectRowCount = projectCollapsed
    ? 1
    : project.subsystems.reduce((total, subsystem) => {
        const subsystemCollapsed = collapsedSubsystems[subsystem.id] ?? false;
        return total + (subsystemCollapsed ? 1 : Math.max(1, subsystem.tasks.length));
      }, 0);
  const collapsedSummarySpan = showSubsystemCol ? 1 : 0;
  const collapsedSummaryStart = subsystemColumnIndex;
  const collapsedSummaryStickyLeft = subsystemStickyLeft;
  const projectBackground = projectIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
  return (
    <div
      className="subsystem-group"
      style={{
        display: "grid",
        width: "100%",
        minWidth: `${gridMinWidth}px`,
        gridTemplateColumns: timelineGridTemplate,
        gridAutoRows: "38px",
        background: projectBackground,
        borderBottom: "1px solid var(--border-base)",
        position: "relative",
      }}
      data-row-motion={undefined}
      data-timeline-row={`project:${project.id}`}
    >
      {showProjectCol ? (
        <TimelineProjectHeaderCell
          project={project}
          projectBackground={projectBackground}
          projectCollapsed={projectCollapsed}
          projectRowCount={projectRowCount}
          toggleProject={toggleProject}
        />
      ) : null}

      {projectCollapsed ? (
        <>
          <TimelineProjectSummaryCell
            collapsedSummarySpan={collapsedSummarySpan}
            collapsedSummaryStart={collapsedSummaryStart}
            collapsedSummaryStickyLeft={collapsedSummaryStickyLeft}
            project={project}
            projectBackground={projectBackground}
          />
          {project.tasks.length > 0 ? (
            <TimelineTaskTrackRowList
              clearHoveredMilestonePopup={clearHoveredMilestonePopup}
              clearHoveredTaskRow={clearHoveredTaskRow}
              workTypesById={workTypesById}
              firstDayGridColumn={firstDayGridColumn}
              handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
              hoveredTaskId={hoveredTaskId}
              hoverTaskRow={hoverTaskRow}
              mode="project-collapsed"
              onOpenTask={openTaskDetailModal}
              ownerId={project.id}
              rowStart={1}
              selectedTaskId={selectedTaskId}
              statusIconColumnIndex={statusIconColumnIndex}
              statusIconColumnWidth={statusIconColumnWidth}
              statusIconStickyRight={statusIconStickyRight}
              taskDependencyCountsById={taskDependencyCountsById}
              taskStatusSignalsById={taskStatusSignalsById}
              tasks={project.tasks}
              timelineDayHeaderCells={timelineDayHeaderCells}
            />
          ) : null}
        </>
      ) : (
        (() => {
          let rowCursor = 1;
          return project.subsystems.map((subsystem) => {
            const collapsed = subsystem.tasks.length > 1 ? collapsedSubsystems[subsystem.id] ?? false : false;
            const taskCount = Math.max(1, subsystem.tasks.length);
            const subsystemRowStart = rowCursor;
            const subsystemRowCount = collapsed ? 1 : taskCount;
            rowCursor += subsystemRowCount;
            const groupBackground =
              subsystem.index % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";
            const groupStyle = buildTimelineSubsystemHighlightStyle(subsystem.color, {
              boxShadow: `inset 3px 0 0 ${subsystem.color}`,
              gridAutoRows: "38px",
            });
            return (
              <TimelineSubsystemRowGroup
                key={subsystem.id}
                clearHoveredMilestonePopup={clearHoveredMilestonePopup}
                clearHoveredSubsystemRow={clearHoveredSubsystemRow}
                clearHoveredTaskRow={clearHoveredTaskRow}
                collapsedSubsystems={collapsedSubsystems}
                workTypesById={workTypesById}
                firstDayGridColumn={firstDayGridColumn}
                handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
                hoveredSubsystemId={hoveredSubsystemId}
                hoveredTaskId={hoveredTaskId}
                hoverSubsystemRow={hoverSubsystemRow}
                hoverTaskRow={hoverTaskRow}
                openTaskDetailModal={openTaskDetailModal}
                rowBackground={groupBackground}
                rowIndex={subsystemRowStart}
                selectSubsystemRow={selectSubsystemRow}
                selectTaskRow={selectTaskRow}
                selectedSubsystemId={selectedSubsystemId}
                selectedTaskId={selectedTaskId}
                showSubsystemCol={showSubsystemCol}
                statusIconColumnIndex={statusIconColumnIndex}
                statusIconColumnWidth={statusIconColumnWidth}
                statusIconStickyRight={statusIconStickyRight}
                subsystem={subsystem}
                subsystemColumnIndex={subsystemColumnIndex}
                subsystemStickyLeft={subsystemStickyLeft}
                rowStyle={groupStyle}
                taskDependencyCountsById={taskDependencyCountsById}
                taskStatusSignalsById={taskStatusSignalsById}
                timelineDayHeaderCells={timelineDayHeaderCells}
                toggleSubsystem={toggleSubsystem}
              />
            );
          });
        })()
      )}
    </div>
  );
};
