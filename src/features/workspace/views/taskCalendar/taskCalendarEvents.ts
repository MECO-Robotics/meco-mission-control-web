import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionIncludes,
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";

export type TaskCalendarEventType =
  | "milestone"
  | "task-due"
  | "qa-due"
  | "event"
  | "manufacturing-due";

export interface TaskCalendarEventProps {
  contextLabel: string | null;
  priority?: string;
  projectId: string | null;
  recordId: string;
  status?: string;
  type: TaskCalendarEventType;
}

export interface TaskCalendarEvent {
  allDay: boolean;
  classNames: string[];
  extendedProps: TaskCalendarEventProps;
  id: string;
  start: string;
  title: string;
}

interface BuildTaskCalendarEventsArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
}

const CALENDAR_MS_PER_DAY = 24 * 60 * 60 * 1000;

function asDateOnly(value: string) {
  if (value.includes("T")) {
    return value.slice(0, 10);
  }

  return value.length > 10 ? value.slice(0, 10) : value;
}

function hasTime(value: string) {
  return value.includes("T");
}

function buildContextLabel({
  isAllProjectsView,
  projectId,
  projectsById,
}: {
  isAllProjectsView: boolean;
  projectId: string | null;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
}) {
  if (!isAllProjectsView) {
    return null;
  }

  if (!projectId) {
    return "All projects";
  }

  return projectsById[projectId]?.name ?? "Unknown project";
}

function buildMilestoneContextLabel({
  bootstrap,
  isAllProjectsView,
  milestone,
  projectsById,
}: {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  milestone: BootstrapPayload["milestones"][number];
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
}) {
  if (!isAllProjectsView) {
    return null;
  }

  const milestoneProjectIds = milestone.projectIds;
  const scopedProjectIds = bootstrap.projects.map((project) => project.id);
  const isAllProjectsMilestone =
    milestoneProjectIds.length === 0 ||
    (milestoneProjectIds.length === scopedProjectIds.length &&
      milestoneProjectIds.every((projectId) => scopedProjectIds.includes(projectId)));

  if (isAllProjectsMilestone) {
    return "All projects";
  }

  if (milestoneProjectIds.length === 1) {
    return projectsById[milestoneProjectIds[0]]?.name ?? "Unknown project";
  }

  const firstProjectName = projectsById[milestoneProjectIds[0]]?.name ?? "Multiple projects";
  return `${firstProjectName} +${milestoneProjectIds.length - 1}`;
}

function prependContextLabel(title: string, contextLabel: string | null) {
  return contextLabel ? `${contextLabel} | ${title}` : title;
}

function compareEventStartDate(left: TaskCalendarEvent, right: TaskCalendarEvent) {
  const leftStart = left.start ? new Date(left.start).getTime() : Number.POSITIVE_INFINITY;
  const rightStart = right.start ? new Date(right.start).getTime() : Number.POSITIVE_INFINITY;

  if (leftStart === rightStart) {
    return left.title.localeCompare(right.title);
  }

  return leftStart - rightStart;
}

export function buildTaskCalendarEvents({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  projectsById,
}: BuildTaskCalendarEventsArgs) {
  const subsystemProjectById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem.projectId] as const),
  );

  const taskEvents: TaskCalendarEvent[] = bootstrap.tasks
    .filter(
      (task) =>
        Boolean(task.dueDate) &&
        filterSelectionMatchesTaskPeople(activePersonFilter, task) &&
        task.status !== "complete",
    )
    .map((task) => {
      const type = task.status === "waiting-for-qa" ? "qa-due" : "task-due";
      const contextLabel = buildContextLabel({
        isAllProjectsView,
        projectId: task.projectId,
        projectsById,
      });

      return {
        allDay: !hasTime(task.dueDate),
        classNames: ["task-calendar-event", `task-calendar-event-${type}`],
        extendedProps: {
          contextLabel,
          priority: task.priority,
          projectId: task.projectId,
          recordId: task.id,
          status: task.status,
          type,
        },
        id: `task:${task.id}`,
        start: hasTime(task.dueDate) ? task.dueDate : asDateOnly(task.dueDate),
        title: prependContextLabel(task.title, contextLabel),
      };
    });

  const milestoneEvents: TaskCalendarEvent[] = bootstrap.milestones
    .filter((milestone) => {
      if (activePersonFilter.length === 0) {
        return true;
      }

      const relatedTasks = getMilestoneTasksForState(milestone, bootstrap);
      return relatedTasks.some((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
    })
    .map((milestone) => {
      const contextLabel = buildMilestoneContextLabel({
        bootstrap,
        isAllProjectsView,
        milestone,
        projectsById,
      });

      return {
        allDay: !hasTime(milestone.startDateTime),
        classNames: ["task-calendar-event", "task-calendar-event-milestone"],
        extendedProps: {
          contextLabel,
          projectId: milestone.projectIds[0] ?? null,
          recordId: milestone.id,
          status: milestone.status,
          type: "milestone",
        },
        id: `milestone:${milestone.id}`,
        start: milestone.startDateTime,
        title: prependContextLabel(milestone.title, contextLabel),
      };
    });

  const manufacturingEvents: TaskCalendarEvent[] = bootstrap.manufacturingItems
    .filter(
      (item) =>
        Boolean(item.dueDate) &&
        item.status !== "complete" &&
        filterSelectionIncludes(activePersonFilter, item.requestedById),
    )
    .map((item) => {
      const projectId = subsystemProjectById[item.subsystemId] ?? null;
      const contextLabel = buildContextLabel({
        isAllProjectsView,
        projectId,
        projectsById,
      });

      return {
        allDay: !hasTime(item.dueDate),
        classNames: ["task-calendar-event", "task-calendar-event-manufacturing-due"],
        extendedProps: {
          contextLabel,
          projectId,
          recordId: item.id,
          status: item.status,
          type: "manufacturing-due",
        },
        id: `manufacturing:${item.id}`,
        start: hasTime(item.dueDate) ? item.dueDate : asDateOnly(item.dueDate),
        title: prependContextLabel(`MFG: ${item.title}`, contextLabel),
      };
    });

  const meetingEvents: TaskCalendarEvent[] = (bootstrap.meetings ?? []).map((meeting) => ({
    allDay: meeting.time.trim().length === 0,
    classNames: ["task-calendar-event", "task-calendar-event-event"],
    extendedProps: {
      contextLabel: "All projects",
      projectId: null,
      recordId: meeting.id,
      type: "event",
    },
    id: `meeting:${meeting.id}`,
    start:
      meeting.time.trim().length > 0
        ? `${asDateOnly(meeting.date)}T${meeting.time.trim()}`
        : asDateOnly(meeting.date),
    title: `Meeting: ${meeting.title}`,
  }));

  return [...milestoneEvents, ...taskEvents, ...manufacturingEvents, ...meetingEvents].sort(
    compareEventStartDate,
  );
}

export function isTaskDueSoon(dueDate: string, today = new Date()) {
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const parsedDue = new Date(asDateOnly(dueDate)).getTime();
  const diffDays = (parsedDue - normalizedToday) / CALENDAR_MS_PER_DAY;
  return diffDays >= 0 && diffDays <= 7;
}
