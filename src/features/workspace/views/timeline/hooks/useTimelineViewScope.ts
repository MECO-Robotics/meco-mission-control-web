import { useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { isMeetingVisibleInProjectScope } from "@/features/workspace/shared/events";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionMatchesTaskPeople,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  filterTimelineMilestonesByProjectSelection,
  filterTimelineTasks,
  hasActiveTimelineTaskFilters,
  readTimelineTaskSubsystemIds,
  resolveTimelineFilteredProjectIds,
  type TimelineTaskFilters,
} from "../model/timelineViewFilters";
import { filterTimelineMilestonesByPersonSelection } from "../model/timelineViewDataPresentation";

interface UseTimelineViewScopeArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  searchFilter: string;
  timelineFilters: TimelineTaskFilters;
}

function buildLookupMap<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, T>;
}

export function useTimelineViewScope({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  searchFilter,
  timelineFilters,
}: UseTimelineViewScopeArgs) {
  const projectsById = useMemo(() => buildLookupMap(bootstrap.projects), [bootstrap.projects]);
  const subsystemsById = useMemo(() => buildLookupMap(bootstrap.subsystems), [bootstrap.subsystems]);
  const disciplinesById = useMemo(() => buildLookupMap(bootstrap.disciplines), [bootstrap.disciplines]);
  const tasksById = useMemo(() => buildLookupMap(bootstrap.tasks), [bootstrap.tasks]);
  const scopedProjectIds = useMemo(() => bootstrap.projects.map((project) => project.id), [bootstrap.projects]);
  const filteredProjectIds = useMemo(
    () =>
      resolveTimelineFilteredProjectIds({
        isAllProjectsView,
        projectFilter: timelineFilters.projectFilter,
        scopedProjectIds,
      }),
    [isAllProjectsView, scopedProjectIds, timelineFilters.projectFilter],
  );
  const filteredProjectIdSet = useMemo(() => new Set(filteredProjectIds), [filteredProjectIds]);
  const normalizedSearch = searchFilter.trim().toLowerCase();
  const scopedTasksByPerson = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
        : bootstrap.tasks,
    [activePersonFilter, bootstrap.tasks],
  );
  const scopedTasksByFilters = useMemo(
    () =>
      filterTimelineTasks({
        bootstrap,
        isAllProjectsView,
        tasks: scopedTasksByPerson,
        ...timelineFilters,
      }),
    [bootstrap, isAllProjectsView, scopedTasksByPerson, timelineFilters],
  );
  const hasTimelineTaskFilters = hasActiveTimelineTaskFilters({
    isAllProjectsView,
    ...timelineFilters,
  });
  const scopedTasks = useMemo(() => {
    if (normalizedSearch.length === 0) {
      return scopedTasksByFilters;
    }

    return scopedTasksByFilters.filter((task) => {
      const subsystemIds = readTimelineTaskSubsystemIds(task);
      const subsystemLabels = subsystemIds.map((subsystemId) => subsystemsById[subsystemId]?.name ?? "");
      const projectLabel = projectsById[task.projectId]?.name ?? "";

      return [
        task.title,
        task.summary,
        task.status,
        task.priority,
        projectLabel,
        ...subsystemLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [normalizedSearch, projectsById, scopedTasksByFilters, subsystemsById]);
  const scopedSubsystems = useMemo(() => {
    if (normalizedSearch.length === 0 && !hasTimelineTaskFilters) {
      return bootstrap.subsystems;
    }

    const taskSubsystemIds = new Set(scopedTasks.flatMap(readTimelineTaskSubsystemIds));

    return bootstrap.subsystems.filter((subsystem) => {
      if (hasTimelineTaskFilters && !taskSubsystemIds.has(subsystem.id)) {
        return false;
      }

      const projectLabel = projectsById[subsystem.projectId]?.name ?? "";
      const subsystemMatches = [subsystem.name, projectLabel]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      return subsystemMatches || taskSubsystemIds.has(subsystem.id);
    });
  }, [bootstrap.subsystems, hasTimelineTaskFilters, normalizedSearch, projectsById, scopedTasks]);
  const scopedMilestones = useMemo(() => {
    const milestonesByPerson = filterTimelineMilestonesByPersonSelection({
      activePersonFilter,
      milestones: bootstrap.milestones,
      tasks: bootstrap.tasks,
    });
    const milestonesByProject = filterTimelineMilestonesByProjectSelection({
      isAllProjectsView,
      milestones: milestonesByPerson,
      projectFilter: timelineFilters.projectFilter,
      scopedProjectIdSet: filteredProjectIdSet,
    });

    if (normalizedSearch.length === 0) {
      return milestonesByProject;
    }

    return milestonesByProject.filter((milestone) => {
      const projectLabels = milestone.projectIds.map((projectId) => projectsById[projectId]?.name ?? "");

      return [
        milestone.title,
        milestone.description,
        milestone.type,
        milestone.status,
        ...projectLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [
    activePersonFilter,
    bootstrap.milestones,
    bootstrap.tasks,
    isAllProjectsView,
    normalizedSearch,
    projectsById,
    filteredProjectIdSet,
    timelineFilters.projectFilter,
  ]);
  const scopedMeetings = useMemo(() => {
    const meetings = (bootstrap.meetings ?? []).filter((meeting) =>
      isMeetingVisibleInProjectScope(meeting, filteredProjectIdSet),
    );
    if (normalizedSearch.length === 0) {
      return meetings;
    }

    return meetings.filter((meeting) => {
      const projectLabels = (meeting.projectIds ?? []).map((projectId) => projectsById[projectId]?.name ?? "");

      return [
        meeting.title,
        meeting.meetingType,
        meeting.location,
        meeting.description,
        ...projectLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [bootstrap.meetings, filteredProjectIdSet, normalizedSearch, projectsById]);
  const timelineFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    searchFilter,
    timelineFilters.disciplineFilter,
    timelineFilters.priorityFilter,
    timelineFilters.projectFilter,
    timelineFilters.statusFilter,
    timelineFilters.subsystemFilter,
  ]);

  return {
    disciplinesById,
    projectsById,
    scopedMeetings,
    scopedMilestones,
    scopedProjectIds,
    scopedSubsystems,
    scopedTasks,
    subsystemsById,
    tasksById,
    timelineFilterMotionClass,
  };
}
