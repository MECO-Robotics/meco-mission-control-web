import { useMemo, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatLocalDate } from "@/lib/dateUtils";
import {
  buildTaskCalendarEvents,
  type TaskCalendarEvent,
  type TaskCalendarEventType,
} from "./taskCalendarEvents";
import {
  createMonthCells,
  createWeekCells,
  sortTaskCalendarEvents,
  toEventDateKey,
  type TaskCalendarSortMode,
} from "./taskCalendarLayout";

export function useTaskCalendarEventData({
  activePersonFilter,
  bootstrap,
  eventFilter,
  onEventFilterChange,
  isAllProjectsView,
  sortMode,
  onSortModeChange,
  sortDirection,
  onSortDirectionChange,
  searchFilter: controlledSearchFilter,
  onSearchChange,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  eventFilter: "all" | TaskCalendarEventType;
  onEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  isAllProjectsView: boolean;
  sortMode: TaskCalendarSortMode;
  onSortModeChange: (value: TaskCalendarSortMode) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (value: "asc" | "desc") => void;
  searchFilter?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [localSearchFilter, setLocalSearchFilter] = useState("");
  const searchFilter = controlledSearchFilter ?? localSearchFilter;
  const setSearchFilter = onSearchChange ?? setLocalSearchFilter;
  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const todayDateKey = useMemo(() => formatLocalDate(new Date()), []);
  const projectsById = useMemo(
    () => Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const)),
    [bootstrap.projects],
  );
  const tasksById = useMemo(
    () => Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const)),
    [bootstrap.tasks],
  );
  const milestonesById = useMemo(
    () => Object.fromEntries(bootstrap.milestones.map((milestone) => [milestone.id, milestone] as const)),
    [bootstrap.milestones],
  );
  const scopedProjectIds = useMemo(
    () => bootstrap.projects.map((project) => project.id),
    [bootstrap.projects],
  );
  const unfilteredEvents = useMemo(
    () =>
      buildTaskCalendarEvents({
        activePersonFilter,
        bootstrap,
        isAllProjectsView,
        projectsById,
      }),
    [activePersonFilter, bootstrap, isAllProjectsView, projectsById],
  );
  const events = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase();
    let scopedEvents =
      eventFilter === "all"
        ? unfilteredEvents
        : unfilteredEvents.filter((event) => event.extendedProps.type === eventFilter);

    if (normalizedSearch.length > 0) {
      scopedEvents = scopedEvents.filter((event) =>
        [
          event.title,
          event.extendedProps.contextLabel,
          event.extendedProps.priority,
          event.extendedProps.status,
          event.extendedProps.type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      );
    }

    return sortTaskCalendarEvents(scopedEvents, sortMode, sortDirection);
  }, [eventFilter, searchFilter, sortDirection, sortMode, unfilteredEvents]);
  const monthCells = useMemo(() => createMonthCells(monthCursor), [monthCursor]);
  const weekCells = useMemo(() => createWeekCells(monthCursor), [monthCursor]);
  const eventsByDateKey = useMemo(() => {
    const grouped = new Map<string, TaskCalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = toEventDateKey(event.start);
      grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), event]);
    });
    return grouped;
  }, [events]);
  return {
    eventFilter,
    events,
    eventsByDateKey,
    milestonesById,
    monthCells,
    weekCells,
    monthCursor,
    projectsById,
    scopedProjectIds,
    searchFilter,
    setEventFilter: onEventFilterChange,
    setMonthCursor,
    setSearchFilter,
    setSortMode: onSortModeChange,
    setSortDirection: onSortDirectionChange,
    sortDirection,
    sortMode,
    tasksById,
    todayDateKey,
    unfilteredEvents,
  };
}
