import { useMemo, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  buildTaskCalendarEvents,
  type TaskCalendarEvent,
  type TaskCalendarEventType,
} from "./taskCalendarEvents";
import {
  createMonthCells,
  formatDateKey,
  sortTaskCalendarEvents,
  toEventDateKey,
  type TaskCalendarSortMode,
} from "./taskCalendarLayout";

export function useTaskCalendarEventData({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
}) {
  const [eventFilter, setEventFilter] = useState<"all" | TaskCalendarEventType>("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [sortMode, setSortMode] = useState<TaskCalendarSortMode>("date");
  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const todayDateKey = useMemo(() => formatDateKey(new Date()), []);
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

    return sortTaskCalendarEvents(scopedEvents, sortMode);
  }, [eventFilter, searchFilter, sortMode, unfilteredEvents]);
  const monthCells = useMemo(() => createMonthCells(monthCursor), [monthCursor]);
  const eventsByDateKey = useMemo(() => {
    const grouped = new Map<string, TaskCalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = toEventDateKey(event.start);
      grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), event]);
    });
    return grouped;
  }, [events]);
  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return {
    eventFilter,
    events,
    eventsByDateKey,
    milestonesById,
    monthCells,
    monthCursor,
    monthLabel,
    projectsById,
    scopedProjectIds,
    searchFilter,
    setEventFilter,
    setMonthCursor,
    setSearchFilter,
    setSortMode,
    sortMode,
    tasksById,
    todayDateKey,
    unfilteredEvents,
  };
}
