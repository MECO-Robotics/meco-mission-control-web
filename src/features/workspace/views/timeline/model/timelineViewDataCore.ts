import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { dateDiffInDays } from "@/lib/appUtils/common";
import { formatLocalDate } from "@/lib/dateUtils";
import { datePortion, endOfTimelineWeek, monthEndFromDay, monthStartFromDay, startOfTimelineWeek } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";

export function buildTimelineDateRange({
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
      includeCandidate(datePortion(meeting.startAt));
      if (meeting.endAt) {
        includeCandidate(datePortion(meeting.endAt));
      }
    });

    startDate = earliestDate ?? monthStartFromDay(viewAnchorDate);
    endDate = latestDate ?? monthEndFromDay(viewAnchorDate);
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

export function buildTimelineDays(startDate: string, endDate: string) {
  const totalDays = dateDiffInDays(startDate, endDate) + 1;
  const days: string[] = [];
  const dayCursor = new Date(`${startDate}T12:00:00`);

  for (let index = 0; index < totalDays; index += 1) {
    days.push(formatLocalDate(dayCursor));
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return days;
}
