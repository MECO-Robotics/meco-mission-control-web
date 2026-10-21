import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";
import {
  getMilestoneProjectIds,
  isProjectScopedEventVisible,
} from "@/features/workspace/shared/events";
import { TASK_PRIORITY_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  type FilterSelection,
  filterSelectionIncludes,
  filterSelectionMatchesTaskPeople,
  filterSelectionIntersects,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  getWorkspaceFilterToneClassName,
  getWorkspaceStatusToneClassName,
} from "@/features/workspace/shared/filters/workspaceFilterTone";
import { normalizeTaskTargetIds } from "@/features/workspace/shared/task/normalizeTaskTargetIds";

import { formatIterationVersion } from "@/lib/appUtils/common";
import { TASK_QUEUE_STATUS_OPTIONS } from "../../taskQueue/taskQueueKanbanBoardState";
import { getTimelineTaskStatusSignal } from "../timelineGridBodyUtils";

export interface TimelineTaskFilters {
  workTypeFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  responsibleGroupFilter?: FilterSelection;
}

export const TIMELINE_TASK_STATUS_OPTIONS: DropdownOption[] = TASK_QUEUE_STATUS_OPTIONS;
export const TIMELINE_TASK_PRIORITY_OPTIONS: DropdownOption[] = TASK_PRIORITY_OPTIONS;

export function readTimelineTaskSubsystemIds(task: TaskRecord) {
  return normalizeTaskTargetIds(task.subsystemIds);
}

export function buildTimelineSubsystemFilterOptions(bootstrap: BootstrapPayload): DropdownOption[] {
  return [
    ...bootstrap.subsystems.map((subsystem) => ({
      id: subsystem.id,
      name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
    })),
    ...bootstrap.workstreams.map((workstream) => ({ id: workstream.id, name: workstream.name })),
  ];
}

export function buildTimelineWorkTypeFilterOptions(bootstrap: BootstrapPayload): DropdownOption[] {
  return bootstrap.workTypes.map((workType) => ({
    id: workType.id,
    name: workType.name,
  }));
}

export function filterTimelineTasks({
  bootstrap,
  workTypeFilter,
  isAllProjectsView,
  priorityFilter,
  projectFilter,
  statusFilter,
  subsystemFilter,
  responsibleGroupFilter = [],
  tasks,
}: TimelineTaskFilters & {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  tasks: TaskRecord[];
}) {
  let result = [...tasks];

  if (isAllProjectsView && projectFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(projectFilter, task.projectId));
  }
  if (workTypeFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(workTypeFilter, task.workTypeId));
  }
  if (subsystemFilter.length > 0) {
    result = result.filter((task) =>
      filterSelectionIntersects(subsystemFilter, [...readTimelineTaskSubsystemIds(task), ...task.workstreamIds]),
    );
  }
  if (responsibleGroupFilter.length > 0) {
    result = result.filter((task) => !!task.responsibleGroupId && filterSelectionIncludes(responsibleGroupFilter, task.responsibleGroupId));
  }
  if (statusFilter.length > 0) {
    result = result.filter((task) =>
      filterSelectionIncludes(statusFilter, getTimelineTaskStatusSignal(task, bootstrap)),
    );
  }
  if (priorityFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(priorityFilter, task.priority));
  }

  return result;
}

export function filterTimelineMilestonesByProjectSelection({
  isAllProjectsView,
  milestones,
  projectFilter,
  scopedProjectIdSet,
}: {
  isAllProjectsView: boolean;
  milestones: MilestoneRecord[];
  projectFilter: FilterSelection;
  scopedProjectIdSet: ReadonlySet<string>;
}) {
  if (!isAllProjectsView || projectFilter.length === 0) {
    return milestones;
  }

  return milestones.filter((milestone) =>
    isProjectScopedEventVisible(getMilestoneProjectIds(milestone), scopedProjectIdSet),
  );
}

export function resolveTimelineFilteredProjectIds({
  isAllProjectsView,
  projectFilter,
  scopedProjectIds,
}: {
  isAllProjectsView: boolean;
  projectFilter: FilterSelection;
  scopedProjectIds: string[];
}) {
  if (!isAllProjectsView || projectFilter.length === 0) {
    return scopedProjectIds;
  }

  return scopedProjectIds.filter((projectId) => projectFilter.includes(projectId));
}

export function hasActiveTimelineTaskFilters({
  workTypeFilter,
  isAllProjectsView,
  priorityFilter,
  projectFilter,
  statusFilter,
  subsystemFilter,
  responsibleGroupFilter = [],
}: TimelineTaskFilters & { isAllProjectsView: boolean }) {
  return [
    isAllProjectsView ? projectFilter : [],
    workTypeFilter,
    subsystemFilter,
    responsibleGroupFilter,
    statusFilter,
    priorityFilter,
  ].some((selection) => selection.length > 0);
}

export function countActiveTimelineFilters({
  activePersonFilter,
  workTypeFilter,
  isAllProjectsView,
  priorityFilter,
  projectFilter,
  statusFilter,
  subsystemFilter,
  responsibleGroupFilter = [],
}: TimelineTaskFilters & {
  activePersonFilter: FilterSelection;
  isAllProjectsView: boolean;
}) {
  return [
    activePersonFilter,
    isAllProjectsView ? projectFilter : [],
    workTypeFilter,
    subsystemFilter,
    responsibleGroupFilter,
    statusFilter,
    priorityFilter,
  ].filter((selection) => selection.length > 0).length;
}

export const getTimelineFilterToneClassName = getWorkspaceFilterToneClassName;
export const getTimelineStatusToneClassName = getWorkspaceStatusToneClassName;

export function filterTimelineMilestonesByTaskSelection({
  activePersonFilter,
  responsibleGroupFilter = [],
  milestones,
  tasks,
}: {
  activePersonFilter: FilterSelection;
  responsibleGroupFilter?: FilterSelection;
  milestones: BootstrapPayload["milestones"];
  tasks: BootstrapPayload["tasks"];
}) {
  if (activePersonFilter.length === 0 && responsibleGroupFilter.length === 0) {
    return milestones;
  }

  const matchingMilestoneIds = new Set(
    tasks.flatMap((task) =>
      (activePersonFilter.length === 0 || filterSelectionMatchesTaskPeople(activePersonFilter, task)) &&
      (responsibleGroupFilter.length === 0 || (!!task.responsibleGroupId && responsibleGroupFilter.includes(task.responsibleGroupId)))
        ? task.scheduleRefs.filter((ref) => ref.kind === "milestone").map((ref) => ref.id)
        : [],
    ),
  );

  return milestones.filter((milestone) => matchingMilestoneIds.has(milestone.id));
}
