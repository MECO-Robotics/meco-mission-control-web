import { useCallback, useState } from "react";
import { addDaysToDay, addMonthsToDay, localTodayDate, type TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { clampTimelineZoom, TIMELINE_ZOOM_STEP } from "@/features/workspace/shared/timeline/timelineZoom";

export function useTimelineViewState() {
  const [viewInterval, setViewInterval] = useState<TimelineViewInterval>("month");
  const [viewAnchorDate, setViewAnchorDate] = useState(localTodayDate);
  const [timelineZoom, setTimelineZoom] = useState(1);

  const adjustTimelineZoom = useCallback((direction: 1 | -1) => {
    setTimelineZoom((previous) => clampTimelineZoom(previous + direction * TIMELINE_ZOOM_STEP));
  }, []);

  const fitTimeline = useCallback(() => setTimelineZoom(1), []);

  const handleTimelineIntervalChange = useCallback((nextInterval: TimelineViewInterval, nextAnchorDate?: string) => {
    if (nextAnchorDate) setViewAnchorDate(nextAnchorDate);
    setViewInterval(nextInterval);
    setTimelineZoom(1);
  }, []);

  const shiftTimelinePeriod = useCallback((direction: -1 | 1) => {
    if (viewInterval === "all") return;
    setViewAnchorDate((current) => viewInterval === "week"
      ? addDaysToDay(current, direction * 7)
      : addMonthsToDay(current, direction));
    setTimelineZoom(1);
  }, [viewInterval]);

  const goToToday = useCallback(() => {
    setViewAnchorDate(localTodayDate());
    setViewInterval((current) => current === "all" ? "month" : current);
    setTimelineZoom(1);
  }, []);

  return {
    adjustTimelineZoom,
    fitTimeline,
    goToToday,
    handleTimelineIntervalChange,
    shiftTimelinePeriod,
    timelineZoom,
    viewAnchorDate,
    viewInterval,
  };
}
