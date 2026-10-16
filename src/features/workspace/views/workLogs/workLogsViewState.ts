import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { AuditActionRecord, WorkLogRecord } from "@/types/recordsExecution";
import type { DropdownOption, MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import {
  buildTaskById,
  buildWorkLogsSummaryState,
  filterAndSortWorkLogs,
  filterSummaryWorkLogs,
  type WorkLogsSummaryState,
} from "./workLogsViewStateData";

export type WorkLogSortMode = "recent" | "oldest" | "longest" | "shortest";
export type ActivitySortMode = "date" | "title";

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
  activityActions: AuditActionRecord[];
  activitySortMode: ActivitySortMode;
  activitySortDirection: "asc" | "desc";
  activityPagination: ActivityPaginationState;
  search: string;
  setActivitySortMode: Dispatch<SetStateAction<ActivitySortMode>>;
  setActivitySortDirection: Dispatch<SetStateAction<"asc" | "desc">>;
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

export type ActivityPaginationState = {
  page: number;
  pageItems: AuditActionRecord[];
  pageSize: number;
  pageSizeOptions: readonly number[];
  rangeEnd: number;
  rangeStart: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  totalItems: number;
  totalPages: number;
};

export function actionMatchesSearch({
  action,
  membersById,
  query,
  subsystemsById,
  taskById,
}: {
  action: AuditActionRecord;
  membersById: MembersById;
  query: string;
  subsystemsById: SubsystemsById;
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
}) {
  const task = action.taskId ? taskById[action.taskId] : undefined;
  const participantNames = action.memberIds
    .map((memberId) => membersById[memberId]?.name ?? "")
    .join(" ");
  const actorName = action.actorMemberId ? membersById[action.actorMemberId]?.name ?? "" : "";
  const subsystemIds = Array.from(
    new Set(
      [
        action.subsystemId,
        ...(task?.subsystemIds ?? []),
      ].filter((subsystemId): subsystemId is string => Boolean(subsystemId)),
    ),
  );
  const subsystemText = subsystemIds
    .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
    .join(" ");

  return [
    action.entityLabel,
    action.message,
    action.operation,
    action.entityType,
    actorName,
    participantNames,
    task?.title ?? "",
    task?.summary ?? "",
    subsystemText,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function useWorkLogsViewState({
  activePersonFilter,
  bootstrap,
  membersById,
  subsystemsById,
}: WorkLogsViewStateArgs): WorkLogsViewState {
  const [search, setSearch] = useRememberedViewState("activity.search", "");
  const [activitySortMode, setActivitySortMode] = useRememberedViewState<ActivitySortMode>("activity.sort", "date");
  const [activitySortDirection, setActivitySortDirection] = useRememberedViewState<"asc" | "desc">("activity.sortDirection", "desc");
  const [subsystemFilter, setSubsystemFilter] = useRememberedViewState<FilterSelection>("activity.subsystemFilter", []);
  const [sortMode, setSortMode] = useRememberedViewState<WorkLogSortMode>("activity.sortMode", "recent");

  const taskById = useMemo(() => buildTaskById(bootstrap.tasks), [bootstrap.tasks]);
  const summaryWorkLogs = useMemo(
    () =>
      filterSummaryWorkLogs(
        bootstrap.workLogs,
        activePersonFilter,
        search,
        membersById,
        subsystemsById,
        taskById,
      ),
    [activePersonFilter, bootstrap.workLogs, membersById, search, subsystemsById, taskById],
  );
  const summary = useMemo(
    () =>
      buildWorkLogsSummaryState({
        activePersonFilter,
        bootstrap,
        summaryWorkLogs,
      }),
    [activePersonFilter, bootstrap, summaryWorkLogs],
  );
  const workLogs = useMemo(
    () =>
      filterAndSortWorkLogs({
        sortMode,
        subsystemFilter,
        taskById,
        workLogs: summaryWorkLogs,
      }),
    [sortMode, subsystemFilter, summaryWorkLogs, taskById],
  );
  const activityActions = useMemo(() => {
    const actions = bootstrap.actions;
    const scopedActions =
      activePersonFilter.length === 0
        ? actions
        : actions.filter((action) => {
            if (action.actorMemberId && filterSelectionIncludes(activePersonFilter, action.actorMemberId)) {
              return true;
            }

            return action.memberIds.some((memberId) =>
              filterSelectionIncludes(activePersonFilter, memberId),
            );
          });

    const query = search.trim().toLowerCase();
    const filteredActions =
      query.length === 0
        ? scopedActions
        : scopedActions.filter((action) =>
            actionMatchesSearch({
              action,
              membersById,
              query,
              subsystemsById,
              taskById,
            }),
          );

    return [...filteredActions].sort((left, right) => (activitySortMode === "title"
      ? left.entityLabel.localeCompare(right.entityLabel)
      : left.timestamp.localeCompare(right.timestamp)) * (activitySortDirection === "asc" ? 1 : -1));
  }, [activePersonFilter, activitySortDirection, activitySortMode, bootstrap.actions, bootstrap.workLogs, membersById, search, subsystemsById, taskById]);

  const workLogPagination = useWorkspacePagination<WorkLogRecord>(workLogs);
  const activityPagination = useWorkspacePagination<AuditActionRecord>(activityActions);
  const workLogFilterMotionClass = useFilterChangeMotionClass([activePersonFilter, search, sortMode, subsystemFilter]);
  return {
    activityActions,
    activitySortMode,
    activitySortDirection,
    activityPagination,
    search,
    setActivitySortMode,
    setActivitySortDirection,
    setSearch,
    setSortMode,
    setSubsystemFilter,
    sortMode,
    sortOptions: WORKLOG_SORT_OPTIONS,
    subsystemFilter,
    summary,
    taskById,
    workLogFilterMotionClass,
    workLogPagination,
    workLogs,
  };
}
