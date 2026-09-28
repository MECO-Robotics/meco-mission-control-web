import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkLogRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionIncludes, filterSelectionIntersects } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import type { WorkLogSortMode } from "./workLogsViewState";

export type WorkLogsSummaryState = {
  activeContributorCount: number;
  loggedHours: number;
  remainingHours: number;
  totalLogs: number;
};

export function buildTaskById(tasks: BootstrapPayload["tasks"]) {
  return Object.fromEntries(tasks.map((task) => [task.id, task] as const)) as Record<
    string,
    BootstrapPayload["tasks"][number]
  >;
}

function workLogMatchesPersonFilter(workLog: WorkLogRecord, activePersonFilter: FilterSelection) {
  return activePersonFilter.length === 0 ||
    workLog.participantIds.some((participantId) =>
      filterSelectionIncludes(activePersonFilter, participantId),
    );
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
    if (!workLogMatchesPersonFilter(workLog, activePersonFilter)) {
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
  summaryWorkLogs,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  summaryWorkLogs: BootstrapPayload["workLogs"];
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
  const contributorIds = new Set<string>();
  summaryWorkLogs.forEach((workLog) => {
    workLog.participantIds.forEach((participantId) => contributorIds.add(participantId));
  });

  const remainingHours = Math.max(0, plannedHours - loggedHours);

  return {
    activeContributorCount: contributorIds.size,
    loggedHours,
    remainingHours,
    totalLogs,
  };
}

export function filterAndSortWorkLogs({
  sortMode,
  subsystemFilter,
  taskById,
  workLogs,
}: {
  sortMode: WorkLogSortMode;
  subsystemFilter: FilterSelection;
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
  workLogs: BootstrapPayload["workLogs"];
}): WorkLogRecord[] {
  const filtered = workLogs.filter((workLog) =>
    subsystemFilter.length === 0 || filterSelectionIntersects(
      subsystemFilter,
      taskById[workLog.taskId]?.subsystemIds ?? [],
    ),
  );

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
    ? task.subsystemIds
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
