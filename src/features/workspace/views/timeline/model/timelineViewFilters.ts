import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { TASK_PRIORITY_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  type FilterSelection,
  filterSelectionIncludes,
  filterSelectionIntersects,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";

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

const FILTER_TONE_CLASSES = [
  "filter-tone-info",
  "filter-tone-success",
  "filter-tone-warning",
  "filter-tone-danger",
  "filter-tone-neutral",
] as const;

export function readTimelineTaskSubsystemIds(task: TaskRecord) {
  const subsystemIds = Array.isArray(task.subsystemIds) ? task.subsystemIds : [];
  const candidateIds = subsystemIds.length > 0 ? subsystemIds : [task.subsystemId];

  return Array.from(
    new Set(
      candidateIds.filter(
        (subsystemId): subsystemId is string =>
          typeof subsystemId === "string" && subsystemId.length > 0,
      ),
    ),
  );
}

export function buildTimelineSubsystemFilterOptions(bootstrap: BootstrapPayload): DropdownOption[] {
  return bootstrap.subsystems.map((subsystem) => ({
    id: subsystem.id,
    name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
  }));
}

export function buildTimelineDisciplineFilterOptions(bootstrap: BootstrapPayload): DropdownOption[] {
  return bootstrap.disciplines.map((discipline) => ({
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
    result = result.filter((task) => filterSelectionIncludes(disciplineFilter, task.disciplineId));
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

export function getTimelineFilterToneClassName(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return FILTER_TONE_CLASSES[hash % FILTER_TONE_CLASSES.length];
}

export function getTimelineStatusToneClassName(value: string) {
  switch (value) {
    case "in-progress":
    case "waiting-on-dependency":
      return "filter-tone-warning";
    case "waiting-for-qa":
      return "filter-tone-info";
    case "complete":
      return "filter-tone-success";
    case "blocked":
      return "filter-tone-danger";
    case "not-started":
    default:
      return "filter-tone-neutral";
  }
}
