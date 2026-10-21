import type { CSSProperties } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { TimelineTaskStatusSignal } from "../timelineGridBodyUtils";

type TimelineStyle = CSSProperties & Record<string, string | number | undefined>;
export const TIMELINE_STATUS_TONES: Record<TimelineTaskStatusSignal, string> = {
  "not-started": "neutral", "in-progress": "warning", "waiting-for-qa": "info",
  complete: "success", blocked: "danger", "waiting-on-dependency": "warning",
};
function highlightStyle(extras?: TimelineStyle): CSSProperties {
  return {
    "--timeline-row-highlight-selected-fill": "color-mix(in srgb, var(--meco-blue) 12%, transparent)",
    "--timeline-row-highlight-hover-fill": "color-mix(in srgb, var(--meco-blue) 6%, transparent)",
    "--timeline-row-highlight-selected-stroke": "var(--text-accent)",
    "--timeline-row-highlight-hover-stroke": "transparent", ...extras,
  } as CSSProperties;
}
export function buildTimelineSubsystemHighlightStyle(_color: string | null | undefined, extras?: TimelineStyle) {
  return highlightStyle(extras);
}
export function resolveTimelineRowHighlightStyle(
  anchorKey: string, tasksById: Record<string, TaskRecord>,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  const exists = anchorKey.startsWith("task:") ? tasksById[anchorKey.slice(5)] : subsystemsById[anchorKey.slice(10)];
  return exists ? highlightStyle() : null;
}
export function buildTimelineTaskToneStyle(signal: TimelineTaskStatusSignal, extras?: TimelineStyle) {
  const tone = TIMELINE_STATUS_TONES[signal];
  return highlightStyle({
    "--timeline-task-bar-background": `var(--status-${tone}-bg)`,
    "--timeline-task-bar-text-color": `var(--status-${tone}-text)`, ...extras,
  });
}
