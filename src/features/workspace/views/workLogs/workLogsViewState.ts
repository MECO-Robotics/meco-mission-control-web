import { useMemo, useState } from "react";
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
  activityPagination: ActivityPaginationState;
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
  const summaryWorkLogs = useMemo(
    () => filterSummaryWorkLogs(bootstrap.workLogs, activePersonFilter),
    [activePersonFilter, bootstrap.workLogs],
  );
  const summary = useMemo(
    () =>
      buildWorkLogsSummaryState({
        activePersonFilter,
        bootstrap,
        membersById,
        subsystemsById,
        summaryWorkLogs,
        taskById,
      }),
    [activePersonFilter, bootstrap, membersById, subsystemsById, summaryWorkLogs, taskById],
  );
  const workLogs = useMemo(
    () =>
      filterAndSortWorkLogs({
        activePersonFilter,
        membersById,
        search,
        sortMode,
        subsystemsById,
        subsystemFilter,
        taskById,
        workLogs: bootstrap.workLogs,
      }),
    [activePersonFilter, bootstrap.workLogs, membersById, search, sortMode, subsystemsById, subsystemFilter, taskById],
  );
  const activityActions = useMemo(() => {
    const actions = bootstrap.actions ?? [];
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

    return [...scopedActions].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }, [activePersonFilter, bootstrap.actions]);

  const workLogPagination = useWorkspacePagination<WorkLogRecord>(workLogs);
  const activityPagination = useWorkspacePagination<AuditActionRecord>(activityActions);
  const workLogFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    search,
    sortMode,
    subsystemFilter,
  ]);
  return {
    activityActions,
    activityPagination,
    search,
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
