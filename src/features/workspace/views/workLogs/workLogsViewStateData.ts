import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkLogRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionIncludes, filterSelectionIntersects } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import type { WorkLogSortMode } from "./workLogsViewState";

export type WorkLogsTopContributor = {
  id: string;
  hours: number;
  name: string;
};

export type WorkLogsTopTask = {
  hours: number;
  id: string;
  subsystemName: string;
  title: string;
};

export type WorkLogsSummaryState = {
  activeContributorCount: number;
  averageHoursPerLog: number;
  clampedCompletionWidth: string;
  isOverPlan: boolean;
  loggedHours: number;
  maxMetricHours: number;
  overrunHours: number;
  plannedHours: number;
  remainingHours: number;
  tasksWithLogsCount: number;
  totalLogs: number;
  topContributors: WorkLogsTopContributor[];
  topTasks: WorkLogsTopTask[];
};

export function buildTaskById(tasks: BootstrapPayload["tasks"]) {
  return Object.fromEntries(tasks.map((task) => [task.id, task] as const)) as Record<
    string,
    BootstrapPayload["tasks"][number]
  >;
}

export function filterSummaryWorkLogs(
  workLogs: BootstrapPayload["workLogs"],
  activePersonFilter: FilterSelection,
  search: string,
  membersById: MembersById,
  subsystemsById: SubsystemsById,
  taskById: Record<string, BootstrapPayload["tasks"][number]>,
) {
  const query = search.trim().toLowerCase();

  return workLogs.filter((workLog) => {
    if (
      activePersonFilter.length > 0 &&
      !workLog.participantIds.some((participantId) =>
        filterSelectionIncludes(activePersonFilter, participantId),
      )
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return workLogMatchesSearch({
      membersById,
      query,
      subsystemsById,
      task: taskById[workLog.taskId],
      workLog,
    });
  });
}

export function buildWorkLogsSummaryState({
  activePersonFilter,
  bootstrap,
  membersById,
  subsystemsById,
  summaryWorkLogs,
  taskById,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  subsystemsById: SubsystemsById;
  summaryWorkLogs: BootstrapPayload["workLogs"];
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
}): WorkLogsSummaryState {
  const summaryTaskIds = new Set(summaryWorkLogs.map((workLog) => workLog.taskId));
  const taskPool =
    activePersonFilter.length === 0
      ? bootstrap.tasks
      : bootstrap.tasks.filter((task) => summaryTaskIds.has(task.id));
  const plannedHours = taskPool.reduce(
    (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
    0,
  );
  const loggedHours = summaryWorkLogs.reduce(
    (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
    0,
  );

  const totalLogs = summaryWorkLogs.length;
  const tasksWithLogsCount = summaryTaskIds.size;
  const contributorIds = new Set<string>();
  summaryWorkLogs.forEach((workLog) => {
    workLog.participantIds.forEach((participantId) => contributorIds.add(participantId));
  });

  const averageHoursPerLog = totalLogs > 0 ? loggedHours / totalLogs : 0;
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const completionRatio = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, completionRatio * 100))}%`;
  const isOverPlan = loggedHours > plannedHours;
  const overrunHours = Math.max(0, loggedHours - plannedHours);
  const remainingHours = Math.max(0, plannedHours - loggedHours);

  const contributorHours = new Map<string, number>();
  summaryWorkLogs.forEach((workLog) => {
    if (workLog.participantIds.length === 0) {
      contributorHours.set(
        "__unassigned__",
        (contributorHours.get("__unassigned__") ?? 0) + workLog.hours,
      );
      return;
    }

    const sharedHours = workLog.hours / workLog.participantIds.length;
    workLog.participantIds.forEach((participantId) => {
      contributorHours.set(participantId, (contributorHours.get(participantId) ?? 0) + sharedHours);
    });
  });

  const topContributors = Array.from(contributorHours.entries())
    .map(([participantId, hours]) => ({
      id: participantId,
      name:
        participantId === "__unassigned__"
          ? "Unassigned"
          : membersById[participantId]?.name ?? "Unknown member",
      hours,
    }))
    .sort((left, right) => right.hours - left.hours)
    .slice(0, 5);

  const taskHours = new Map<string, number>();
  summaryWorkLogs.forEach((workLog) => {
    taskHours.set(workLog.taskId, (taskHours.get(workLog.taskId) ?? 0) + workLog.hours);
  });

  const topTasks = Array.from(taskHours.entries())
    .map(([taskId, hours]) => {
      const task = taskById[taskId];
      const subsystemName = task
        ? task.subsystemIds
            .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
            .filter(Boolean)
            .join(", ") || "Unknown subsystem"
        : "Unknown subsystem";

      return {
        hours,
        id: taskId,
        subsystemName,
        title: task?.title ?? "Missing task",
      };
    })
    .sort((left, right) => right.hours - left.hours)
    .slice(0, 5);

  return {
    activeContributorCount: contributorIds.size,
    averageHoursPerLog,
    clampedCompletionWidth,
    isOverPlan,
    loggedHours,
    maxMetricHours,
    overrunHours,
    plannedHours,
    remainingHours,
    tasksWithLogsCount,
    totalLogs,
    topContributors,
    topTasks,
  };
}

export function filterAndSortWorkLogs({
  activePersonFilter,
  membersById,
  search,
  sortMode,
  subsystemsById,
  subsystemFilter,
  taskById,
  workLogs,
}: {
  activePersonFilter: FilterSelection;
  membersById: MembersById;
  search: string;
  sortMode: WorkLogSortMode;
  subsystemsById: SubsystemsById;
  subsystemFilter: FilterSelection;
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
  workLogs: BootstrapPayload["workLogs"];
}): WorkLogRecord[] {
  const query = search.trim().toLowerCase();
  const filtered = workLogs.filter((workLog) => {
    if (
      activePersonFilter.length > 0 &&
      !workLog.participantIds.some((participantId) =>
        filterSelectionIncludes(activePersonFilter, participantId),
      )
    ) {
      return false;
    }

    const task = taskById[workLog.taskId];
    if (
      subsystemFilter.length > 0 &&
      !filterSelectionIntersects(
        subsystemFilter,
        task ? Array.from(new Set([task.subsystemId, ...task.subsystemIds].filter(Boolean))) : [],
      )
    ) {
      return false;
    }

    if (!query) {
      return true;
    }

    return workLogMatchesSearch({
      membersById,
      query,
      subsystemsById,
      task,
      workLog,
    });
  });

  const compareDate = (left: string, right: string) => left.localeCompare(right);
  return filtered.sort((left, right) => {
    if (sortMode === "longest") {
      return right.hours - left.hours || compareDate(right.date, left.date);
    }

    if (sortMode === "shortest") {
      return left.hours - right.hours || compareDate(right.date, left.date);
    }

    if (sortMode === "oldest") {
      return compareDate(left.date, right.date) || compareDate(left.taskId, right.taskId);
    }

    return compareDate(right.date, left.date) || compareDate(left.taskId, right.taskId);
  });
}

function workLogMatchesSearch({
  membersById,
  query,
  subsystemsById,
  task,
  workLog,
}: {
  membersById: MembersById;
  query: string;
  subsystemsById: SubsystemsById;
  task: BootstrapPayload["tasks"][number] | undefined;
  workLog: WorkLogRecord;
}) {
  const participantNames = workLog.participantIds
    .map((participantId) => membersById[participantId]?.name ?? "")
    .join(" ");
  const subsystemText = task
    ? Array.from(new Set([task.subsystemId, ...task.subsystemIds].filter(Boolean)))
        .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
        .join(" ")
    : "";

  return [
    workLog.notes,
    workLog.date,
    task?.title ?? "",
    task?.summary ?? "",
    participantNames,
    subsystemText,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}
