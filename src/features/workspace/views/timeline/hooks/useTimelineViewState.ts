import { useCallback, useState } from "react";
import type { WheelEvent } from "react";
import type { TaskRecord } from "@/types";
import {
  addDaysToDay,
  addMonthsToDay,
  localTodayDate,
  type TimelineViewInterval,
} from "@/features/workspace/shared/timeline";
import {
  clampTimelineZoom,
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_STEP,
} from "@/features/workspace/shared/timeline";

type TimelineGridMotion = "left" | "right" | "neutral";

export function useTimelineViewState() {
  const [viewInterval, setViewInterval] = useState<TimelineViewInterval>("month");
  const [viewAnchorDate, setViewAnchorDate] = useState(localTodayDate);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineZoomMin, setTimelineZoomMin] = useState(TIMELINE_ZOOM_MIN);
  const [timelineGridMotion, setTimelineGridMotion] = useState<{
    direction: TimelineGridMotion | null;
    token: number;
  }>({
    direction: null,
    token: 0,
  });
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedSubsystems, setCollapsedSubsystems] = useState<Record<string, boolean>>({});
  const [isProjectColumnVisible, setIsProjectColumnVisible] = useState(true);
  const [isSubsystemColumnVisible, setIsSubsystemColumnVisible] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [hoveredSubsystemId, setHoveredSubsystemId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const toggleProject = useCallback((id: string) => {
    setCollapsedProjects((previous) => {
      const nextCollapsed = !(previous[id] ?? false);
      return { ...previous, [id]: nextCollapsed };
    });
  }, []);

  const toggleSubsystem = useCallback((id: string) => {
    setCollapsedSubsystems((previous) => {
      const nextCollapsed = !(previous[id] ?? false);
      return { ...previous, [id]: nextCollapsed };
    });
  }, []);

  const toggleProjectColumn = useCallback(() => {
    setIsProjectColumnVisible((previous) => !previous);
  }, []);

  const toggleSubsystemColumn = useCallback(() => {
    setIsSubsystemColumnVisible((previous) => !previous);
  }, []);

  const selectSubsystemRow = useCallback((id: string) => {
    setSelectedTaskId(null);
    setSelectedSubsystemId((previous) => (previous === id ? null : id));
  }, []);

  const hoverSubsystemRow = useCallback((id: string) => {
    setHoveredTaskId(null);
    setHoveredSubsystemId(id);
  }, []);

  const clearHoveredSubsystemRow = useCallback(() => {
    setHoveredSubsystemId(null);
  }, []);

  const hoverTaskRow = useCallback((id: string) => {
    setHoveredSubsystemId(null);
    setHoveredTaskId(id);
  }, []);

  const clearHoveredTaskRow = useCallback(() => {
    setHoveredTaskId(null);
  }, []);

  const selectTaskRow = useCallback((task: TaskRecord) => {
    setSelectedSubsystemId(null);
    setSelectedTaskId((previous) => (previous === task.id ? null : task.id));
  }, []);

  const adjustTimelineZoom = useCallback((direction: 1 | -1) => {
    setTimelineZoom((previous) => clampTimelineZoom(previous + direction * TIMELINE_ZOOM_STEP, timelineZoomMin));
  }, [timelineZoomMin]);

  const handleTimelineZoomWheel = useCallback((milestone: WheelEvent<HTMLDivElement>) => {
    if (!(milestone.ctrlKey || milestone.metaKey) || milestone.deltaY === 0) {
      return;
    }

    milestone.preventDefault();
    setTimelineZoom((previous) =>
      clampTimelineZoom(
        previous + (milestone.deltaY > 0 ? -TIMELINE_ZOOM_STEP : TIMELINE_ZOOM_STEP),
        timelineZoomMin,
      ),
    );
  }, [timelineZoomMin]);

  const setTimelineZoomMinLimit = useCallback((nextMinZoom: number) => {
    const normalizedMinZoom = Math.min(
      TIMELINE_ZOOM_MAX,
      Math.max(TIMELINE_ZOOM_MIN, Math.ceil(nextMinZoom * 10) / 10),
    );

    setTimelineZoomMin((previous) => (previous === normalizedMinZoom ? previous : normalizedMinZoom));
    setTimelineZoom((previous) => clampTimelineZoom(previous, normalizedMinZoom));
  }, []);

  const playTimelineGridAnimation = useCallback((direction: TimelineGridMotion) => {
    setTimelineGridMotion((current) => ({
      direction,
      token: current.token + 1,
    }));
  }, []);

  const handleTimelineIntervalChange = useCallback(
    (nextInterval: TimelineViewInterval, nextAnchorDate?: string) => {
      if (nextInterval === viewInterval) {
        return;
      }

      playTimelineGridAnimation("neutral");
      if (nextAnchorDate) {
        setViewAnchorDate(nextAnchorDate);
      }
      setViewInterval(nextInterval);
    },
    [playTimelineGridAnimation, viewInterval],
  );

  const shiftTimelinePeriod = useCallback(
    (direction: -1 | 1) => {
      if (viewInterval === "all") {
        return;
      }

      playTimelineGridAnimation(direction > 0 ? "left" : "right");
      setViewAnchorDate((current) => {
        if (viewInterval === "week") {
          return addDaysToDay(current, direction * 7);
        }

        return addMonthsToDay(current, direction);
      });
    },
    [playTimelineGridAnimation, viewInterval],
  );

  return {
    adjustTimelineZoom,
    clearHoveredSubsystemRow,
    clearHoveredTaskRow,
    collapsedProjects,
    collapsedSubsystems,
    handleTimelineIntervalChange,
    handleTimelineZoomWheel,
    hoverSubsystemRow,
    hoverTaskRow,
    hoveredSubsystemId,
    hoveredTaskId,
    isProjectColumnVisible,
    isSubsystemColumnVisible,
    playTimelineGridAnimation,
    selectSubsystemRow,
    selectTaskRow,
    selectedSubsystemId,
    selectedTaskId,
    setTimelineZoomMin: setTimelineZoomMinLimit,
    setSelectedSubsystemId,
    setSelectedTaskId,
    shiftTimelinePeriod,
    setViewAnchorDate,
    setViewInterval,
    setTimelineGridMotion,
    timelineGridMotion,
    timelineZoom,
    timelineZoomMin,
    toggleProject,
    toggleProjectColumn,
    toggleSubsystem,
    toggleSubsystemColumn,
    viewAnchorDate,
    viewInterval,
  };
}
