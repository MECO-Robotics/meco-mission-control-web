import type { CSSProperties } from "react";
import type { TimelineTaskStatusSignal } from "../timelineGridBodyUtils";
export const TIMELINE_STATUS_TONES: Record<TimelineTaskStatusSignal, string> = {
  "not-started": "neutral", "in-progress": "warning", "waiting-for-qa": "info",
  complete: "success", blocked: "danger", "waiting-on-dependency": "warning",
};
export function buildTimelineTaskToneStyle(signal: TimelineTaskStatusSignal): CSSProperties {
  const tone = TIMELINE_STATUS_TONES[signal];
  return {
    "--timeline-task-bar-background": `var(--status-${tone}-bg)`,
    "--timeline-task-bar-text-color": `var(--status-${tone}-text)`,
  } as CSSProperties;
}
