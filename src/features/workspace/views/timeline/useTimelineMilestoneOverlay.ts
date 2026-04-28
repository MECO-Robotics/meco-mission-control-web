import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { BootstrapPayload, EventRecord } from "@/types";
import { datePortion } from "@/features/workspace/shared/timelineDateUtils";
import { getEventTypeStyle } from "@/features/workspace/shared/eventStyles";
import {
  isSameHoveredMilestonePopup,
  type HoveredMilestonePopup,
} from "@/features/workspace/shared/timelineEventHelpers";
import {
  buildTimelineDayMilestoneUnderlays,
  type MilestoneGeometry,
  type TimelineDayCellLayouts,
} from "./timelineViewModel";

interface UseTimelineMilestoneOverlayArgs {
  days: string[];
  dayEventsByDate: Record<string, EventRecord[]>;
  events: BootstrapPayload["events"];
}

export function useTimelineMilestoneOverlay({
  days,
  dayEventsByDate,
  events,
}: UseTimelineMilestoneOverlayArgs) {
  const [timelineDayCellLayouts, setTimelineDayCellLayouts] = useState<TimelineDayCellLayouts>({});
  const [timelineGridHeight, setTimelineGridHeight] = useState(0);
  const [timelineHeaderHeight, setTimelineHeaderHeight] = useState(0);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const timelineGridRef = useRef<HTMLDivElement | null>(null);
  const timelineDayCellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineLayerGeometryFrameRef = useRef<number | null>(null);
  const hoveredMilestonePopupRef = useRef<HoveredMilestonePopup | null>(null);
  const setHoveredMilestonePopupLayerRef = useRef<
    (popup: HoveredMilestonePopup | null) => void
  >(() => undefined);

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
    });
  }, [days]);

  useEffect(
    () => () => {
      if (timelineLayerGeometryFrameRef.current !== null) {
        window.cancelAnimationFrame(timelineLayerGeometryFrameRef.current);
        timelineLayerGeometryFrameRef.current = null;
      }
    },
    [],
  );

  const resolveMilestonePopupGeometry = useCallback(
    (popupStartDay: string | null, popupEndDay: string | null): MilestoneGeometry | null => {
      if (!popupStartDay) {
        return null;
      }

      const isMultiDayEvent =
        Boolean(popupStartDay) && Boolean(popupEndDay) && popupStartDay !== popupEndDay;
      const fallbackLayout = (day: string | null) => {
        if (!day) {
          return null;
        }

        const measured = timelineDayCellLayouts[day];
        if (measured) {
          return measured;
        }

        const dayCell = timelineDayCellRefs.current[day];
        if (!dayCell) {
          return null;
        }

        return {
          left: dayCell.offsetLeft,
          width: dayCell.offsetWidth,
        };
      };

      const start = fallbackLayout(popupStartDay);
      const end = isMultiDayEvent ? fallbackLayout(popupEndDay) : start;

      if (!start || !end || !timelineShellRef.current) {
        return null;
      }

      const left = Math.min(start.left, end.left);
      const right = Math.max(start.left + start.width, end.left + end.width);
      const centerX = (left + right) / 2;
      const gridHeight = timelineGridHeight || timelineGridRef.current?.clientHeight || 0;
      const bodyTop = Math.max(0, timelineHeaderHeight);
      const bodyHeight = gridHeight - bodyTop;
      if (bodyHeight <= 0) {
        return null;
      }

      return {
        left,
        width: right - left,
        centerX,
        centerY: bodyTop + bodyHeight / 2,
        bodyTop,
        bodyHeight,
      };
    },
    [timelineDayCellLayouts, timelineGridHeight, timelineHeaderHeight],
  );

  const updateHoveredMilestonePopup = useCallback(
    (target: HTMLElement, lines: string[], background: string, color: string) => {
      if (typeof document === "undefined") {
        return;
      }

      const popupStartDay = target.dataset.popupStartDay;
      const popupEndDay = target.dataset.popupEndDay;
      const isMultiDayEvent =
        Boolean(popupStartDay) && Boolean(popupEndDay) && popupStartDay !== popupEndDay;
      const normalizedPopupStartDay = popupStartDay ?? null;
      const normalizedPopupEndDay = popupEndDay ?? null;

      if (!normalizedPopupStartDay) {
        return;
      }

      const nextPopup: HoveredMilestonePopup = {
        anchorStartDay: normalizedPopupStartDay,
        anchorEndDay: normalizedPopupEndDay,
        rotationDeg: isMultiDayEvent ? 45 : 90,
        lines,
        background,
        color,
      };
      if (isSameHoveredMilestonePopup(hoveredMilestonePopupRef.current, nextPopup)) {
        return;
      }

      hoveredMilestonePopupRef.current = nextPopup;
      setHoveredMilestonePopupLayerRef.current(nextPopup);
    },
    [],
  );

  const showDateCellMilestonePopup = useCallback(
    (anchor: HTMLElement, day: string) => {
      const eventsOnDay = dayEventsByDate[day] ?? [];
      if (!eventsOnDay.length) {
        return;
      }

      const primaryEvent = eventsOnDay[0];
      if (!primaryEvent) {
        return;
      }

      const lines =
        eventsOnDay.length === 1 ? [primaryEvent.title] : eventsOnDay.map((event) => event.title);
      const timelineStart = days[0] ?? null;
      const timelineEnd = days[days.length - 1] ?? null;
      const eventStartDay = datePortion(primaryEvent.startDateTime);
      const eventEndDay = primaryEvent.endDateTime
        ? datePortion(primaryEvent.endDateTime)
        : eventStartDay;
      const anchorStartDay =
        timelineStart && eventStartDay < timelineStart ? timelineStart : eventStartDay;
      const anchorEndDay = timelineEnd && eventEndDay > timelineEnd ? timelineEnd : eventEndDay;

      anchor.dataset.popupStartDay = anchorStartDay;
      anchor.dataset.popupEndDay = anchorEndDay;

      const dayStyle = getEventTypeStyle(primaryEvent.type);
      updateHoveredMilestonePopup(anchor, lines, dayStyle.columnBackground, dayStyle.chipText);
    },
    [dayEventsByDate, days, updateHoveredMilestonePopup],
  );

  const clearHoveredMilestonePopup = useCallback(() => {
    if (!hoveredMilestonePopupRef.current) {
      return;
    }
    hoveredMilestonePopupRef.current = null;
    setHoveredMilestonePopupLayerRef.current(null);
  }, []);

  const handleTimelineDayMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const day = event.currentTarget.dataset.timelineDay;
      if (!day) {
        return;
      }
      showDateCellMilestonePopup(event.currentTarget, day);
    },
    [showDateCellMilestonePopup],
  );

  const timelineDayMilestoneUnderlays = useMemo(
    () =>
      buildTimelineDayMilestoneUnderlays({
        events,
        resolveGeometry: resolveMilestonePopupGeometry,
        timelineDays: days,
      }),
    [days, events, resolveMilestonePopupGeometry],
  );

  const tooltipPortalTarget =
    typeof document === "undefined" ? null : timelineShellRef.current;

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

  return {
    clearHoveredMilestonePopup,
    handleTimelineDayMouseEnter,
    queueTimelineLayerUpdate,
    resolveMilestonePopupGeometry,
    setHoveredMilestonePopupLayerRef,
    timelineDayCellRefs,
    timelineDayMilestoneUnderlays,
    timelineGridRef,
    timelineShellRef,
    tooltipPortalTarget,
  };
}
