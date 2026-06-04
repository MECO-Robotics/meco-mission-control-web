import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPlanningState } from "@/types/common";
import type { TaskRecord } from "@/types/recordsExecution";

import {
  getBlockingDownstreamTaskIds,
  getCriticalPathHours,
  getOpenTaskBlockers,
  getTaskById,
  getTaskDependencyRecords,
  HARD_DEPENDENCY_TYPES,
  isTaskDependencySatisfied,
} from "./taskPlanningInternals";

export type PlanningConfidenceField =
  | "due-date"
  | "owner"
  | "target-link"
  | "estimate"
  | "acceptance-criteria";

export interface PlanningConfidenceFieldSummary {
  id: PlanningConfidenceField;
  label: string;
  actionLabel: string;
  count: number;
  missingCount: number;
  missingTaskIds: string[];
}

export interface PlanningConfidenceSummary {
  totalTasks: number;
  confidencePercent: number;
  fields: PlanningConfidenceFieldSummary[];
  completeFieldCount: number;
  possibleFieldCount: number;
}

function getMilestoneById(bootstrap: BootstrapPayload, milestoneId: string) {
  return bootstrap.milestones.find((candidate) => candidate.id === milestoneId) ?? null;
}

function hasTextValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasIdListValue(value: unknown) {
  return Array.isArray(value) && value.some((item) => hasTextValue(item));
}

function hasPositiveNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function hasTaskAcceptanceCriteria(task: TaskRecord) {
  const candidate = task as TaskRecord & {
    acceptanceCriteria?: unknown;
    acceptanceCriteriaItems?: unknown;
    acceptanceCriteriaText?: unknown;
  };

  if (hasTextValue(candidate.acceptanceCriteria) || hasTextValue(candidate.acceptanceCriteriaText)) {
    return true;
  }

  if (hasIdListValue(candidate.acceptanceCriteriaItems)) {
    return true;
  }

  if (Array.isArray(candidate.acceptanceCriteria)) {
    return candidate.acceptanceCriteria.some((item) =>
      typeof item === "string"
        ? hasTextValue(item)
        : Boolean(item && typeof item === "object" && hasTextValue((item as { text?: unknown }).text)),
    );
  }

  return false;
}

function hasTaskTargetLink(task: TaskRecord) {
  return (
    hasTextValue(task.subsystemId) ||
    hasIdListValue(task.subsystemIds) ||
    hasTextValue(task.mechanismId) ||
    hasIdListValue(task.mechanismIds) ||
    hasTextValue(task.partInstanceId) ||
    hasIdListValue(task.partInstanceIds)
  );
}

export function buildPlanningConfidenceSummary(tasks: TaskRecord[]): PlanningConfidenceSummary {
  const checks: Array<{
    id: PlanningConfidenceField;
    label: string;
    actionLabel: string;
    hasValue: (task: TaskRecord) => boolean;
  }> = [
    {
      id: "due-date",
      label: "Due dates",
      actionLabel: "Set due dates",
      hasValue: (task) => hasTextValue(task.dueDate),
    },
    {
      id: "owner",
      label: "Owners",
      actionLabel: "Assign task owners",
      hasValue: (task) => hasTextValue(task.ownerId) || hasIdListValue(task.assigneeIds),
    },
    {
      id: "target-link",
      label: "Subsystem/mechanism links",
      actionLabel: "Link subsystem/mechanism scope",
      hasValue: hasTaskTargetLink,
    },
    {
      id: "estimate",
      label: "Estimates",
      actionLabel: "Add hour estimates",
      hasValue: (task) => hasPositiveNumberValue(task.estimatedHours),
    },
    {
      id: "acceptance-criteria",
      label: "Acceptance criteria",
      actionLabel: "Add acceptance criteria",
      hasValue: hasTaskAcceptanceCriteria,
    },
  ];

  const fields = checks.map((check) => {
    const missingTaskIds: string[] = [];
    let count = 0;

    tasks.forEach((task) => {
      if (check.hasValue(task)) {
        count += 1;
      } else {
        missingTaskIds.push(task.id);
      }
    });

    return {
      id: check.id,
      label: check.label,
      actionLabel: check.actionLabel,
      count,
      missingCount: missingTaskIds.length,
      missingTaskIds,
    };
  });

  const possibleFieldCount = tasks.length * checks.length;
  const completeFieldCount = fields.reduce((sum, field) => sum + field.count, 0);

  return {
    totalTasks: tasks.length,
    confidencePercent:
      possibleFieldCount === 0 ? 100 : Math.round((completeFieldCount / possibleFieldCount) * 100),
    fields,
    completeFieldCount,
    possibleFieldCount,
  };
}

export function getTaskWaitingOnDependencyRecords(
  taskId: string,
  bootstrap: BootstrapPayload,
  now: Date = new Date(),
) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) =>
      dependency.taskId === taskId &&
      HARD_DEPENDENCY_TYPES.has(dependency.dependencyType) &&
      !isTaskDependencySatisfied(dependency, bootstrap, now),
  );
}

export function getTaskPlanningState(
  task: TaskRecord,
  bootstrap: BootstrapPayload,
  now: Date = new Date(),
): TaskPlanningState {
  if (task.planningState) {
    return task.planningState;
  }

  if (task.status === "complete") {
    return "ready";
  }

  if (getOpenTaskBlockers(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencyRecords(task.id, bootstrap, now).length > 0) {
    return "waiting-on-dependency";
  }

  const deadlineDay = task.targetMilestoneId && getMilestoneById(bootstrap, task.targetMilestoneId)
    ? (() => {
        const milestone = getMilestoneById(bootstrap, task.targetMilestoneId);
        const milestoneDay = milestone?.startDateTime.slice(0, 10) ?? task.dueDate;
        return milestoneDay < task.dueDate ? milestoneDay : task.dueDate;
      })()
    : task.dueDate;
  const hoursUntilDeadline = (() => {
    const deadline = new Date(`${deadlineDay}T12:00:00Z`);
    const deltaMs = deadline.getTime() - now.getTime();
    return deltaMs <= 0 ? 0 : deltaMs / (1000 * 60 * 60);
  })();

  if (hoursUntilDeadline <= 0) {
    return "overdue";
  }

  const criticalPathHours = getCriticalPathHours(
    task.id,
    bootstrap,
    new Map<string, number>(),
    new Set<string>(),
  );

  if (criticalPathHours > hoursUntilDeadline) {
    return "at-risk";
  }

  return "ready";
}

export function getTaskOpenBlockersForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getOpenTaskBlockers(taskId, bootstrap);
}

export function getTaskDependencyRecordsForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) => dependency.taskId === taskId || dependency.refId === taskId,
  );
}

export function getTaskWaitingOnDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskWaitingOnDependencyRecords(taskId, bootstrap);
}

export function getTaskBlocksDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecords(bootstrap).filter(
    (dependency) =>
      dependency.refId === taskId &&
      dependency.kind === "task" &&
      HARD_DEPENDENCY_TYPES.has(dependency.dependencyType),
  );
}

export function getTaskWaitingOnTasks(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskWaitingOnDependencyRecords(taskId, bootstrap)
    .filter((dependency) => dependency.kind === "task")
    .map((dependency) => dependency.refId)
    .filter((upstreamTaskId) => getTaskById(bootstrap, upstreamTaskId)?.status !== "complete");
}

export function getTaskBlocksTasks(taskId: string, bootstrap: BootstrapPayload) {
  return getBlockingDownstreamTaskIds(taskId, bootstrap);
}

export function isTaskWaitingOnDependencies(
  task: Pick<TaskRecord, "id" | "status">,
  bootstrap: BootstrapPayload,
  now: Date = new Date(),
) {
  return task.status !== "complete" && getTaskWaitingOnDependencyRecords(task.id, bootstrap, now).length > 0;
}

export function formatTaskPlanningState(state: TaskPlanningState) {
  switch (state) {
    case "ready":
      return "Ready";
    case "waiting-on-dependency":
      return "Waiting on dependency";
    case "blocked":
      return "Blocked";
    case "overdue":
      return "Overdue";
    case "at-risk":
      return "At risk";
    default:
      return state;
  }
}

export function groupTasksByPlanningState(tasks: TaskRecord[], bootstrap: BootstrapPayload) {
  const grouped: Record<TaskPlanningState, TaskRecord[]> = {
    ready: [],
    "waiting-on-dependency": [],
    blocked: [],
    overdue: [],
    "at-risk": [],
  };

  tasks.forEach((task) => {
    const planningState = getTaskPlanningState(task, bootstrap);
    grouped[planningState].push(task);
  });

  return grouped;
}
