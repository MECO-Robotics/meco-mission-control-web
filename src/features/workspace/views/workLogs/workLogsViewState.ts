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

function buildLegacyActivityActions(
  workLogs: WorkLogRecord[],
  taskById: Record<string, BootstrapPayload["tasks"][number]>,
): AuditActionRecord[] {
  return workLogs.map((workLog) => {
    const task = taskById[workLog.taskId];
    const entityLabel = task?.title ?? workLog.taskId;

    return {
      id: `legacy-worklog-${workLog.id}`,
      timestamp: `${workLog.date}T12:00:00`,
      operation: "create",
      entityType: "worklog",
      entityId: workLog.id,
      entityLabel,
      message: `Logged work on ${entityLabel}`,
      changedFields: [],
      projectId: task?.projectId ?? null,
      taskId: workLog.taskId,
      subsystemId: task?.subsystemId ?? null,
      actorMemberId: null,
      memberIds: workLog.participantIds,
    };
  });
}

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
        ...(task ? [task.subsystemId, ...task.subsystemIds] : []),
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
  const [search, setSearch] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState<FilterSelection>([]);
  const [sortMode, setSortMode] = useState<WorkLogSortMode>("recent");

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
    const actions =
      (bootstrap.actions ?? []).length > 0
        ? (bootstrap.actions ?? [])
        : buildLegacyActivityActions(workLogs, taskById);
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

    return [...filteredActions].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }, [activePersonFilter, bootstrap.actions, membersById, search, subsystemsById, taskById, workLogs]);

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
