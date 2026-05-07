import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { localTodayDate } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineDayCellLayouts } from "../model/timelineMilestoneData";

export interface UseTimelineMilestoneOverlaySyncArgs {
  days: string[];
}

export interface UseTimelineMilestoneOverlaySyncResult {
  isTimelineShellScrolling: boolean;
  queueTimelineLayerUpdate: () => void;
  timelineDayCellLayouts: TimelineDayCellLayouts;
  timelineDayCellRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  timelineGridHeight: number;
  timelineGridRef: MutableRefObject<HTMLDivElement | null>;
  timelineHeaderHeight: number;
  timelineShellRef: MutableRefObject<HTMLDivElement | null>;
  timelineTodayMarkerLabelTop: number | null;
  timelineTodayMarkerLineLeft: number | null;
  timelineTodayMarkerLeft: number | null;
  tooltipPortalTarget: HTMLElement | null;
}

export function useTimelineMilestoneOverlaySync({
  days,
}: UseTimelineMilestoneOverlaySyncArgs): UseTimelineMilestoneOverlaySyncResult {
  const [timelineDayCellLayouts, setTimelineDayCellLayouts] = useState<TimelineDayCellLayouts>({});
  const [timelineGridHeight, setTimelineGridHeight] = useState(0);
  const [timelineHeaderHeight, setTimelineHeaderHeight] = useState(0);
  const [timelineTodayMarkerLeft, setTimelineTodayMarkerLeft] = useState<number | null>(null);
  const [isTimelineShellScrolling, setIsTimelineShellScrolling] = useState(false);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const timelineGridRef = useRef<HTMLDivElement | null>(null);
  const timelineDayCellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineLayerGeometryFrameRef = useRef<number | null>(null);
  const timelineScrollResetFrameRef = useRef<number | null>(null);
  const [timelineTodayMarkerLabelTop, setTimelineTodayMarkerLabelTop] = useState<number | null>(null);
  const [timelineTodayMarkerLineLeft, setTimelineTodayMarkerLineLeft] = useState<number | null>(null);

  const queueTimelineLayerUpdate = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (timelineLayerGeometryFrameRef.current !== null) {
      return;
    }

    timelineLayerGeometryFrameRef.current = window.requestAnimationFrame(() => {
      timelineLayerGeometryFrameRef.current = null;
      const grid = timelineGridRef.current;
      const shell = timelineShellRef.current;
      if (!grid || !shell) {
        setTimelineDayCellLayouts((previous) =>
          Object.keys(previous).length ? {} : previous,
        );
        setTimelineGridHeight((previous) => (previous === 0 ? previous : 0));
        setTimelineHeaderHeight((previous) => (previous === 0 ? previous : 0));
        setTimelineTodayMarkerLeft((previous) => (previous === null ? previous : null));
        return;
      }

      const layouts: TimelineDayCellLayouts = {};
      days.forEach((day) => {
        const dayCell = timelineDayCellRefs.current[day];
        if (!dayCell) {
          return;
        }

        layouts[day] = {
          left: dayCell.offsetLeft,
          width: dayCell.offsetWidth,
        };
      });

      setTimelineDayCellLayouts((previous) => {
        const previousKeys = Object.keys(previous);
        const nextKeys = Object.keys(layouts);
        if (previousKeys.length !== nextKeys.length) {
          return layouts;
        }

        for (let index = 0; index < nextKeys.length; index += 1) {
          const key = nextKeys[index];
          if (!key) {
            continue;
          }
          const before = previous[key];
          const after = layouts[key];
          if (!before || !after || before.left !== after.left || before.width !== after.width) {
            return layouts;
          }
        }

        return previous;
      });

      const firstDay = days[0];
      const firstDayCell = firstDay ? timelineDayCellRefs.current[firstDay] : null;
      const shellRect = shell.getBoundingClientRect();
      const nextHeaderHeight = firstDayCell
        ? firstDayCell.getBoundingClientRect().bottom - shellRect.top + shell.scrollTop
        : 0;
      const timelineDayCells = Array.from(
        shell.querySelectorAll<HTMLElement>("[data-timeline-grid-cell='true']"),
      );
      const contentBottom = timelineDayCells.reduce((maxBottom, cell) => {
        const cellBottom = cell.getBoundingClientRect().bottom - shellRect.top + shell.scrollTop;
        return cellBottom > maxBottom ? cellBottom : maxBottom;
      }, 0);
      const nextGridHeight = Math.max(nextHeaderHeight, contentBottom, grid.clientHeight);
      setTimelineGridHeight((previous) => (previous === nextGridHeight ? previous : nextGridHeight));
      setTimelineHeaderHeight((previous) =>
        previous === nextHeaderHeight ? previous : nextHeaderHeight,
      );

      const todayCell = timelineDayCellRefs.current[localTodayDate()];
      const nextTodayMarkerLineLeft = todayCell ? todayCell.offsetLeft : null;
      const nextTodayMarkerLeft = todayCell ? todayCell.offsetLeft + todayCell.offsetWidth / 2 : null;
      const nextTodayMarkerLabelTop = todayCell ? todayCell.offsetTop : null;
      setTimelineTodayMarkerLineLeft((previous) =>
        previous === nextTodayMarkerLineLeft ? previous : nextTodayMarkerLineLeft,
      );
      setTimelineTodayMarkerLabelTop((previous) =>
        previous === nextTodayMarkerLabelTop ? previous : nextTodayMarkerLabelTop,
      );
      setTimelineTodayMarkerLeft((previous) =>
        previous === nextTodayMarkerLeft ? previous : nextTodayMarkerLeft,
      );
    });
  }, [days]);

  useEffect(
    () => () => {
      if (timelineLayerGeometryFrameRef.current !== null) {
        window.cancelAnimationFrame(timelineLayerGeometryFrameRef.current);
        timelineLayerGeometryFrameRef.current = null;
      }
      if (timelineScrollResetFrameRef.current !== null) {
        window.clearTimeout(timelineScrollResetFrameRef.current);
        timelineScrollResetFrameRef.current = null;
      }
    },
    [queueTimelineLayerUpdate],
  );

  useEffect(() => {
    queueTimelineLayerUpdate();
  }, [days, queueTimelineLayerUpdate]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observedElements: HTMLDivElement[] = [];
    if (timelineShellRef.current) {
      observedElements.push(timelineShellRef.current);
    }
    if (timelineGridRef.current) {
      observedElements.push(timelineGridRef.current);
    }

    if (!observedElements.length) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      queueTimelineLayerUpdate();
    });

    observedElements.forEach((element) => {
      resizeObserver.observe(element);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [queueTimelineLayerUpdate]);

  useEffect(() => {
    const shell = timelineShellRef.current;
    if (!shell) {
      return undefined;
    }

    const handleScroll = () => {
      queueTimelineLayerUpdate();
      setIsTimelineShellScrolling(true);
      if (timelineScrollResetFrameRef.current !== null) {
        window.clearTimeout(timelineScrollResetFrameRef.current);
      }
      timelineScrollResetFrameRef.current = window.setTimeout(() => {
        timelineScrollResetFrameRef.current = null;
        setIsTimelineShellScrolling(false);
      }, 120);
    };

    shell.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      shell.removeEventListener("scroll", handleScroll);
    };
  }, [queueTimelineLayerUpdate]);

  const tooltipPortalTarget =
    typeof document === "undefined" ? null : timelineShellRef.current;

  return {
    isTimelineShellScrolling,
    queueTimelineLayerUpdate,
    timelineDayCellLayouts,
    timelineDayCellRefs,
    timelineGridHeight,
    timelineGridRef,
    timelineHeaderHeight,
    timelineShellRef,
    timelineTodayMarkerLabelTop,
    timelineTodayMarkerLineLeft,
    timelineTodayMarkerLeft,
    tooltipPortalTarget,
  };
}
