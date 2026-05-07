import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkLogRecord } from "@/types/recordsExecution";
import type { DropdownOption, MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionIncludes, filterSelectionIntersects, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";

export type WorkLogSortMode = "recent" | "oldest" | "longest" | "shortest";

const WORKLOG_SORT_OPTIONS: DropdownOption[] = [
  { id: "recent", name: "Newest first" },
  { id: "oldest", name: "Oldest first" },
  { id: "longest", name: "Longest first" },
  { id: "shortest", name: "Shortest first" },
];

type WorkLogsViewStateArgs = {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  subsystemsById: SubsystemsById;
};

type WorkLogsTopContributor = {
  id: string;
  hours: number;
  name: string;
};

type WorkLogsTopTask = {
  hours: number;
  id: string;
  subsystemName: string;
  title: string;
};

type WorkLogsSummaryState = {
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

export type WorkLogPaginationState = {
  page: number;
  pageItems: WorkLogRecord[];
  pageSize: number;
  pageSizeOptions: readonly number[];
  rangeEnd: number;
  rangeStart: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  totalItems: number;
  totalPages: number;
};

export type WorkLogsViewState = {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  setSortMode: Dispatch<SetStateAction<WorkLogSortMode>>;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  sortMode: WorkLogSortMode;
  sortOptions: DropdownOption[];
  subsystemFilter: FilterSelection;
  summary: WorkLogsSummaryState;
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
  workLogFilterMotionClass: string;
  workLogPagination: WorkLogPaginationState;
  workLogs: WorkLogRecord[];
};

function buildTaskById(tasks: BootstrapPayload["tasks"]) {
  return Object.fromEntries(tasks.map((task) => [task.id, task])) as Record<
    string,
    BootstrapPayload["tasks"][number]
  >;
}

export function useWorkLogsViewState({
  activePersonFilter,
  bootstrap,
  membersById,
  subsystemsById,
}: WorkLogsViewStateArgs): WorkLogsViewState {
  const [search, setSearch] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [sortMode, setSortMode] = useState<WorkLogSortMode>("recent");

  const taskById = useMemo(() => buildTaskById(bootstrap.tasks), [bootstrap.tasks]);
  const summaryWorkLogs = useMemo(() => {
    if (activePersonFilter.length === 0) {
      return bootstrap.workLogs;
    }

    return bootstrap.workLogs.filter((workLog) =>
      workLog.participantIds.some((participantId) =>
        filterSelectionIncludes(activePersonFilter, participantId),
      ),
    );
  }, [activePersonFilter, bootstrap.workLogs]);

  const summaryTaskIds = useMemo(
    () => new Set(summaryWorkLogs.map((workLog) => workLog.taskId)),
    [summaryWorkLogs],
  );

  const plannedHours = useMemo(() => {
    const taskPool =
      activePersonFilter.length === 0
        ? bootstrap.tasks
        : bootstrap.tasks.filter((task) => summaryTaskIds.has(task.id));

    return taskPool.reduce(
      (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
      0,
    );
  }, [activePersonFilter.length, bootstrap.tasks, summaryTaskIds]);

  const loggedHours = useMemo(
    () =>
      summaryWorkLogs.reduce(
        (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
        0,
      ),
    [summaryWorkLogs],
  );

  const totalLogs = summaryWorkLogs.length;
  const tasksWithLogsCount = summaryTaskIds.size;
  const activeContributorCount = useMemo(() => {
    const contributorIds = new Set<string>();

    summaryWorkLogs.forEach((workLog) => {
      workLog.participantIds.forEach((participantId) => contributorIds.add(participantId));
    });

    return contributorIds.size;
  }, [summaryWorkLogs]);
  const averageHoursPerLog = totalLogs > 0 ? loggedHours / totalLogs : 0;
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const completionRatio = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, completionRatio * 100))}%`;
  const isOverPlan = loggedHours > plannedHours;
  const overrunHours = Math.max(0, loggedHours - plannedHours);
  const remainingHours = Math.max(0, plannedHours - loggedHours);

  const topContributors = useMemo(() => {
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
        contributorHours.set(
          participantId,
          (contributorHours.get(participantId) ?? 0) + sharedHours,
        );
      });
    });

    return Array.from(contributorHours.entries())
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
  }, [membersById, summaryWorkLogs]);

  const topTasks = useMemo(() => {
    const taskHours = new Map<string, number>();

    summaryWorkLogs.forEach((workLog) => {
      taskHours.set(workLog.taskId, (taskHours.get(workLog.taskId) ?? 0) + workLog.hours);
    });

    return Array.from(taskHours.entries())
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
  }, [summaryWorkLogs, subsystemsById, taskById]);

  const workLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = bootstrap.workLogs.filter((workLog) => {
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

      const participantNames = workLog.participantIds
        .map((participantId) => membersById[participantId]?.name ?? "")
        .join(" ")
        .toLowerCase();
      const taskText = `${task?.title ?? ""} ${task?.summary ?? ""}`.toLowerCase();
      const subsystemText = task
        ? task.subsystemIds
            .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
            .join(" ")
        : "";

      return (
        workLog.notes.toLowerCase().includes(query) ||
        taskText.includes(query) ||
        subsystemText.toLowerCase().includes(query) ||
        participantNames.includes(query)
      );
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
  }, [activePersonFilter, bootstrap.workLogs, membersById, sortMode, subsystemsById, subsystemFilter, taskById, search]);

  const workLogPagination = useWorkspacePagination<WorkLogRecord>(workLogs);
  const workLogFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    search,
    sortMode,
    subsystemFilter,
  ]);
  return {
    search,
    setSearch,
    setSortMode,
    setSubsystemFilter,
    sortMode,
    sortOptions: WORKLOG_SORT_OPTIONS,
    subsystemFilter,
    summary: {
      activeContributorCount,
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
    },
    taskById,
    workLogFilterMotionClass,
    workLogPagination,
    workLogs,
  };
}
