import type { CSSProperties } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { DisciplineCode } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";

type TimelineTaskToneExtras = CSSProperties & Record<string, string | number | undefined>;

const FALLBACK_TIMELINE_TASK_DISCIPLINE_COLOR = "#7a8799";
const FALLBACK_TIMELINE_SUBSYSTEM_HIGHLIGHT_COLOR = "#4F86C6";

const TIMELINE_TASK_DISCIPLINE_COLORS: Record<DisciplineCode, string> = {
  design: "#c67b1f",
  manufacturing: "#b86125",
  assembly: "#d1863d",
  electrical: "#c9a227",
  programming: "#6d5bd0",
  testing: "#b84f7a",
  planning: "#6a7f96",
  communications: "#2f8f83",
  finance: "#5d8c4a",
  research: "#4b7ca8",
  documentation: "#8c6b4d",
  engagement: "#b26d3b",
  presentation: "#a05fb8",
  media_production: "#d05b7f",
  partnerships: "#3a8a76",
  game_analysis: "#3e7cc7",
  scouting: "#3aa0b8",
  data_analysis: "#4f65b8",
  risk_review: "#8b5c4d",
  curriculum: "#5e8f6a",
  instruction: "#7d62c7",
  practice: "#3d9b7a",
  assessment: "#c16b4a",
  photography: "#a85c46",
  video: "#7a5be0",
  graphics: "#d45e8c",
  writing: "#6f7b91",
  web: "#2f8fa6",
  social_media: "#dd6f5a",
};

export function getTimelineTaskDisciplineColor(
  disciplineId: string | null,
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>,
) {
  if (!disciplineId) {
    return FALLBACK_TIMELINE_TASK_DISCIPLINE_COLOR;
  }

  const code = disciplinesById[disciplineId]?.code;
  return code ? TIMELINE_TASK_DISCIPLINE_COLORS[code] ?? FALLBACK_TIMELINE_TASK_DISCIPLINE_COLOR : FALLBACK_TIMELINE_TASK_DISCIPLINE_COLOR;
}

function buildTimelineHighlightStyle(
  accentColor: string,
  extras?: TimelineTaskToneExtras,
) {
  return {
    "--timeline-row-highlight-selected-fill": `color-mix(in srgb, ${accentColor} 14%, transparent)`,
    "--timeline-row-highlight-hover-fill": `color-mix(in srgb, ${accentColor} 24%, transparent)`,
    "--timeline-row-highlight-selected-stroke": `color-mix(in srgb, ${accentColor} 32%, transparent)`,
    "--timeline-row-highlight-hover-stroke": `color-mix(in srgb, ${accentColor} 48%, transparent)`,
    ...extras,
  } as CSSProperties;
}

export function getTimelineRowHighlightSelectedFill(accentColor: string) {
  return `color-mix(in srgb, ${accentColor} 14%, transparent)`;
}

export function getTimelineRowHighlightHoverFill(accentColor: string) {
  return `color-mix(in srgb, ${accentColor} 24%, transparent)`;
}

export function buildTimelineTaskHighlightStyle(
  disciplineId: string | null,
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>,
  extras?: TimelineTaskToneExtras,
) {
  return buildTimelineHighlightStyle(
    getTimelineTaskDisciplineColor(disciplineId, disciplinesById),
    extras,
  );
}

export function buildTimelineSubsystemHighlightStyle(
  subsystemColor: string | null | undefined,
  extras?: TimelineTaskToneExtras,
) {
  return buildTimelineHighlightStyle(
    subsystemColor ?? FALLBACK_TIMELINE_SUBSYSTEM_HIGHLIGHT_COLOR,
    extras,
  );
}

export function resolveTimelineRowHighlightStyle(
  anchorKey: string,
  tasksById: Record<string, TaskRecord>,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>,
) {
  if (anchorKey.startsWith("task:")) {
    const task = tasksById[anchorKey.slice(5)];
    if (!task) {
      return null;
    }

    return buildTimelineTaskHighlightStyle(task.disciplineId, disciplinesById);
  }

  if (anchorKey.startsWith("subsystem:")) {
    const subsystem = subsystemsById[anchorKey.slice(10)];
    if (!subsystem) {
      return null;
    }

    return buildTimelineSubsystemHighlightStyle(subsystem.color ?? "#4F86C6");
  }

  return null;
}

export function buildTimelineTaskToneStyle(
  disciplineId: string | null,
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>,
  extras?: TimelineTaskToneExtras,
) {
  return buildTimelineTaskHighlightStyle(disciplineId, disciplinesById, {
    "--timeline-task-discipline-accent": getTimelineTaskDisciplineColor(disciplineId, disciplinesById),
    ...extras,
  });
}
