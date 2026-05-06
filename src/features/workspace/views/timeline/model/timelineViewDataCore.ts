import type { BootstrapPayload, MilestoneRecord, TaskRecord } from "@/types";
import { dateDiffInDays } from "@/lib/appUtils";
import {
  datePortion,
  endOfTimelineWeek,
  monthEndFromDay,
  monthStartFromDay,
  startOfTimelineWeek,
  type TimelineViewInterval,
} from "@/features/workspace/shared/timeline";
import { buildTimelineSubsystemRows } from "./timelineViewDataRows";

const ALL_INTERVAL_PAST_MONTHS = 9;
const ALL_INTERVAL_FUTURE_MONTHS = 3;

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

function buildTimelineDateRange({
  milestones,
  tasks,
  viewAnchorDate,
  viewInterval,
}: {
  milestones: BootstrapPayload["milestones"];
  tasks: TaskRecord[];
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}) {
  let startDate: string;
  let endDate: string;

  if (viewInterval === "all") {
    let earliestDate: string | null = null;
    let latestDate: string | null = null;

    const includeCandidate = (candidate: string) => {
      if (!earliestDate || candidate < earliestDate) {
        earliestDate = candidate;
      }
      if (!latestDate || candidate > latestDate) {
        latestDate = candidate;
      }
    };

    tasks.forEach((task) => {
      includeCandidate(task.startDate);
      includeCandidate(task.dueDate);
    });

    milestones.forEach((milestone) => {
      includeCandidate(datePortion(milestone.startDateTime));
      includeCandidate(datePortion(milestone.endDateTime ?? milestone.startDateTime));
    });

    if (!earliestDate || !latestDate) {
      const fallbackAnchor = new Date(`${viewAnchorDate}T12:00:00`);
      const now = Number.isNaN(fallbackAnchor.getTime())
        ? new Date()
        : fallbackAnchor;

      now.setHours(12, 0, 0, 0);
      const fallbackStart = new Date(now.getFullYear(), now.getMonth() - ALL_INTERVAL_PAST_MONTHS, 1, 12);
      const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + ALL_INTERVAL_FUTURE_MONTHS + 1, 0, 12);

      return {
        startDate: fallbackStart.toISOString().slice(0, 10),
        endDate: fallbackEnd.toISOString().slice(0, 10),
      };
    }

    const startObj = new Date(`${monthStartFromDay(earliestDate)}T12:00:00`);
    const endObj = new Date(`${monthEndFromDay(latestDate)}T12:00:00`);
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const boundedStart = new Date(now.getFullYear(), now.getMonth() - ALL_INTERVAL_PAST_MONTHS, 1, 12);
    const boundedEnd = new Date(now.getFullYear(), now.getMonth() + ALL_INTERVAL_FUTURE_MONTHS + 1, 0, 12);

    if (startObj < boundedStart) {
      startObj.setTime(boundedStart.getTime());
    }
    if (endObj > boundedEnd) {
      endObj.setTime(boundedEnd.getTime());
    }
    if (startObj > endObj) {
      startObj.setTime(boundedStart.getTime());
      endObj.setTime(boundedEnd.getTime());
    }

    startDate = startObj.toISOString().slice(0, 10);
    endDate = endObj.toISOString().slice(0, 10);
  } else {
    const now = new Date(`${viewAnchorDate}T12:00:00`);
    let start: Date;
    let end: Date;

    if (viewInterval === "week") {
      start = new Date(`${startOfTimelineWeek(viewAnchorDate)}T12:00:00`);
      end = new Date(`${endOfTimelineWeek(viewAnchorDate)}T12:00:00`);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 12);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12);
    }

    startDate = start.toISOString().slice(0, 10);
    endDate = end.toISOString().slice(0, 10);
  }

  return { startDate, endDate };
}

function buildTimelineDays(startDate: string, endDate: string) {
  const totalDays = dateDiffInDays(startDate, endDate) + 1;
  const days: string[] = [];
  const dayCursor = new Date(`${startDate}T12:00:00`);

  for (let index = 0; index < totalDays; index += 1) {
    days.push(dayCursor.toISOString().slice(0, 10));
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return days;
}

function buildTimelineDayMilestones(
  startDate: string,
  endDate: string,
  milestones: BootstrapPayload["milestones"],
) {
  const dayMilestones: Record<string, MilestoneRecord[]> = {};
  const milestonesSortedByStart = [...milestones].sort(compareTimelineMilestonesByStart);

  milestonesSortedByStart.forEach((milestone) => {
    const milestoneStart = datePortion(milestone.startDateTime);
    const milestoneEnd = datePortion(milestone.endDateTime ?? milestone.startDateTime);

    if (milestoneStart > endDate || milestoneEnd < startDate) {
      return;
    }

    const rangeStart = milestoneStart < startDate ? startDate : milestoneStart;
    const rangeEnd = milestoneEnd > endDate ? endDate : milestoneEnd;
    const cursor = new Date(`${rangeStart}T12:00:00`);
    const finalDay = new Date(`${rangeEnd}T12:00:00`);

    while (cursor <= finalDay) {
      const dayKey = cursor.toISOString().slice(0, 10);
      const existing = dayMilestones[dayKey];
      if (existing) {
        existing.push(milestone);
      } else {
        dayMilestones[dayKey] = [milestone];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return dayMilestones;
}

export function buildTimelineData({
  milestones,
  projectsById,
  scopedSubsystems,
  scopedTasks,
  viewAnchorDate,
  viewInterval,
}: {
  milestones: BootstrapPayload["milestones"];
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  scopedSubsystems: BootstrapPayload["subsystems"];
  scopedTasks: TaskRecord[];
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}) {
  const range = buildTimelineDateRange({
    milestones,
    tasks: scopedTasks,
    viewAnchorDate,
    viewInterval,
  });

  const days = buildTimelineDays(range.startDate, range.endDate);
  const dayMilestones = buildTimelineDayMilestones(range.startDate, range.endDate, milestones);
  const subsystemRows = buildTimelineSubsystemRows({
    projectsById,
    scopedSubsystems,
    scopedTasks,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  return { days, dayMilestones, subsystemRows };
}
