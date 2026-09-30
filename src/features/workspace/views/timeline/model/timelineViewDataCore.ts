import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingRecord, TaskRecord } from "@/types/recordsExecution";
import { dateDiffInDays } from "@/lib/appUtils/common";
import { formatLocalDate } from "@/lib/dateUtils";
import { datePortion, endOfTimelineWeek, monthEndFromDay, monthStartFromDay, startOfTimelineWeek } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { compareTimelineMilestonesByStart } from "./timelineMilestoneData";
import { buildTimelineSubsystemRows } from "./timelineViewDataRows";

const ALL_INTERVAL_PAST_MONTHS = 9;
const ALL_INTERVAL_FUTURE_MONTHS = 3;

function getMeetingStartDateTime(meeting: MeetingRecord) {
  return meeting.startAt;
}

function compareTimelineMeetingsByStart(left: MeetingRecord, right: MeetingRecord) {
  const startComparison = getMeetingStartDateTime(left).localeCompare(getMeetingStartDateTime(right));
  return startComparison !== 0 ? startComparison : left.id.localeCompare(right.id);
}

function buildTimelineDateRange({
  milestones,
  meetings,
  tasks,
  viewAnchorDate,
  viewInterval,
}: {
  milestones: BootstrapPayload["milestones"];
  meetings: NonNullable<BootstrapPayload["meetings"]>;
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
      includeCandidate(datePortion(milestone.startAt));
      includeCandidate(datePortion(milestone.endAt ?? milestone.startAt));
    });

    meetings.forEach((meeting) => {
      includeCandidate(datePortion(getMeetingStartDateTime(meeting)));
      if (meeting.endAt) {
        includeCandidate(datePortion(meeting.endAt));
      }
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
        startDate: formatLocalDate(fallbackStart),
        endDate: formatLocalDate(fallbackEnd),
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

    startDate = formatLocalDate(startObj);
    endDate = formatLocalDate(endObj);
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

    startDate = formatLocalDate(start);
    endDate = formatLocalDate(end);
  }

  return { startDate, endDate };
}

function buildTimelineDays(startDate: string, endDate: string) {
  const totalDays = dateDiffInDays(startDate, endDate) + 1;
  const days: string[] = [];
  const dayCursor = new Date(`${startDate}T12:00:00`);

  for (let index = 0; index < totalDays; index += 1) {
    days.push(formatLocalDate(dayCursor));
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return days;
}

function buildTimelineDayIndex<T>(
  startDate: string,
  endDate: string,
  records: readonly T[],
  compare: (left: T, right: T) => number,
  getStartDate: (record: T) => string,
  getEndDate: (record: T) => string,
) {
  const recordsByDay: Record<string, T[]> = {};

  for (const record of [...records].sort(compare)) {
    const recordStart = getStartDate(record);
    const recordEnd = getEndDate(record);

    if (recordStart > endDate || recordEnd < startDate) continue;

    const rangeStart = recordStart < startDate ? startDate : recordStart;
    const rangeEnd = recordEnd > endDate ? endDate : recordEnd;
    const cursor = new Date(`${rangeStart}T12:00:00`);
    const finalDay = new Date(`${rangeEnd}T12:00:00`);

    while (cursor <= finalDay) {
      const dayKey = formatLocalDate(cursor);
      (recordsByDay[dayKey] ??= []).push(record);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return recordsByDay;
}

function buildTimelineDayMilestones(
  startDate: string,
  endDate: string,
  milestones: BootstrapPayload["milestones"],
) {
  return buildTimelineDayIndex(
    startDate,
    endDate,
    milestones,
    compareTimelineMilestonesByStart,
    (milestone) => datePortion(milestone.startAt),
    (milestone) => datePortion(milestone.endAt ?? milestone.startAt),
  );
}

function buildTimelineDayMeetings(
  startDate: string,
  endDate: string,
  meetings: NonNullable<BootstrapPayload["meetings"]>,
) {
  return buildTimelineDayIndex(
    startDate,
    endDate,
    meetings,
    compareTimelineMeetingsByStart,
    (meeting) => datePortion(getMeetingStartDateTime(meeting)),
    (meeting) => datePortion(meeting.endAt ?? getMeetingStartDateTime(meeting)),
  );
}

export function buildTimelineData({
  isAllProjectsView,
  meetings = [],
  milestones,
  projectsById,
  scopedSubsystems,
  scopedTasks,
  viewAnchorDate,
  viewInterval,
}: {
  isAllProjectsView: boolean;
  milestones: BootstrapPayload["milestones"];
  meetings?: NonNullable<BootstrapPayload["meetings"]>;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  scopedSubsystems: BootstrapPayload["subsystems"];
  scopedTasks: TaskRecord[];
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}) {
  const range = buildTimelineDateRange({
    milestones,
    meetings,
    tasks: scopedTasks,
    viewAnchorDate,
    viewInterval,
  });

  const days = buildTimelineDays(range.startDate, range.endDate);
  const dayMilestones = buildTimelineDayMilestones(range.startDate, range.endDate, milestones);
  const dayMeetings = buildTimelineDayMeetings(range.startDate, range.endDate, meetings);
  const subsystemRows = buildTimelineSubsystemRows({
    includeEmptySubsystems: !isAllProjectsView,
    projectsById,
    scopedSubsystems,
    scopedTasks,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  return { days, dayMeetings, dayMilestones, subsystemRows };
}
