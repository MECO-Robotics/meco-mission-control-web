import { getTimelineDayTrackSize, getTimelineGridMinWidth } from "@/features/workspace/shared/timeline";

export const PROJECT_COLUMN_WIDTH = 112;
export const SUBSYSTEM_COLUMN_WIDTH = 128;
export const STATUS_ICON_COLUMN_WIDTH = 0;

export interface TimelineGridLayout {
  fixedTimelineColumnWidth: number;
  firstDayGridColumn: number;
  gridMinWidth: number;
  hasProjectColumn: boolean;
  projectColumnWidth: number;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  statusIconColumnIndex: number;
  statusIconColumnWidth: number;
  statusIconStickyRight: number;
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
  timelineZoom,
  viewInterval,
}: {
  dayCount: number;
  isAllProjectsView: boolean;
  isProjectColumnVisible: boolean;
  isSubsystemColumnVisible: boolean;
  timelineZoom: number;
  viewInterval: "all" | "month" | "week";
}): TimelineGridLayout {
  const hasProjectColumn = isAllProjectsView;
  const showProjectCol = hasProjectColumn && isProjectColumnVisible;
  const showSubsystemCol = isSubsystemColumnVisible;
  const projectColumnWidth = hasProjectColumn && showProjectCol ? PROJECT_COLUMN_WIDTH : 0;
  const subsystemColumnWidth = showSubsystemCol ? SUBSYSTEM_COLUMN_WIDTH : 0;
  const subsystemColumnIndex = hasProjectColumn ? 2 : 1;
  const firstDayGridColumn = hasProjectColumn ? 3 : 2;
  const statusIconColumnIndex = firstDayGridColumn + Math.max(0, dayCount - 1);
  const fixedTimelineColumnWidth = projectColumnWidth + subsystemColumnWidth;
  const statusIconStickyRight = 0;
  const subsystemStickyLeft = hasProjectColumn ? projectColumnWidth : 0;
  const dayTrackSize = getTimelineDayTrackSize(viewInterval, timelineZoom, fixedTimelineColumnWidth);
  const timelineGridTemplate = `${hasProjectColumn ? `${projectColumnWidth}px ` : ""}${subsystemColumnWidth}px repeat(${dayCount}, ${dayTrackSize})`;
  const gridMinWidth = getTimelineGridMinWidth({
    dayCount,
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    taskColumnWidth: STATUS_ICON_COLUMN_WIDTH,
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
    statusIconColumnIndex,
    statusIconColumnWidth: STATUS_ICON_COLUMN_WIDTH,
    statusIconStickyRight,
    subsystemColumnIndex,
    subsystemColumnWidth,
    subsystemStickyLeft,
    timelineGridTemplate,
  };
}

