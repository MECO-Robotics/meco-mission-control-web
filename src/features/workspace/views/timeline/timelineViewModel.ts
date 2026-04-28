import type { BootstrapPayload, EventRecord, TaskRecord } from "@/types";
import { dateDiffInDays } from "@/lib/appUtils";
import { getEventTypeStyle, type WorkspaceEventStyle } from "@/features/workspace/shared/eventStyles";
import {
  datePortion,
  monthEndFromDay,
  monthLabelFromDay,
  monthStartFromDay,
  type TimelineViewInterval,
} from "@/features/workspace/shared/timelineDateUtils";

const ALL_INTERVAL_PAST_MONTHS = 9;
const ALL_INTERVAL_FUTURE_MONTHS = 3;
const MILESTONE_UNDERLAY_HORIZONTAL_GAP = 18;
const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat(undefined, { day: "numeric" });

export interface TimelineTaskSpan extends TaskRecord {
  offset: number;
  span: number;
}

export interface TimelineSubsystemRow {
  id: string;
  name: string;
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
  dayNumberLabel: string;
  eventsOnDay: EventRecord[];
  dayStyle: WorkspaceEventStyle | null;
  primaryEventStartDay: string;
  primaryEventEndDay: string;
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
  lines: string[];
  color: string;
  rotationDeg: 45 | 90;
  geometry: MilestoneGeometry;
  horizontalOffset: number;
  stackOrder: number;
}

function buildTimelineDateRange({
  events,
  tasks,
  viewAnchorDate,
  viewInterval,
}: {
  events: BootstrapPayload["events"];
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

    events.forEach((event) => {
      includeCandidate(datePortion(event.startDateTime));
      includeCandidate(datePortion(event.endDateTime ?? event.startDateTime));
    });

    if (!earliestDate || !latestDate) {
      return null;
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
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 12);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
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

function buildTimelineDayEvents(
  startDate: string,
  endDate: string,
  events: BootstrapPayload["events"],
) {
  const dayEvents: Record<string, EventRecord[]> = {};
  const eventsSortedByStart = [...events].sort((left, right) =>
    left.startDateTime.localeCompare(right.startDateTime),
  );

  eventsSortedByStart.forEach((event) => {
    const eventStart = datePortion(event.startDateTime);
    const eventEnd = datePortion(event.endDateTime ?? event.startDateTime);

    if (eventStart > endDate || eventEnd < startDate) {
      return;
    }

    const rangeStart = eventStart < startDate ? startDate : eventStart;
    const rangeEnd = eventEnd > endDate ? endDate : eventEnd;
    const cursor = new Date(`${rangeStart}T12:00:00`);
    const finalDay = new Date(`${rangeEnd}T12:00:00`);

    while (cursor <= finalDay) {
      const dayKey = cursor.toISOString().slice(0, 10);
      const existing = dayEvents[dayKey];
      if (existing) {
        existing.push(event);
      } else {
        dayEvents[dayKey] = [event];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return dayEvents;
}

function buildTimelineSubsystemRows({
  projectsById,
  scopedSubsystems,
  scopedTasks,
  startDate,
  endDate,
}: {
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  scopedSubsystems: BootstrapPayload["subsystems"];
  scopedTasks: TaskRecord[];
  startDate: string;
  endDate: string;
}) {
  const tasksBySubsystem = new Map<string, TimelineTaskSpan[]>();

  scopedTasks.forEach((task) => {
    if (task.startDate > endDate || task.dueDate < startDate) {
      return;
    }

    const clampedStart = task.startDate < startDate ? startDate : task.startDate;
    const clampedEnd = task.dueDate > endDate ? endDate : task.dueDate;
    const projectedTask: TimelineTaskSpan = {
      ...task,
      offset: dateDiffInDays(startDate, clampedStart),
      span: Math.max(1, dateDiffInDays(clampedStart, clampedEnd) + 1),
    };

    const targetSubsystemIds =
      task.subsystemIds.length > 0 ? task.subsystemIds : [task.subsystemId];
    for (const subsystemId of targetSubsystemIds) {
      const existingTasks = tasksBySubsystem.get(subsystemId);
      if (existingTasks) {
        existingTasks.push(projectedTask);
      } else {
        tasksBySubsystem.set(subsystemId, [projectedTask]);
      }
    }
  });

  const subsystemRows: TimelineSubsystemRow[] = [];

  scopedSubsystems.forEach((subsystem) => {
    const subsystemTasks = tasksBySubsystem.get(subsystem.id) ?? [];
    if (subsystemTasks.length === 0) {
      return;
    }

    let completeCount = 0;
    subsystemTasks.forEach((task) => {
      if (task.status === "complete") {
        completeCount += 1;
      }
    });

    subsystemRows.push({
      id: subsystem.id,
      name: subsystem.name,
      projectId: subsystem.projectId,
      projectName: projectsById[subsystem.projectId]?.name ?? "Unknown",
      index: subsystemRows.length,
      taskCount: subsystemTasks.length,
      completeCount,
      tasks: subsystemTasks,
    });
  });

  return subsystemRows;
}

export function buildTimelineData({
  events,
  projectsById,
  scopedSubsystems,
  scopedTasks,
  viewAnchorDate,
  viewInterval,
}: {
  events: BootstrapPayload["events"];
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  scopedSubsystems: BootstrapPayload["subsystems"];
  scopedTasks: TaskRecord[];
  viewAnchorDate: string;
  viewInterval: TimelineViewInterval;
}) {
  const range = buildTimelineDateRange({
    events,
    tasks: scopedTasks,
    viewAnchorDate,
    viewInterval,
  });

  if (!range) {
    return {
      days: [] as string[],
      dayEvents: {} as Record<string, EventRecord[]>,
      subsystemRows: [] as TimelineSubsystemRow[],
    };
  }

  const days = buildTimelineDays(range.startDate, range.endDate);
  const dayEvents = buildTimelineDayEvents(range.startDate, range.endDate, events);
  const subsystemRows = buildTimelineSubsystemRows({
    projectsById,
    scopedSubsystems,
    scopedTasks,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  return { days, dayEvents, subsystemRows };
}

export function buildTimelineMonthGroups(days: string[]) {
  const groups: TimelineMonthGroup[] = [];
  let lastMonthKey = "";
  let lastMonthLabel = "";
  let currentSpan = 0;

  days.forEach((day) => {
    const monthKey = day.slice(0, 7);
    if (monthKey !== lastMonthKey) {
      if (lastMonthLabel !== "") {
        groups.push({ month: lastMonthLabel, span: currentSpan });
      }
      lastMonthKey = monthKey;
      lastMonthLabel = monthLabelFromDay(day);
      currentSpan = 1;
    } else {
      currentSpan += 1;
    }
  });

  if (lastMonthLabel) {
    groups.push({ month: lastMonthLabel, span: currentSpan });
  }

  return groups;
}

export function buildTimelineDayHeaderCells(
  days: string[],
  dayEventsByDate: Record<string, EventRecord[]>,
) {
  return days.map((day) => {
    const eventsOnDay = dayEventsByDate[day] ?? [];
    const primaryEvent = eventsOnDay[0];
    const dayStyle = primaryEvent ? getEventTypeStyle(primaryEvent.type) : null;
    const primaryEventStartDay = primaryEvent ? datePortion(primaryEvent.startDateTime) : day;
    const primaryEventEndDay = primaryEvent?.endDateTime
      ? datePortion(primaryEvent.endDateTime)
      : primaryEventStartDay;
    const dayDate = new Date(`${day}T00:00:00`);

    return {
      day,
      weekdayLabel: WEEKDAY_SHORT_FORMATTER.format(dayDate),
      dayNumberLabel: DAY_NUMBER_FORMATTER.format(dayDate),
      eventsOnDay,
      dayStyle,
      primaryEventStartDay,
      primaryEventEndDay,
    };
  });
}

export function buildTimelineProjectRows(subsystemRows: TimelineSubsystemRow[]) {
  const grouped = new Map<string, TimelineProjectRow>();

  subsystemRows.forEach((subsystem) => {
    const existing = grouped.get(subsystem.projectId);
    if (existing) {
      existing.subsystems.push(subsystem);
      existing.taskCount += subsystem.taskCount;
      existing.completeCount += subsystem.completeCount;
      existing.tasks.push(...subsystem.tasks);
      return;
    }

    grouped.set(subsystem.projectId, {
      id: subsystem.projectId,
      name: subsystem.projectName,
      subsystems: [subsystem],
      taskCount: subsystem.taskCount,
      completeCount: subsystem.completeCount,
      tasks: [...subsystem.tasks],
    });
  });

  return Array.from(grouped.values());
}

export function buildTimelineDayMilestoneUnderlays({
  events,
  resolveGeometry,
  timelineDays,
}: {
  events: BootstrapPayload["events"];
  resolveGeometry: (popupStartDay: string | null, popupEndDay: string | null) => MilestoneGeometry | null;
  timelineDays: string[];
}) {
  if (!timelineDays.length) {
    return [];
  }

  const timelineStart = timelineDays[0];
  const timelineEnd = timelineDays[timelineDays.length - 1];
  const underlayEntries = events
    .map((event) => {
      const eventStartDay = datePortion(event.startDateTime);
      const eventEndDay = datePortion(event.endDateTime ?? event.startDateTime);
      const clampedStartDay = eventStartDay < timelineStart ? timelineStart : eventStartDay;
      const clampedEndDay = eventEndDay > timelineEnd ? timelineEnd : eventEndDay;

      if (clampedStartDay > timelineEnd || clampedEndDay < timelineStart) {
        return null;
      }

      const geometry = resolveGeometry(clampedStartDay, clampedEndDay);
      if (!geometry) {
        return null;
      }

      const style = getEventTypeStyle(event.type);
      const isMultiDayEvent = eventStartDay !== eventEndDay;

      return {
        id: event.id,
        lines: [event.title],
        color: style.chipText,
        rotationDeg: isMultiDayEvent ? 45 : 90,
        geometry,
        startDay: clampedStartDay,
        endDay: clampedEndDay,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        id: string;
        lines: string[];
        color: string;
        rotationDeg: 45 | 90;
        geometry: MilestoneGeometry;
        startDay: string;
        endDay: string;
      } => entry !== null,
    )
    .sort((left, right) => {
      if (left.startDay !== right.startDay) {
        return left.startDay.localeCompare(right.startDay);
      }
      if (left.endDay !== right.endDay) {
        return left.endDay.localeCompare(right.endDay);
      }
      return left.id.localeCompare(right.id);
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
    const horizontalOffset =
      (entry.laneIndex - (clusterLaneCount - 1) / 2) * MILESTONE_UNDERLAY_HORIZONTAL_GAP;

    return {
      id: entry.id,
      lines: entry.lines,
      color: entry.color,
      rotationDeg: entry.rotationDeg,
      geometry: entry.geometry,
      horizontalOffset,
      stackOrder: entry.laneIndex,
    } satisfies TimelineDayMilestoneUnderlay;
  });
}
