import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionIncludes,
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { isMeetingVisibleInProjectScope } from "@/features/workspace/shared/events";
import { getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";
import { parseLocalDate } from "@/lib/dateUtils";

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

function buildProjectContextLabel({
  allProjectIds,
  isAllProjectsView,
  projectIds,
  projectsById,
}: {
  allProjectIds?: string[];
  isAllProjectsView: boolean;
  projectIds: string[];
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
}) {
  if (!isAllProjectsView) {
    return null;
  }

  const isAllProjectsSelection =
    projectIds.length === 0 ||
    (allProjectIds !== undefined &&
      projectIds.length === allProjectIds.length &&
      projectIds.every((projectId) => allProjectIds.includes(projectId)));

  if (isAllProjectsSelection) {
    return "All projects";
  }

  if (projectIds.length === 1) {
    return projectsById[projectIds[0]]?.name ?? "Unknown project";
  }

  const firstProjectName = projectsById[projectIds[0]]?.name ?? "Multiple projects";
  return `${firstProjectName} +${projectIds.length - 1}`;
}

function prependContextLabel(title: string, contextLabel: string | null) {
  return contextLabel ? `${contextLabel} | ${title}` : title;
}

export function buildTaskCalendarEvents({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  projectsById,
}: BuildTaskCalendarEventsArgs) {
  const activeProjectIdList = bootstrap.projects.map((project) => project.id);
  const activeProjectIds = new Set(activeProjectIdList);
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
      const contextLabel = buildProjectContextLabel({
        isAllProjectsView,
        projectIds: task.projectId ? [task.projectId] : [],
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
      const contextLabel = buildProjectContextLabel({
        allProjectIds: activeProjectIdList,
        isAllProjectsView,
        projectIds: milestone.projectIds,
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
      const contextLabel = buildProjectContextLabel({
        isAllProjectsView,
        projectIds: projectId ? [projectId] : [],
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

  const meetingEvents: TaskCalendarEvent[] = (bootstrap.meetings ?? [])
    .filter((meeting) => isMeetingVisibleInProjectScope(meeting, activeProjectIds))
    .map((meeting) => {
      const meetingStart =
        meeting.startDateTime ??
        (meeting.time.trim().length > 0
          ? `${asDateOnly(meeting.date)}T${meeting.time.trim()}`
          : asDateOnly(meeting.date));
      const contextLabel = buildProjectContextLabel({
        isAllProjectsView,
        projectIds: meeting.projectIds ?? [],
        projectsById,
      });

      return {
        allDay: !hasTime(meetingStart),
        classNames: ["task-calendar-event", "task-calendar-event-event"],
        extendedProps: {
          contextLabel,
          projectId: meeting.projectIds?.[0] ?? null,
          recordId: meeting.id,
          status: meeting.meetingType ?? "general",
          type: "event",
        },
        id: `meeting:${meeting.id}`,
        start: hasTime(meetingStart) ? meetingStart : asDateOnly(meetingStart),
        title: prependContextLabel(`Meeting: ${meeting.title}`, contextLabel),
      };
    });

  return [...milestoneEvents, ...taskEvents, ...manufacturingEvents, ...meetingEvents];
}

export function isTaskDueSoon(dueDate: string, today = new Date()) {
  const parsedDue = parseLocalDate(asDateOnly(dueDate));
  if (!parsedDue) {
    return false;
  }

  const normalizedToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedDue = Date.UTC(
    parsedDue.getFullYear(),
    parsedDue.getMonth(),
    parsedDue.getDate(),
  );
  const diffDays = (normalizedDue - normalizedToday) / CALENDAR_MS_PER_DAY;
  return diffDays >= 0 && diffDays <= 7;
}
