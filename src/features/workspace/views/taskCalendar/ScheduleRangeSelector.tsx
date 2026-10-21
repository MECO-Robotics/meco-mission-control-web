import { SegmentedSelector } from "@/features/workspace/shared/topbar";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
export type SchedulePresentation = "agenda" | "timeline";

const TIMELINE_RANGES: Array<{ id: TimelineViewInterval; label: string }> = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "Project span" },
];

export function ScheduleRangeSelector({
  onChange,
  presentation,
  value,
}: {
  onChange?: (value: TimelineViewInterval) => void;
  presentation: SchedulePresentation;
  value: TimelineViewInterval;
}) {
  const isTimeline = presentation === "timeline";

  return (
    <SegmentedSelector
      ariaLabel="Schedule date range"
      collapsible={isTimeline}
      dataTutorialTarget={isTimeline ? "timeline-interval-select" : undefined}
      onChange={(range) => onChange?.(range)}
      options={TIMELINE_RANGES}
      value={value}
    />
  );
}
