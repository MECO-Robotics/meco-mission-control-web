import { useCallback } from "react";
import { addDaysToDay, addMonthsToDay, midpointOfTimelineDays } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";

export function useTimelinePeriodNavigation({
  days,
  onIntervalChange,
  shiftTimelinePeriod,
  viewAnchorDate,
  viewInterval,
}: {
  days: string[];
  onIntervalChange: (interval: TimelineViewInterval, anchorDate: string) => void;
  shiftTimelinePeriod: (direction: -1 | 1) => void;
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}) {
  const handleTimelineIntervalChange = useCallback((interval: TimelineViewInterval) => {
    const anchorDate = midpointOfTimelineDays(days) ?? viewAnchorDate;
    onIntervalChange(interval, anchorDate);
    window.dispatchEvent(new CustomEvent("mission-control:schedule-period-change", {
      detail: { anchorDate, viewMode: interval === "week" ? "week" : "month" },
    }));
  }, [days, onIntervalChange, viewAnchorDate]);

  const handleShiftPeriod = useCallback((direction: -1 | 1) => {
    if (viewInterval === "all") return;
    const anchorDate = viewInterval === "week"
      ? addDaysToDay(viewAnchorDate, direction * 7)
      : addMonthsToDay(viewAnchorDate, direction);
    shiftTimelinePeriod(direction);
    window.dispatchEvent(new CustomEvent("mission-control:schedule-period-change", {
      detail: { anchorDate },
    }));
  }, [shiftTimelinePeriod, viewAnchorDate, viewInterval]);

  return { handleTimelineIntervalChange, handleShiftPeriod };
}
