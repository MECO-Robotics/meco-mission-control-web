import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getMilestoneTypeStyle } from "@/features/workspace/shared/events/eventStyles";
import { datePortion, monthLabelFromDay } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type {
  TimelineMonthGroup,
  TimelineProjectRow,
  TimelineSubsystemRow,
  TimelineTaskSpan,
} from "../timelineViewModel";

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const WEEKDAY_NARROW_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });
const DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat(undefined, { day: "numeric" });

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
  dayMilestonesByDate: Record<string, MilestoneRecord[]>,
) {
  return days.map((day) => {
    const milestonesOnDay = dayMilestonesByDate[day] ?? [];
    const primaryMilestone = milestonesOnDay[0];
    const dayStyle = primaryMilestone ? getMilestoneTypeStyle(primaryMilestone.type) : null;
    const primaryMilestoneStartDay = primaryMilestone ? datePortion(primaryMilestone.startDateTime) : day;
    const primaryMilestoneEndDay = primaryMilestone?.endDateTime
      ? datePortion(primaryMilestone.endDateTime)
      : primaryMilestoneStartDay;
    const dayDate = new Date(`${day}T00:00:00`);

    return {
      day,
      weekdayLabel: WEEKDAY_SHORT_FORMATTER.format(dayDate),
      weekdayNarrowLabel: WEEKDAY_NARROW_FORMATTER.format(dayDate),
      dayNumberLabel: DAY_NUMBER_FORMATTER.format(dayDate),
      milestonesOnDay,
      dayStyle,
      primaryMilestoneStartDay,
      primaryMilestoneEndDay,
    };
  });
}

export function buildTimelineProjectRows(subsystemRows: TimelineSubsystemRow[]) {
  const grouped = new Map<string, TimelineProjectRow>();

  subsystemRows.forEach((subsystem) => {
    const existing = grouped.get(subsystem.projectId);
    if (existing) {
      existing.subsystems.push(subsystem);
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

  return Array.from(grouped.values()).map((project) => {
    const tasksById = new Map<string, TimelineTaskSpan>();
    project.tasks.forEach((task) => {
      if (!tasksById.has(task.id)) {
        tasksById.set(task.id, task);
      }
    });
    const tasks = Array.from(tasksById.values());

    return {
      ...project,
      taskCount: tasks.length,
      completeCount: tasks.filter((task) => task.status === "complete").length,
      tasks,
    };
  });
}

export function filterTimelineMilestonesByPersonSelection({
  activePersonFilter,
  milestones,
  tasks,
}: {
  activePersonFilter: FilterSelection;
  milestones: BootstrapPayload["milestones"];
  tasks: BootstrapPayload["tasks"];
}) {
  if (activePersonFilter.length === 0) {
    return milestones;
  }

  const matchingMilestoneIds = new Set(
    tasks.flatMap((task) =>
      task.targetMilestoneId && filterSelectionMatchesTaskPeople(activePersonFilter, task)
        ? [task.targetMilestoneId]
        : [],
    ),
  );

  return milestones.filter((milestone) => matchingMilestoneIds.has(milestone.id));
}
