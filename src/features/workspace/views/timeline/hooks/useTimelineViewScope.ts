import { useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { indexRecordsById } from "@/features/workspace/shared/model/indexRecordsById";
import { isMeetingVisibleInProjectScope } from "@/features/workspace/shared/events";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  filterTimelineMilestonesByProjectSelection,
  filterTimelineTasks,
  readTimelineTaskSubsystemIds,
  resolveTimelineFilteredProjectIds,
  type TimelineTaskFilters,
} from "../model/timelineViewFilters";
import { filterTimelineMilestonesByTaskSelection } from "../model/timelineViewFilters";

interface UseTimelineViewScopeArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  searchFilter: string;
  timelineFilters: TimelineTaskFilters;
}

export function useTimelineViewScope({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  searchFilter,
  timelineFilters,
}: UseTimelineViewScopeArgs) {
  const projectsById = useMemo(() => indexRecordsById(bootstrap.projects), [bootstrap.projects]);
  const subsystemsById = useMemo(() => indexRecordsById(bootstrap.subsystems), [bootstrap.subsystems]);
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
  const workstreamsById = useMemo(() => indexRecordsById(bootstrap.workstreams), [bootstrap.workstreams]);
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
  const scopedTasks = useMemo(() => {
    if (normalizedSearch.length === 0) {
      return scopedTasksByFilters;
    }

    return scopedTasksByFilters.filter((task) => {
      const subsystemIds = readTimelineTaskSubsystemIds(task);
      const subsystemLabels = subsystemIds.map((subsystemId) => subsystemsById[subsystemId]?.name ?? "");
      const projectLabel = projectsById[task.projectId]?.name ?? "";
      const workstreamLabels = task.workstreamIds.map((id) => workstreamsById[id]?.name ?? "");

      return [
        task.title,
        task.summary,
        task.status,
        task.priority,
        projectLabel,
        ...subsystemLabels,
        ...workstreamLabels,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [normalizedSearch, projectsById, scopedTasksByFilters, subsystemsById, workstreamsById]);
  const scopedMilestones = useMemo(() => {
    const milestonesByPerson = filterTimelineMilestonesByTaskSelection({
      activePersonFilter,
      responsibleGroupFilter: timelineFilters.responsibleGroupFilter,
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
    timelineFilters.responsibleGroupFilter,
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
  return { projectsById, scopedMeetings, scopedMilestones, scopedTasks };
}
