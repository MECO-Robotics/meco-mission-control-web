import type { MilestoneRecord } from "@/types/recordsExecution";
import React from "react";
import { buildTimelineTaskPresentations } from "./model/timelineTaskPresentation";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type {
  TimelineDayHeaderCell,
  TimelineMonthGroup,
  TimelineProjectRow,
  TimelineSubsystemRow,
} from "./timelineViewModel";
import type { TimelineGridMotion } from "./timelineGridTypes";
import { TimelineGridHeaderContent } from "./components/TimelineGridHeaderContent";
import { TimelineProjectGroup } from "./TimelineProjectGroup";
import { TimelineSubsystemGroup } from "./TimelineSubsystemGroup";

interface TimelineGridBodyProps {
  bootstrap: BootstrapPayload;
  collapsedProjects: Record<string, boolean>;
  collapsedSubsystems: Record<string, boolean>;
  onOpenMilestoneDetails: (milestone: MilestoneRecord) => void;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineZoomWheel: (milestone: React.WheelEvent<HTMLDivElement>) => void;
  hasProjectColumn: boolean;
  isScrolling: boolean;
  isWeekView: boolean;
  monthGroups: TimelineMonthGroup[];
  handleTimelineHeaderDayClick: (day: string) => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  projectColumnWidth: number;
  projectRows: TimelineProjectRow[];
  hoveredSubsystemId: string | null;
  hoveredTaskId: string | null;
  selectedSubsystemId: string | null;
  selectedTaskId: string | null;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystemColumnIndex: number;
  subsystemColumnWidth: number;
  subsystemRows: TimelineSubsystemRow[];
  subsystemStickyLeft: number;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineFilterMotionClass: string;
  timelineGridMotion: {
    direction: TimelineGridMotion | null;
    token: number;
  };
  timelineGridRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineGridTemplate: string;
  timelineZoom: number;
  timelineShellRef: React.MutableRefObject<HTMLDivElement | null>;
  clearHoveredSubsystemRow: () => void;
  clearHoveredTaskRow: () => void;
  hoverTaskRow: (id: string) => void;
  hoverSubsystemRow: (id: string) => void;
  selectSubsystemRow: (id: string) => void;
  selectTaskRow: (task: TaskRecord) => void;
  toggleProject: (id: string) => void;
  toggleProjectColumn: () => void;
  toggleSubsystem: (id: string) => void;
  toggleSubsystemColumn: () => void;
}

export const TimelineGridBody: React.FC<TimelineGridBodyProps> = ({
  bootstrap,
  collapsedProjects,
  collapsedSubsystems,
  firstDayGridColumn,
  onOpenMilestoneDetails,
  gridMinWidth,
  handleTimelineZoomWheel,
  hasProjectColumn,
  isScrolling,
  isWeekView,
  monthGroups,
  handleTimelineHeaderDayClick,
  openTaskDetailModal,
  projectColumnWidth,
  projectRows,
  hoveredSubsystemId,
  hoveredTaskId,
  selectedSubsystemId,
  selectedTaskId,
  showProjectCol,
  showSubsystemCol,
  subsystemColumnIndex,
  subsystemColumnWidth,
  subsystemRows,
  subsystemStickyLeft,
  taskColumnIndex,
  taskColumnWidth,
  taskStickyLeft,
  timelineDayCellRefs,
  timelineDayHeaderCells,
  timelineFilterMotionClass,
  timelineGridMotion,
  timelineGridRef,
  timelineGridTemplate,
  timelineZoom,
  timelineShellRef,
  clearHoveredSubsystemRow,
  clearHoveredTaskRow,
  hoverTaskRow,
  hoverSubsystemRow,
  selectSubsystemRow,
  selectTaskRow,
  toggleProject,
  toggleProjectColumn,
  toggleSubsystem,
  toggleSubsystemColumn,
}) => {
  const taskPresentationsById = React.useMemo(() => buildTimelineTaskPresentations(bootstrap), [bootstrap]);

  const rowChildren = hasProjectColumn
    ? projectRows.map((project, projectIndex) => (
        <TimelineProjectGroup
          collapsedProjects={collapsedProjects}
          collapsedSubsystems={collapsedSubsystems}
          firstDayGridColumn={firstDayGridColumn}
          gridMinWidth={gridMinWidth}
          key={project.id}
          openTaskDetailModal={openTaskDetailModal}
          project={project}
          projectIndex={projectIndex}
          hoveredSubsystemId={hoveredSubsystemId}
          hoveredTaskId={hoveredTaskId}
        selectedSubsystemId={selectedSubsystemId}
        selectedTaskId={selectedTaskId}
      taskColumnIndex={taskColumnIndex}
      taskColumnWidth={taskColumnWidth}
      taskStickyLeft={taskStickyLeft}
          clearHoveredSubsystemRow={clearHoveredSubsystemRow}
          clearHoveredTaskRow={clearHoveredTaskRow}
          hoverTaskRow={hoverTaskRow}
          hoverSubsystemRow={hoverSubsystemRow}
          selectSubsystemRow={selectSubsystemRow}
          selectTaskRow={selectTaskRow}
          showProjectCol={showProjectCol}
          showSubsystemCol={showSubsystemCol}
          subsystemColumnIndex={subsystemColumnIndex}
          subsystemStickyLeft={subsystemStickyLeft}
          taskPresentationsById={taskPresentationsById}
          timelineDayHeaderCells={timelineDayHeaderCells}
          timelineGridTemplate={timelineGridTemplate}
          toggleProject={toggleProject}
          toggleSubsystem={toggleSubsystem}
        />
      ))
    : subsystemRows.map((subsystem, subsystemIndex) => {
        return (
          <TimelineSubsystemGroup
            collapsedSubsystems={collapsedSubsystems}
            firstDayGridColumn={firstDayGridColumn}
            gridMinWidth={gridMinWidth}
            key={subsystem.id}
            openTaskDetailModal={openTaskDetailModal}
            hoveredSubsystemId={hoveredSubsystemId}
            hoveredTaskId={hoveredTaskId}
            selectedSubsystemId={selectedSubsystemId}
            selectedTaskId={selectedTaskId}
            clearHoveredSubsystemRow={clearHoveredSubsystemRow}
            clearHoveredTaskRow={clearHoveredTaskRow}
            hoverTaskRow={hoverTaskRow}
            hoverSubsystemRow={hoverSubsystemRow}
            selectSubsystemRow={selectSubsystemRow}
            selectTaskRow={selectTaskRow}
            showSubsystemCol={showSubsystemCol}
            subsystem={subsystem}
            subsystemColumnIndex={subsystemColumnIndex}
            subsystemIndex={subsystemIndex}
            subsystemStickyLeft={subsystemStickyLeft}
            rowIndex={1}
            taskColumnIndex={taskColumnIndex}
            taskColumnWidth={taskColumnWidth}
            taskStickyLeft={taskStickyLeft}
            taskPresentationsById={taskPresentationsById}
            timelineDayHeaderCells={timelineDayHeaderCells}
            timelineGridTemplate={timelineGridTemplate}
            toggleSubsystem={toggleSubsystem}
          />
        );
      });

  return (
      <TimelineGridHeaderContent
        onOpenMilestoneDetails={onOpenMilestoneDetails}
      firstDayGridColumn={firstDayGridColumn}
      gridMinWidth={gridMinWidth}
      handleTimelineZoomWheel={handleTimelineZoomWheel}
      hasProjectColumn={hasProjectColumn}
      isScrolling={isScrolling}
      isWeekView={isWeekView}
      monthGroups={monthGroups}
      handleTimelineHeaderDayClick={handleTimelineHeaderDayClick}
        projectColumnWidth={projectColumnWidth}
        showProjectCol={showProjectCol}
        showSubsystemCol={showSubsystemCol}
      subsystemColumnIndex={subsystemColumnIndex}
      subsystemColumnWidth={subsystemColumnWidth}
      subsystemStickyLeft={subsystemStickyLeft}
      timelineDayCellRefs={timelineDayCellRefs}
      timelineDayHeaderCells={timelineDayHeaderCells}
      timelineFilterMotionClass={timelineFilterMotionClass}
      timelineGridMotion={timelineGridMotion}
      timelineGridRef={timelineGridRef}
      timelineGridTemplate={timelineGridTemplate}
      timelineZoom={timelineZoom}
      timelineShellRef={timelineShellRef}
      toggleProjectColumn={toggleProjectColumn}
      toggleSubsystemColumn={toggleSubsystemColumn}
    >
      {rowChildren}
      </TimelineGridHeaderContent>
  );
};
