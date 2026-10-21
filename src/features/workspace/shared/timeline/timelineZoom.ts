import type { TimelineViewInterval } from "./timelineDateUtils";

const TIMELINE_BASE_DAY_WIDTHS: Record<TimelineViewInterval, number> = {
  all: 44,
  week: 44,
  month: 28,
};

export const TIMELINE_ZOOM_MIN = 0.6;
export const TIMELINE_ZOOM_MAX = 2.0;
export const TIMELINE_ZOOM_STEP = 0.2;

export function clampTimelineZoom(value: number, minZoom = TIMELINE_ZOOM_MIN) {
  const normalizedValue = Math.round(value * 10) / 10;
  const normalizedMinZoom = Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, minZoom));
  return Math.min(TIMELINE_ZOOM_MAX, Math.max(normalizedMinZoom, normalizedValue));
}

export function formatTimelineZoomLabel(zoom: number) {
  return `${Math.round(zoom * 100)}%`;
}

export function getTimelineMinimumZoomForWidth({
  dayCount,
  fixedColumnWidth,
  shellWidth,
  viewInterval,
}: {
  dayCount: number;
  fixedColumnWidth: number;
  shellWidth: number;
  viewInterval: TimelineViewInterval;
}) {
  if (dayCount <= 0 || shellWidth <= 0) {
    return TIMELINE_ZOOM_MIN;
  }

  const dayWidth = TIMELINE_BASE_DAY_WIDTHS[viewInterval];
  const availableDayWidth = shellWidth - fixedColumnWidth;
  if (availableDayWidth <= 0) {
    return TIMELINE_ZOOM_MIN;
  }

  const fitZoom = availableDayWidth / (dayCount * dayWidth);
  const normalizedFitZoom = Math.ceil(fitZoom * 10) / 10;
  return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, normalizedFitZoom));
}

export function getTimelineDayTrackSize(
  viewInterval: TimelineViewInterval,
  zoom: number,
) {
  const minimumDayWidth = Math.round(TIMELINE_BASE_DAY_WIDTHS[viewInterval] * zoom);
  if (viewInterval === "month") {
    return `minmax(${minimumDayWidth}px, 1fr)`;
  }

  if (viewInterval === "week") {
    return `minmax(${minimumDayWidth}px, 1fr)`;
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
  const minimumDayWidth = Math.round(TIMELINE_BASE_DAY_WIDTHS[viewInterval] * zoom);
  return (
    (hasProjectColumn ? projectColumnWidth : 0) +
    subsystemColumnWidth +
    taskColumnWidth +
    dayCount * minimumDayWidth
  );
}
