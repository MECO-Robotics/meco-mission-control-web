import type { BootstrapPayload } from "@/types/bootstrap";
import type { DisciplineCode } from "@/types/common";

const FALLBACK_TASK_DISCIPLINE_COLOR = "#7a8799";

const TASK_DISCIPLINE_COLORS: Record<DisciplineCode, string> = {
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

export function getTaskDisciplineColor(
  disciplineId: string | null,
  workTypesById: Record<string, BootstrapPayload["workTypes"][number]>,
) {
  if (!disciplineId) {
    return FALLBACK_TASK_DISCIPLINE_COLOR;
  }

  const code = workTypesById[disciplineId]?.code;
  return code && code in TASK_DISCIPLINE_COLORS
    ? TASK_DISCIPLINE_COLORS[code as DisciplineCode]
    : FALLBACK_TASK_DISCIPLINE_COLOR;
}
