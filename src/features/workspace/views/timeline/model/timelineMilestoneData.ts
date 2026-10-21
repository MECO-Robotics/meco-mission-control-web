import type { MilestoneRecord } from "@/types/recordsExecution";
import { datePortion } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { MilestoneGeometry, TimelineDayMilestoneUnderlay } from "../timelineViewModel";
export type { MilestoneGeometry, TimelineDayCellLayouts, TimelineDayMilestoneUnderlay } from "../timelineViewModel";
export function compareTimelineMilestonesByStart(left: MilestoneRecord, right: MilestoneRecord) {
  return left.startAt.localeCompare(right.startAt) || (left.endAt ?? left.startAt).localeCompare(right.endAt ?? right.startAt) || left.id.localeCompare(right.id);
}
export function buildTimelineDayMilestoneUnderlays({ milestones, resolveGeometry, timelineDays }: {
  milestones: MilestoneRecord[];
  resolveGeometry: (startDay: string | null, endDay: string | null) => MilestoneGeometry | null;
  timelineDays: string[];
}): TimelineDayMilestoneUnderlay[] {
  if (!timelineDays.length) return [];
  const start = timelineDays[0];
  const end = timelineDays[timelineDays.length - 1];
  return [...milestones].sort(compareTimelineMilestonesByStart).flatMap((milestone) => {
    const startDay = datePortion(milestone.startAt) < start ? start : datePortion(milestone.startAt);
    const rawEnd = datePortion(milestone.endAt ?? milestone.startAt);
    const endDay = rawEnd > end ? end : rawEnd;
    if (startDay > end || endDay < start) return [];
    const geometry = resolveGeometry(startDay, endDay);
    return geometry ? [{ id: milestone.id, milestone, geometry, startDay, endDay }] : [];
  });
}
