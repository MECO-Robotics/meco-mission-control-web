import type React from "react";

import type { TimelineDayHeaderCell, TimelineMonthGroup } from "./timelineViewModel";

export type TimelineGridMotion = "left" | "right" | "neutral";

export interface TimelineGridHeaderProps {
  clearHoveredMilestonePopup: () => void;
  firstDayGridColumn: number;
  gridMinWidth: number;
  handleTimelineDayMouseEnter: (milestone: React.MouseEvent<HTMLElement>) => void;
  handleTimelineHeaderDayClick: (day: string) => void;
  handleTimelineZoomWheel: (milestone: React.WheelEvent<HTMLDivElement>) => void;
  hasProjectColumn: boolean;
  isScrolling: boolean;
  isWeekView: boolean;
  monthGroups: TimelineMonthGroup[];
  projectColumnWidth: number;
  showProjectCol: boolean;
  showSubsystemCol: boolean;
  subsystemColumnIndex: number;
  subsystemColumnWidth: number;
  subsystemStickyLeft: number;
  timelineDayCellRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  timelineDayHeaderCells: TimelineDayHeaderCell[];
  timelineFilterMotionClass: string;
  timelineGridMotion: {
    direction: TimelineGridMotion | null;
    token: number;
  };
  timelineGridRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineGridTemplate: string;
  timelineShellRef: React.MutableRefObject<HTMLDivElement | null>;
  timelineZoom: number;
  toggleProjectColumn: () => void;
  toggleSubsystemColumn: () => void;
  children?: React.ReactNode;
}
