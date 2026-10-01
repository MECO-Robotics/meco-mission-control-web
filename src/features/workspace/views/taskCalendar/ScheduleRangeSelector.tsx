import { SegmentedSelector } from "@/features/workspace/shared/topbar";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { SchedulePresentation } from "./SchedulePresentationSelector";

const GANTT_RANGES: Array<{ id: TimelineViewInterval; label: string }> = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
];

const ALL_RANGE: Array<{ id: TimelineViewInterval; label: string }> = [
  { id: "all", label: "All" },
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
  const isGantt = presentation === "timeline";

  return (
    <SegmentedSelector
      ariaLabel="Schedule date range"
      dataTutorialTarget={isGantt ? "timeline-interval-select" : undefined}
      onChange={(range) => onChange?.(range)}
      options={isGantt ? GANTT_RANGES : ALL_RANGE}
      value={isGantt ? value : "all"}
    />
  );
}
