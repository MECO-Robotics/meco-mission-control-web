import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { datePortion } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { getMilestoneTypeStyle } from "@/features/workspace/shared/events/eventStyles";
export type {
  MilestoneGeometry,
  TimelineDayCellLayouts,
  TimelineDayMilestoneUnderlay,
  TimelineMilestonePopupItem,
} from "../timelineViewModel";
import type {
  MilestoneGeometry,
  TimelineDayMilestoneUnderlay,
  TimelineMilestonePopupItem,
} from "../timelineViewModel";

const MILESTONE_UNDERLAY_HORIZONTAL_GAP = 18;

type TimelineMilestoneUnderlayEntry = {
  id: string;
  milestone: MilestoneRecord;
  lines: string[];
  color: string;
  rotationDeg: 45 | 90;
  geometry: MilestoneGeometry;
  startDay: string;
  endDay: string;
  sourceOrder: number;
};

function compareTimelineMilestonesByStart(left: MilestoneRecord, right: MilestoneRecord) {
  const startComparison = left.startDateTime.localeCompare(right.startDateTime);
  if (startComparison !== 0) {
    return startComparison;
  }

  const leftEnd = left.endDateTime ?? left.startDateTime;
  const rightEnd = right.endDateTime ?? right.startDateTime;
  const endComparison = leftEnd.localeCompare(rightEnd);
  if (endComparison !== 0) {
    return endComparison;
  }

  return left.id.localeCompare(right.id);
}

export function getTimelineMilestonePopupItems(
  milestonesOnDay: MilestoneRecord[],
  underlays: TimelineDayMilestoneUnderlay[],
): TimelineMilestonePopupItem[] {
  const underlayOffsetsByMilestoneId = new Map(
    underlays.map((underlay) => [underlay.id, underlay.horizontalOffset]),
  );

  return milestonesOnDay.map((milestone) => ({
    text: milestone.title,
    horizontalOffset: underlayOffsetsByMilestoneId.get(milestone.id) ?? 0,
  }));
}

export function buildTimelineDayMilestoneUnderlays({
  milestones,
  resolveGeometry,
  timelineDays,
  timelineZoom = 1,
}: {
  milestones: BootstrapPayload["milestones"];
  resolveGeometry: (popupStartDay: string | null, popupEndDay: string | null) => MilestoneGeometry | null;
  timelineDays: string[];
  timelineZoom?: number;
}) {
  if (!timelineDays.length) {
    return [];
  }

  const timelineStart = timelineDays[0];
  const timelineEnd = timelineDays[timelineDays.length - 1];
  const underlayEntries = [...milestones]
    .sort(compareTimelineMilestonesByStart)
    .map<TimelineMilestoneUnderlayEntry | null>((milestone, sourceOrder) => {
      const milestoneStartDay = datePortion(milestone.startDateTime);
      const milestoneEndDay = datePortion(milestone.endDateTime ?? milestone.startDateTime);
      const clampedStartDay = milestoneStartDay < timelineStart ? timelineStart : milestoneStartDay;
      const clampedEndDay = milestoneEndDay > timelineEnd ? timelineEnd : milestoneEndDay;

      if (clampedStartDay > timelineEnd || clampedEndDay < timelineStart) {
        return null;
      }

      const geometry = resolveGeometry(clampedStartDay, clampedEndDay);
      if (!geometry) {
        return null;
      }

      const style = getMilestoneTypeStyle(milestone.type);
      const isMultiDayMilestone = milestoneStartDay !== milestoneEndDay;

      return {
        id: milestone.id,
        milestone,
        lines: [milestone.title],
        color: style.chipText,
        rotationDeg: isMultiDayMilestone ? 45 : 90,
        geometry,
        startDay: clampedStartDay,
        endDay: clampedEndDay,
        sourceOrder,
      };
    })
    .filter(
      (entry): entry is TimelineMilestoneUnderlayEntry => entry !== null,
    )
    .sort((left, right) => {
      const startComparison = left.startDay.localeCompare(right.startDay);
      return startComparison !== 0 ? startComparison : left.sourceOrder - right.sourceOrder;
    });

  if (!underlayEntries.length) {
    return [];
  }

  const laneEndDays: string[] = [];
  let clusterIndex = -1;
  let clusterEndDay = "";
  const clusterLaneCounts = new Map<number, number>();

  const layoutEntries = underlayEntries.map((entry) => {
    if (clusterIndex < 0 || entry.startDay > clusterEndDay) {
      clusterIndex += 1;
      clusterEndDay = entry.endDay;
    } else if (entry.endDay > clusterEndDay) {
      clusterEndDay = entry.endDay;
    }

    const laneMatch = laneEndDays.findIndex((laneEndDay) => laneEndDay < entry.startDay);
    const laneIndex = laneMatch === -1 ? laneEndDays.length : laneMatch;
    laneEndDays[laneIndex] = entry.endDay;

    const previousClusterLaneCount = clusterLaneCounts.get(clusterIndex) ?? 0;
    if (laneIndex + 1 > previousClusterLaneCount) {
      clusterLaneCounts.set(clusterIndex, laneIndex + 1);
    }

    return {
      ...entry,
      clusterIndex,
      laneIndex,
    };
  });

  return layoutEntries.map((entry) => {
    const clusterLaneCount = clusterLaneCounts.get(entry.clusterIndex) ?? 1;
    const laneGap = Math.max(
      MILESTONE_UNDERLAY_HORIZONTAL_GAP,
      Math.round(MILESTONE_UNDERLAY_HORIZONTAL_GAP * timelineZoom),
    );
    const horizontalOffset =
      (entry.laneIndex - (clusterLaneCount - 1) / 2) * laneGap;

    return {
      id: entry.id,
      milestone: entry.milestone,
      lines: entry.lines,
      color: entry.color,
      rotationDeg: entry.rotationDeg,
      geometry: entry.geometry,
      startDay: entry.startDay,
      endDay: entry.endDay,
      horizontalOffset,
      stackOrder: entry.laneIndex,
    } satisfies TimelineDayMilestoneUnderlay;
  });
}
