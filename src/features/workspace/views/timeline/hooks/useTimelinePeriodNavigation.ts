import { useCallback } from "react";
import { addDaysToDay, addMonthsToDay, localTodayDate, midpointOfTimelineDays } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";

export function useTimelinePeriodNavigation({
  days,
  goToToday,
  onIntervalChange,
  shiftTimelinePeriod,
  viewAnchorDate,
  viewInterval,
}: {
  days: string[];
  goToToday: () => void;
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

  const handleToday = useCallback(() => {
    goToToday();
    window.dispatchEvent(new CustomEvent("mission-control:schedule-period-change", {
      detail: { anchorDate: localTodayDate(), viewMode: viewInterval === "week" ? "week" : "month" },
    }));
  }, [goToToday, viewInterval]);

  return { handleTimelineIntervalChange, handleShiftPeriod, handleToday };
}
