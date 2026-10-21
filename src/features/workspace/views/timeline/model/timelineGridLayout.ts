import { getTimelineDayTrackSize, getTimelineGridMinWidth } from "@/features/workspace/shared/timeline/timelineZoom";

export const PROJECT_COLUMN_WIDTH = 112;
export const SUBSYSTEM_COLUMN_WIDTH = 128;
export const TASK_COLUMN_WIDTH = 240;

export interface TimelineGridLayout {
  fixedTimelineColumnWidth: number;
  firstDayGridColumn: number;
  gridMinWidth: number;
  hasProjectColumn: boolean;
  projectColumnWidth: number;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  subsystemColumnIndex: number;
  subsystemColumnWidth: number;
  subsystemStickyLeft: number;
  timelineGridTemplate: string;
  dayTrackSize: string;
}

export function buildTimelineGridLayout({
  dayCount,
  isAllProjectsView,
  isProjectColumnVisible,
  isSubsystemColumnVisible,
  timelineShellWidth,
  timelineZoom,
  viewInterval,
}: {
  dayCount: number;
  isAllProjectsView: boolean;
  isProjectColumnVisible: boolean;
  isSubsystemColumnVisible: boolean;
  timelineShellWidth?: number;
  timelineZoom: number;
  viewInterval: "all" | "month" | "week";
}): TimelineGridLayout {
  const compact = Boolean(timelineShellWidth && timelineShellWidth < 640);
  const hasProjectColumn = isAllProjectsView;
  const showProjectCol = hasProjectColumn && isProjectColumnVisible;
  const showSubsystemCol = isSubsystemColumnVisible;
  const projectColumnWidth = hasProjectColumn && showProjectCol ? (compact ? 28 : PROJECT_COLUMN_WIDTH) : 0;
  const subsystemColumnWidth = showSubsystemCol ? (compact ? 28 : SUBSYSTEM_COLUMN_WIDTH) : 0;
  const taskColumnWidth = compact ? 172 : TASK_COLUMN_WIDTH;
  const subsystemColumnIndex = hasProjectColumn ? 2 : 1;
  const taskColumnIndex = hasProjectColumn ? 3 : 2;
  const firstDayGridColumn = taskColumnIndex + 1;
  const taskStickyLeft = projectColumnWidth + subsystemColumnWidth;
  const fixedTimelineColumnWidth = taskStickyLeft + taskColumnWidth;
  const subsystemStickyLeft = hasProjectColumn ? projectColumnWidth : 0;
  const dayTrackSize = getTimelineDayTrackSize(
    viewInterval,
    timelineZoom,
  );
  const timelineGridTemplate = `${hasProjectColumn ? `${projectColumnWidth}px ` : ""}${subsystemColumnWidth}px ${taskColumnWidth}px repeat(${dayCount}, ${dayTrackSize})`;
  const gridMinWidth = getTimelineGridMinWidth({
    dayCount,
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    taskColumnWidth,
    viewInterval,
    zoom: timelineZoom,
  });

  return {
    dayTrackSize,
    fixedTimelineColumnWidth,
    firstDayGridColumn,
    gridMinWidth,
    hasProjectColumn,
    projectColumnWidth,
    showProjectCol,
    showSubsystemCol,
    taskColumnIndex,
    taskColumnWidth,
    taskStickyLeft,
    subsystemColumnIndex,
    subsystemColumnWidth,
    subsystemStickyLeft,
    timelineGridTemplate,
  };
}
