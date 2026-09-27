import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

import { formatIterationVersion } from "@/lib/appUtils/common";
import { filterSelectionIncludes, filterSelectionIntersects, filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import { getTaskQueueBoardState } from "./taskQueueKanbanBoardState";

function formatNames(
  ids: string[],
  lookup: Record<string, { name?: string }>,
  fallback: string,
) {
  if (ids.length === 0) {
    return fallback;
  }

  return ids.map((id) => lookup[id]?.name ?? "Unknown").join(", ");
}

export function readTaskAssigneeIds(task: TaskRecord) {
  const assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];

  return assigneeIds.length > 0
    ? assigneeIds
    : task.ownerId
      ? [task.ownerId]
      : [];
}

function normalizeTaskTargetIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];

  return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)));
}

export function readTaskSubsystemIds(task: TaskRecord) {
  return normalizeTaskTargetIds(task.subsystemIds);
}

export function readTaskWorkstreamIds(task: TaskRecord) {
  return normalizeTaskTargetIds(task.workstreamIds);
}

export function formatSubsystemNames(
  subsystemIds: string[],
  lookup: Record<string, BootstrapPayload["subsystems"][number]>,
  fallback: string,
) {
  if (subsystemIds.length === 0) {
    return fallback;
  }

  return subsystemIds
    .map((subsystemId) => {
      const subsystem = lookup[subsystemId];
      return subsystem
        ? `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`
        : "Unknown";
    })
    .join(", ");
}

export const formatWorkstreamNames = formatNames;

function formatTaskAssignees(
  task: TaskRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
) {
  return formatNames(readTaskAssigneeIds(task), membersById, "Unassigned");
}

export const formatTaskQueueAssignees = formatTaskAssignees;

export function filterTaskQueueTasks(
  tasks: TaskRecord[],
  bootstrap: BootstrapPayload,
  {
    activePersonFilter,
    disciplineFilter,
    isAllProjectsView,
    ownerFilter,
    priorityFilter,
    projectFilter,
    searchFilter,
    statusFilter,
    subsystemFilter,
    subsystemIterationFilter,
    showSubsystemIterationFilter,
    subsystemsById,
  }: {
    activePersonFilter: FilterSelection;
    disciplineFilter: FilterSelection;
    isAllProjectsView: boolean;
    ownerFilter: FilterSelection;
    priorityFilter: FilterSelection;
    projectFilter: FilterSelection;
    searchFilter: string;
    statusFilter: FilterSelection;
    subsystemFilter: FilterSelection;
    subsystemIterationFilter: FilterSelection;
    showSubsystemIterationFilter: boolean;
    subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  },
) {
  let result = [...tasks];

  if (activePersonFilter.length > 0) {
    result = result.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
  }
  if (isAllProjectsView && projectFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(projectFilter, task.projectId));
  }
  if (statusFilter.length > 0) {
    result = result.filter((task) =>
      filterSelectionIncludes(statusFilter, getTaskQueueBoardState(task, bootstrap)),
    );
  }
  if (disciplineFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(disciplineFilter, task.disciplineId));
  }
  if (subsystemFilter.length > 0) {
    result = result.filter((task) =>
      filterSelectionIntersects(subsystemFilter, readTaskSubsystemIds(task)),
    );
  }
  if (showSubsystemIterationFilter && subsystemIterationFilter.length > 0) {
    result = result.filter((task) =>
      readTaskSubsystemIds(task).some((subsystemId) => {
        const subsystemIteration = subsystemsById[subsystemId]?.iteration;

        return (
          typeof subsystemIteration === "number" &&
          subsystemIterationFilter.includes(`${subsystemIteration}`)
        );
      }),
    );
  }
  if (ownerFilter.length > 0) {
    result = result.filter((task) =>
      readTaskAssigneeIds(task).some((assigneeId) => ownerFilter.includes(assigneeId)),
    );
  }
  if (priorityFilter.length > 0) {
    result = result.filter((task) => filterSelectionIncludes(priorityFilter, task.priority));
  }
  if (searchFilter.trim() !== "") {
    const search = searchFilter.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(search) || task.summary.toLowerCase().includes(search),
    );
  }

  return result;
}
