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

export function readTaskSubsystemIds(task: TaskRecord) {
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

export function readTaskWorkstreamIds(task: TaskRecord) {
  const workstreamIds = Array.isArray(task.workstreamIds) ? task.workstreamIds : [];
  const candidateIds = workstreamIds.length > 0 ? workstreamIds : [task.workstreamId];

  return Array.from(
    new Set(
      candidateIds.filter(
        (workstreamId): workstreamId is string =>
          typeof workstreamId === "string" && workstreamId.length > 0,
      ),
    ),
  );
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

export function formatWorkstreamNames(
  workstreamIds: string[],
  lookup: Record<string, BootstrapPayload["workstreams"][number]>,
  fallback: string,
) {
  return formatNames(workstreamIds, lookup, fallback);
}

function formatTaskAssignees(
  task: TaskRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
) {
  return formatNames(readTaskAssigneeIds(task), membersById, "Unassigned");
}

export function formatTaskQueueAssignees(
  task: TaskRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
) {
  return formatTaskAssignees(task, membersById);
}

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
