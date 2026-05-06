import { useCallback, useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import {
  buildTimelineDayMilestoneUnderlays,
  type MilestoneGeometry,
} from "../model/timelineMilestoneData";
import type { UseTimelineMilestoneOverlaySyncResult } from "./useTimelineMilestoneOverlaySync";

interface UseTimelineMilestoneOverlayLayoutArgs {
  days: string[];
  milestones: BootstrapPayload["milestones"];
  timelineZoom: number;
  timelineDayCellLayouts: UseTimelineMilestoneOverlaySyncResult["timelineDayCellLayouts"];
  timelineDayCellRefs: UseTimelineMilestoneOverlaySyncResult["timelineDayCellRefs"];
  timelineGridHeight: UseTimelineMilestoneOverlaySyncResult["timelineGridHeight"];
  timelineGridRef: UseTimelineMilestoneOverlaySyncResult["timelineGridRef"];
  timelineHeaderHeight: UseTimelineMilestoneOverlaySyncResult["timelineHeaderHeight"];
  timelineShellRef: UseTimelineMilestoneOverlaySyncResult["timelineShellRef"];
}

export function useTimelineMilestoneOverlayLayout({
  days,
  milestones,
  timelineZoom,
  timelineDayCellLayouts,
  timelineDayCellRefs,
  timelineGridHeight,
  timelineGridRef,
  timelineHeaderHeight,
  timelineShellRef,
}: UseTimelineMilestoneOverlayLayoutArgs) {
  const resolveDayLayout = useCallback(
    (day: string | null) => {
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
    },
    [timelineDayCellLayouts, timelineDayCellRefs],
  );

  const resolveMilestonePopupGeometry = useCallback(
    (popupStartDay: string | null, popupEndDay: string | null): MilestoneGeometry | null => {
      if (!popupStartDay) {
        return null;
      }

      const isMultiDayMilestone =
        Boolean(popupStartDay) && Boolean(popupEndDay) && popupStartDay !== popupEndDay;
      const start = resolveDayLayout(popupStartDay);
      const end = isMultiDayMilestone ? resolveDayLayout(popupEndDay) : start;

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
    [
      resolveDayLayout,
      timelineGridHeight,
      timelineGridRef,
      timelineHeaderHeight,
      timelineShellRef,
    ],
  );

  const timelineDayMilestoneUnderlays = useMemo(
    () =>
      buildTimelineDayMilestoneUnderlays({
        milestones,
        resolveGeometry: resolveMilestonePopupGeometry,
        timelineDays: days,
        timelineZoom,
      }),
    [days, milestones, resolveMilestonePopupGeometry, timelineZoom],
  );

  return {
    resolveMilestonePopupGeometry,
    timelineDayMilestoneUnderlays,
  };
}
