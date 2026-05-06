import type { MilestoneType } from "@/types/common";

export interface WorkspaceMilestoneStyle {
  label: string;
  columnBackground: string;
  columnBorder: string;
  chipBackground: string;
  chipText: string;
  darkColumnBorder: string;
  darkChipBackground: string;
  darkChipText: string;
}

export const DEFAULT_EVENT_TYPE: MilestoneType = "internal-review";

export const EVENT_TYPE_STYLES: Record<MilestoneType, WorkspaceMilestoneStyle> = {
  practice: {
    label: "Practice",
    columnBackground: "rgba(22, 71, 142, 0.1)",
    columnBorder: "rgba(22, 71, 142, 0.32)",
    chipBackground: "rgba(22, 71, 142, 0.18)",
    chipText: "#0d2e5c",
    darkColumnBorder: "rgba(147, 197, 253, 0.48)",
    darkChipBackground: "rgba(59, 130, 246, 0.22)",
    darkChipText: "#bfdbfe",
  },
  competition: {
    label: "Competition",
    columnBackground: "rgba(76, 121, 207, 0.12)",
    columnBorder: "rgba(76, 121, 207, 0.35)",
    chipBackground: "rgba(76, 121, 207, 0.2)",
    chipText: "#1f3f7a",
    darkColumnBorder: "rgba(147, 197, 253, 0.5)",
    darkChipBackground: "rgba(96, 165, 250, 0.24)",
    darkChipText: "#dbeafe",
  },
  deadline: {
    label: "Deadline",
    columnBackground: "rgba(234, 28, 45, 0.11)",
    columnBorder: "rgba(234, 28, 45, 0.36)",
    chipBackground: "rgba(234, 28, 45, 0.18)",
    chipText: "#8e1120",
    darkColumnBorder: "rgba(251, 113, 133, 0.5)",
    darkChipBackground: "rgba(244, 63, 94, 0.22)",
    darkChipText: "#fecdd3",
  },
  "internal-review": {
    label: "Internal review",
    columnBackground: "rgba(36, 104, 71, 0.11)",
    columnBorder: "rgba(36, 104, 71, 0.34)",
    chipBackground: "rgba(36, 104, 71, 0.18)",
    chipText: "#1d5338",
    darkColumnBorder: "rgba(134, 239, 172, 0.46)",
    darkChipBackground: "rgba(34, 197, 94, 0.2)",
    darkChipText: "#bbf7d0",
  },
  demo: {
    label: "Demo",
    columnBackground: "rgba(112, 128, 154, 0.13)",
    columnBorder: "rgba(84, 98, 123, 0.35)",
    chipBackground: "rgba(84, 98, 123, 0.22)",
    chipText: "#36475f",
    darkColumnBorder: "rgba(203, 213, 225, 0.42)",
    darkChipBackground: "rgba(148, 163, 184, 0.2)",
    darkChipText: "#e2e8f0",
  },
};

export const EVENT_TYPE_OPTIONS = (
  Object.entries(EVENT_TYPE_STYLES) as [MilestoneType, WorkspaceMilestoneStyle][]
).map(([value, style]) => ({
  value,
  label: style.label,
}));

export function getMilestoneTypeStyle(type: string | null | undefined) {
  return EVENT_TYPE_STYLES[type as MilestoneType] ?? EVENT_TYPE_STYLES[DEFAULT_EVENT_TYPE];
}
