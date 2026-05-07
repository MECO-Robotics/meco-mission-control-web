import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";
import type { WorkspaceMilestoneStyle } from "@/features/workspace/shared/events/eventStyles";

export function getTimelineMergedCellRotation(rowCount: number) {
  return rowCount >= 4 ? "180deg" : "240deg";
}

export interface TimelineTaskSpan extends TaskRecord {
  offset: number;
  span: number;
  spillsLeft: boolean;
  spillsRight: boolean;
}

export interface TimelineSubsystemRow {
  id: string;
  name: string;
  color: string;
  projectId: string;
  projectName: string;
  index: number;
  taskCount: number;
  completeCount: number;
  tasks: TimelineTaskSpan[];
}

export interface TimelineProjectRow {
  id: string;
  name: string;
  subsystems: TimelineSubsystemRow[];
  taskCount: number;
  completeCount: number;
  tasks: TimelineTaskSpan[];
}

export interface TimelineMonthGroup {
  month: string;
  span: number;
}

export interface TimelineDayHeaderCell {
  day: string;
  weekdayLabel: string;
  weekdayNarrowLabel: string;
  dayNumberLabel: string;
  milestonesOnDay: MilestoneRecord[];
  dayStyle: WorkspaceMilestoneStyle | null;
  primaryMilestoneStartDay: string;
  primaryMilestoneEndDay: string;
}

export interface TimelineDayCellLayout {
  left: number;
  width: number;
}

export type TimelineDayCellLayouts = Record<string, TimelineDayCellLayout>;

export interface MilestoneGeometry {
  left: number;
  width: number;
  centerX: number;
  centerY: number;
  bodyTop: number;
  bodyHeight: number;
}

export interface TimelineDayMilestoneUnderlay {
  id: string;
  milestone: MilestoneRecord;
  lines: string[];
  color: string;
  rotationDeg: 45 | 90;
  geometry: MilestoneGeometry;
  startDay: string;
  endDay: string;
  horizontalOffset: number;
  stackOrder: number;
}

export interface TimelineMilestonePopupItem {
  text: string;
  horizontalOffset: number;
}

export * from "./model/timelineViewData";
export * from "./model/timelineMilestoneData";
