import { SegmentedSelector } from "@/features/workspace/shared/topbar";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { SchedulePresentation } from "./SchedulePresentationSelector";

const TIMELINE_RANGES: Array<{ id: TimelineViewInterval; label: string }> = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
];

const SINGLE_RANGES: Record<Exclude<SchedulePresentation, "timeline">, Array<{ id: TimelineViewInterval; label: string }>> = {
  agenda: [{ id: "all", label: "All" }],
  calendar: [{ id: "month", label: "Month" }],
};

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
  const options = isTimeline ? TIMELINE_RANGES : SINGLE_RANGES[presentation];
  const selectedRange = isTimeline ? value : presentation === "calendar" ? "month" : "all";

  return (
    <SegmentedSelector
      ariaLabel="Schedule date range"
      dataTutorialTarget={isTimeline ? "timeline-interval-select" : undefined}
      onChange={(range) => onChange?.(range)}
      options={options}
      value={selectedRange}
    />
  );
}
