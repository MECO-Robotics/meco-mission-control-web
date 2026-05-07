import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";

import { readTaskAssigneeIds, readTaskSubsystemIds, readTaskWorkstreamIds, formatSubsystemNames, formatWorkstreamNames } from "./taskQueueKanbanCard";

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

export function getTaskQueueCardContextAccentColor(
  task: TaskRecord,
  projectType: BootstrapPayload["projects"][number]["projectType"] | undefined,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>,
) {
  const contextSource =
    projectType === "robot"
      ? subsystemsById[readTaskSubsystemIds(task)[0] ?? ""] ?? null
      : workstreamsById[readTaskWorkstreamIds(task)[0] ?? ""] ?? null;

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
