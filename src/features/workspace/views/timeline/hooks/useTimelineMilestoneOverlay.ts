import { useCallback, useRef } from "react";
import type React from "react";
import type { BootstrapPayload, MilestoneRecord } from "@/types";
import { datePortion } from "@/features/workspace/shared/timeline";
import { getMilestoneTypeStyle } from "@/features/workspace/shared/milestones";
import {
  isSameHoveredMilestonePopup,
  type HoveredMilestonePopup,
} from "@/features/workspace/shared/timeline";
import {
  getTimelineMilestonePopupItems,
} from "../model/timelineMilestoneData";
import { useTimelineMilestoneOverlayLayout } from "./useTimelineMilestoneOverlayLayout";
import { useTimelineMilestoneOverlaySync } from "./useTimelineMilestoneOverlaySync";

interface UseTimelineMilestoneOverlayArgs {
  days: string[];
  dayMilestonesByDate: Record<string, MilestoneRecord[]>;
  milestones: BootstrapPayload["milestones"];
}

export function useTimelineMilestoneOverlay({
  days,
  dayMilestonesByDate,
  milestones,
}: UseTimelineMilestoneOverlayArgs) {
  const sync = useTimelineMilestoneOverlaySync({ days });
  const layout = useTimelineMilestoneOverlayLayout({
    days,
    milestones,
    timelineDayCellLayouts: sync.timelineDayCellLayouts,
    timelineDayCellRefs: sync.timelineDayCellRefs,
    timelineGridHeight: sync.timelineGridHeight,
    timelineGridRef: sync.timelineGridRef,
    timelineHeaderHeight: sync.timelineHeaderHeight,
    timelineShellRef: sync.timelineShellRef,
  });
  const hoveredMilestonePopupRef = useRef<HoveredMilestonePopup | null>(null);
  const setHoveredMilestonePopupLayerRef = useRef<
    (popup: HoveredMilestonePopup | null) => void
  >(() => undefined);
  const resolveMilestonePopupGeometry = layout.resolveMilestonePopupGeometry;
  const timelineDayMilestoneUnderlays = layout.timelineDayMilestoneUnderlays;
  const timelineDayCellRefs = sync.timelineDayCellRefs;
  const timelineGridRef = sync.timelineGridRef;
  const timelineShellRef = sync.timelineShellRef;
  const timelineTodayMarkerLabelTop = sync.timelineTodayMarkerLabelTop;
  const timelineTodayMarkerLineLeft = sync.timelineTodayMarkerLineLeft;
  const timelineTodayMarkerLeft = sync.timelineTodayMarkerLeft;
  const isTimelineShellScrolling = sync.isTimelineShellScrolling;
  const tooltipPortalTarget = sync.tooltipPortalTarget;
  const queueTimelineLayerUpdate = sync.queueTimelineLayerUpdate;

  const updateHoveredMilestonePopup = useCallback(
    (
      target: HTMLElement,
      lines: string[],
      lineOffsets: number[],
      background: string,
      color: string,
    ) => {
      if (typeof document === "undefined") {
        return;
      }

      const popupStartDay = target.dataset.popupStartDay;
      const popupEndDay = target.dataset.popupEndDay;
      const isMultiDayMilestone =
        Boolean(popupStartDay) && Boolean(popupEndDay) && popupStartDay !== popupEndDay;
      const normalizedPopupStartDay = popupStartDay ?? null;
      const normalizedPopupEndDay = popupEndDay ?? null;

      if (!normalizedPopupStartDay) {
        return;
      }

      const nextPopup: HoveredMilestonePopup = {
        anchorStartDay: normalizedPopupStartDay,
        anchorEndDay: normalizedPopupEndDay,
        rotationDeg: isMultiDayMilestone ? 45 : 90,
        lines,
        lineOffsets,
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
      const milestonesOnDay = dayMilestonesByDate[day] ?? [];
      if (!milestonesOnDay.length) {
        return;
      }

      const primaryMilestone = milestonesOnDay[0];
      if (!primaryMilestone) {
        return;
      }

      const timelineStart = days[0] ?? null;
      const timelineEnd = days[days.length - 1] ?? null;
      const milestoneStartDay = datePortion(primaryMilestone.startDateTime);
      const milestoneEndDay = primaryMilestone.endDateTime
        ? datePortion(primaryMilestone.endDateTime)
        : milestoneStartDay;
      const popupItems = getTimelineMilestonePopupItems(milestonesOnDay, timelineDayMilestoneUnderlays);
      const anchorStartDay =
        timelineStart && milestoneStartDay < timelineStart ? timelineStart : milestoneStartDay;
      const anchorEndDay = timelineEnd && milestoneEndDay > timelineEnd ? timelineEnd : milestoneEndDay;

      anchor.dataset.popupStartDay = anchorStartDay;
      anchor.dataset.popupEndDay = anchorEndDay;

      const dayStyle = getMilestoneTypeStyle(primaryMilestone.type);
      updateHoveredMilestonePopup(
        anchor,
        popupItems.map((item) => item.text),
        popupItems.map((item) => item.horizontalOffset),
        dayStyle.columnBackground,
        dayStyle.chipText,
      );
    },
    [dayMilestonesByDate, days, timelineDayMilestoneUnderlays, updateHoveredMilestonePopup],
  );

  const clearHoveredMilestonePopup = useCallback(() => {
    if (!hoveredMilestonePopupRef.current) {
      return;
    }
    hoveredMilestonePopupRef.current = null;
    setHoveredMilestonePopupLayerRef.current(null);
  }, []);

  const handleTimelineDayMouseEnter = useCallback(
    (milestone: React.MouseEvent<HTMLElement>) => {
      const day = milestone.currentTarget.dataset.timelineDay;
      if (!day) {
        return;
      }
      showDateCellMilestonePopup(milestone.currentTarget, day);
    },
    [showDateCellMilestonePopup],
  );

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
    timelineTodayMarkerLabelTop,
    timelineTodayMarkerLineLeft,
    timelineTodayMarkerLeft,
    tooltipPortalTarget,
    isTimelineShellScrolling,
  };
}


