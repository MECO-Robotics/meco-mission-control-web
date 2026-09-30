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
  disciplineFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
}

export const TIMELINE_TASK_STATUS_OPTIONS: DropdownOption[] = TASK_QUEUE_STATUS_OPTIONS;
export const TIMELINE_TASK_PRIORITY_OPTIONS: DropdownOption[] = TASK_PRIORITY_OPTIONS;

export function readTimelineTaskSubsystemIds(task: TaskRecord) {
  return normalizeTaskTargetIds(task.subsystemIds);
}

export function buildTimelineSubsystemFilterOptions(bootstrap: BootstrapPayload): DropdownOption[] {
  return bootstrap.subsystems.map((subsystem) => ({
    id: subsystem.id,
    name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
  }));
}

export function buildTimelineDisciplineFilterOptions(bootstrap: BootstrapPayload): DropdownOption[] {
  return bootstrap.workTypes.map((discipline) => ({
    id: discipline.id,
    name: discipline.name,
  }));
}

export function filterTimelineTasks({
  bootstrap,
  disciplineFilter,
  isAllProjectsView,
  priorityFilter,
  projectFilter,
  statusFilter,
  subsystemFilter,
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
  if (disciplineFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(disciplineFilter, task.workTypeId));
  }
  if (subsystemFilter.length > 0) {
    result = result.filter((task) =>
      filterSelectionIntersects(subsystemFilter, readTimelineTaskSubsystemIds(task)),
    );
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
  disciplineFilter,
  isAllProjectsView,
  priorityFilter,
  projectFilter,
  statusFilter,
  subsystemFilter,
}: TimelineTaskFilters & { isAllProjectsView: boolean }) {
  return [
    isAllProjectsView ? projectFilter : [],
    disciplineFilter,
    subsystemFilter,
    statusFilter,
    priorityFilter,
  ].some((selection) => selection.length > 0);
}

export function countActiveTimelineFilters({
  activePersonFilter,
  disciplineFilter,
  isAllProjectsView,
  priorityFilter,
  projectFilter,
  statusFilter,
  subsystemFilter,
}: TimelineTaskFilters & {
  activePersonFilter: FilterSelection;
  isAllProjectsView: boolean;
}) {
  return [
    activePersonFilter,
    isAllProjectsView ? projectFilter : [],
    disciplineFilter,
    subsystemFilter,
    statusFilter,
    priorityFilter,
  ].filter((selection) => selection.length > 0).length;
}

export const getTimelineFilterToneClassName = getWorkspaceFilterToneClassName;
export const getTimelineStatusToneClassName = getWorkspaceStatusToneClassName;
