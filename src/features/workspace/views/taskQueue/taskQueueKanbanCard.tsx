import type { BootstrapPayload, TaskRecord } from "@/types";

import { formatIterationVersion } from "@/lib/appUtils";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model";
import {
  filterSelectionIncludes,
  filterSelectionIntersects,
  filterSelectionMatchesTaskPeople,
  type FilterSelection,
} from "@/features/workspace/shared";

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

function readTaskWorkstreamIds(task: TaskRecord) {
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

const FILTER_TONE_CLASSES = [
  "filter-tone-info",
  "filter-tone-success",
  "filter-tone-warning",
  "filter-tone-danger",
  "filter-tone-neutral",
] as const;

function getStableToneClassName(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return FILTER_TONE_CLASSES[hash % FILTER_TONE_CLASSES.length];
}

export function getTaskCardPerson(
  task: TaskRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
) {
  const personId = readTaskAssigneeIds(task)[0];
  return personId ? membersById[personId] ?? null : null;
}

export function getMemberInitial(member: { name: string }) {
  return member.name.trim().slice(0, 1).toUpperCase() || "?";
}

export function getTaskQueueCardContextToneClassName(
  task: TaskRecord,
  projectType: BootstrapPayload["projects"][number]["projectType"] | undefined,
) {
  const toneSourceId =
    projectType === "robot" ? readTaskSubsystemIds(task)[0] : readTaskWorkstreamIds(task)[0];

  return toneSourceId ? getStableToneClassName(toneSourceId) : "filter-tone-neutral";
}

function getTaskQueueCardContextSource(
  task: TaskRecord,
  projectType: BootstrapPayload["projects"][number]["projectType"] | undefined,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>,
) {
  if (projectType === "robot") {
    const subsystemId = readTaskSubsystemIds(task)[0];
    return subsystemId ? subsystemsById[subsystemId] ?? null : null;
  }

  const workstreamId = readTaskWorkstreamIds(task)[0];
  return workstreamId ? workstreamsById[workstreamId] ?? null : null;
}

export function getTaskQueueCardContextAccentColor(
  task: TaskRecord,
  projectType: BootstrapPayload["projects"][number]["projectType"] | undefined,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>,
) {
  const contextSource = getTaskQueueCardContextSource(
    task,
    projectType,
    subsystemsById,
    workstreamsById,
  );

  return contextSource
    ? resolveWorkspaceColor(contextSource.color ?? null, contextSource.id)
    : resolveWorkspaceColor(null, task.id);
}

export function getTaskQueueCardContextLabel(
  task: TaskRecord,
  projectType: BootstrapPayload["projects"][number]["projectType"] | undefined,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>,
) {
  if (projectType === "robot") {
    return formatSubsystemNames(readTaskSubsystemIds(task), subsystemsById, "Unassigned subsystem");
  }

  return formatWorkstreamNames(readTaskWorkstreamIds(task), workstreamsById, "Unassigned workflow");
}

function getTaskPriorityLabel(priority: TaskRecord["priority"]) {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Priority";
  }
}

function TaskPriorityIcon({ priority }: { priority: TaskRecord["priority"] }) {
  switch (priority) {
    case "critical":
      return (
        <>
          <path d="m6 14 6-6 6 6" />
          <path d="m6 9 6-6 6 6" />
        </>
      );
    case "high":
      return (
        <>
          <path d="m6 14 6-6 6 6" />
        </>
      );
    case "medium":
      return (
        <>
          <path d="M6 9h12" />
          <path d="M6 15h12" />
        </>
      );
    case "low":
      return (
        <>
          <path d="m6 10 6 6 6-6" />
        </>
      );
    default:
      return null;
  }
}

export function TaskPriorityBadge({ priority }: { priority: TaskRecord["priority"] }) {
  const label = `${getTaskPriorityLabel(priority)} priority`;

  return (
    <svg
      aria-label={label}
      className={`task-queue-board-card-priority task-queue-board-card-priority-${priority}`}
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      height="14"
      viewBox="0 0 24 24"
      width="14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <TaskPriorityIcon priority={priority} />
    </svg>
  );
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
