import type { TimelineViewInterval } from "@/features/workspace/shared/timelineDateUtils";

const TIMELINE_BASE_DAY_WIDTHS: Record<TimelineViewInterval, number> = {
  all: 44,
  week: 44,
  month: 28,
};

export const TIMELINE_ZOOM_MIN = 0.8;
export const TIMELINE_ZOOM_MAX = 1.6;
export const TIMELINE_ZOOM_STEP = 0.2;

export function clampTimelineZoom(value: number) {
  const normalizedValue = Math.round(value * 10) / 10;
  return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, normalizedValue));
}

export function formatTimelineZoomLabel(zoom: number) {
  return `${Math.round(zoom * 100)}%`;
}

export function getTimelineDayTrackSize(
  viewInterval: TimelineViewInterval,
  zoom: number,
  fixedColumnWidth = 0,
) {
  const minimumDayWidth = Math.round(TIMELINE_BASE_DAY_WIDTHS[viewInterval] * zoom);
  if (viewInterval === "month") {
    return `minmax(${minimumDayWidth}px, 1fr)`;
  }

  if (viewInterval === "week") {
    return `minmax(calc((100vw - var(--shell-sidebar-width) - ${fixedColumnWidth}px) / 7 * ${zoom}), 1fr)`;
  }

  return `${minimumDayWidth}px`;
}

export function getTimelineGridMinWidth({
  hasProjectColumn,
  projectColumnWidth,
  subsystemColumnWidth,
  taskColumnWidth,
  dayCount,
  viewInterval,
  zoom,
}: {
  hasProjectColumn: boolean;
  projectColumnWidth: number;
  subsystemColumnWidth: number;
  taskColumnWidth: number;
  dayCount: number;
  viewInterval: TimelineViewInterval;
  zoom: number;
}) {
  if (viewInterval === "week") {
    return (
      (hasProjectColumn ? projectColumnWidth : 0) +
      subsystemColumnWidth +
      taskColumnWidth
    );
  }

  const minimumDayWidth = Math.round(TIMELINE_BASE_DAY_WIDTHS[viewInterval] * zoom);
  return (
    (hasProjectColumn ? projectColumnWidth : 0) +
    subsystemColumnWidth +
    taskColumnWidth +
    dayCount * minimumDayWidth
  );
}
