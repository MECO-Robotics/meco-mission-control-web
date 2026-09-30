import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { isMeetingVisibleInProjectScope } from "@/features/workspace/shared/events";
import { getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";
import { parseLocalDate } from "@/lib/dateUtils";

export type TaskCalendarEventType =
  | "milestone"
  | "task-due"
  | "qa-due"
  | "meeting"
  | "event";

export interface TaskCalendarEventProps {
  contextLabel: string | null;
  priority?: string;
  recordId: string;
  status?: string;
  type: TaskCalendarEventType;
}

export interface TaskCalendarEvent {
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
        extendedProps: {
          contextLabel,
          priority: task.priority,
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
        extendedProps: {
          contextLabel,
          recordId: milestone.id,
          status: milestone.status,
          type: "milestone",
        },
        id: `milestone:${milestone.id}`,
        start: milestone.startAt,
        title: prependContextLabel(milestone.title, contextLabel),
      };
    });

  const meetingEvents: TaskCalendarEvent[] = (bootstrap.meetings ?? [])
    .filter((meeting) => isMeetingVisibleInProjectScope(meeting, activeProjectIds))
    .map((meeting) => {
      const meetingStart = meeting.startAt;
      const contextLabel = buildProjectContextLabel({
        isAllProjectsView,
        projectIds: meeting.projectIds ?? [],
        projectsById,
      });

      return {
        extendedProps: {
          contextLabel,
          recordId: meeting.id,
          status: meeting.meetingType,
          type: "meeting",
        },
        id: `meeting:${meeting.id}`,
        start: hasTime(meetingStart) ? meetingStart : asDateOnly(meetingStart),
        title: prependContextLabel(`Meeting: ${meeting.title}`, contextLabel),
      };
    });

  const eventEvents: TaskCalendarEvent[] = bootstrap.events
    .filter((event) => isMeetingVisibleInProjectScope(event, activeProjectIds))
    .map((event) => {
      const contextLabel = buildProjectContextLabel({
        isAllProjectsView,
        projectIds: event.projectIds,
        projectsById,
      });
      return {
        extendedProps: { contextLabel, recordId: event.id, status: event.eventType, type: "event" },
        id: `event:${event.id}`,
        start: hasTime(event.startAt) ? event.startAt : asDateOnly(event.startAt),
        title: prependContextLabel(event.title, contextLabel),
      };
    });

  return [...milestoneEvents, ...taskEvents, ...meetingEvents, ...eventEvents];
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
