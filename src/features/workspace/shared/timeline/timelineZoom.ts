export const TIMELINE_ZOOM_MIN = 1;
export const TIMELINE_ZOOM_MAX = 4;
export const TIMELINE_ZOOM_STEP = 0.25;

export function clampTimelineZoom(value: number) {
  return Math.min(TIMELINE_ZOOM_MAX, Math.max(TIMELINE_ZOOM_MIN, Math.round(value * 100) / 100));
}

export function formatTimelineZoomLabel(zoom: number) {
  return `${Math.round(zoom * 100)}%`;
}
