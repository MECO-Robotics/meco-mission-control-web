import { useMemo, useState, type ReactNode } from "react";

import type { TaskRecord } from "@/types/recordsExecution";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import { PaginationControls } from "@/features/workspace/shared/table/workspaceTableChrome";

import {
  buildWorkLogActivityColumns,
  formatActivityLabel,
  type WorkLogActivityGroupMode,
} from "./workLogsActivityGrouping";
import type {
  ActivityPaginationState,
  WorkLogsViewState,
} from "./workLogsViewState";

interface WorkLogsActivitySectionProps {
  actions: WorkLogsViewState["activityActions"];
  activityGroupMode: WorkLogActivityGroupMode;
  activityPagination: ActivityPaginationState;
  description?: string;
  groupingControls?: ReactNode;
  membersById: MembersById;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: SubsystemsById;
  taskById: WorkLogsViewState["taskById"];
}

function formatActionTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveSubsystemLabel(
  action: WorkLogsViewState["activityActions"][number],
  task: WorkLogsViewState["taskById"][string] | undefined,
  subsystemsById: SubsystemsById,
) {
  if (action.subsystemId) {
    return subsystemsById[action.subsystemId]?.name ?? "Unknown subsystem";
  }

  if (!task) {
    return "Unknown subsystem";
  }

  const names = task.subsystemIds
    .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
    .filter(Boolean);

  return names.join(", ") || "Unknown subsystem";
}

export function WorkLogsActivitySection({
  actions,
  activityGroupMode,
  activityPagination,
  description,
  groupingControls,
  membersById,
  openEditTaskModal,
  subsystemsById,
  taskById,
}: WorkLogsActivitySectionProps) {
  const activityColumns = useMemo(
    () =>
      buildWorkLogActivityColumns({
        actions: activityPagination.pageItems,
        groupMode: activityGroupMode,
        membersById,
        subsystemsById,
        taskById,
      }),
    [activityGroupMode, activityPagination.pageItems, membersById, subsystemsById, taskById],
  );
  const actionsByColumn = useMemo(
    () =>
      Object.fromEntries(
        activityColumns.map((column) => [column.id, column.actions] as const),
      ) as Record<string, WorkLogsViewState["activityActions"]>,
    [activityColumns],
  );
  const [focusedColumnId, setFocusedColumnId] = useState<string | null>(null);
  const focusedColumn = useMemo(
    () => activityColumns.find((column) => column.id === focusedColumnId) ?? null,
    [activityColumns, focusedColumnId],
  );
  const focusedActions = focusedColumn?.actions ?? [];

  const renderActionCard = (action: WorkLogsViewState["activityActions"][number]) => {
    const task = action.taskId ? taskById[action.taskId] : undefined;
    const participantNames = action.memberIds
      .map((memberId) => membersById[memberId]?.name)
      .filter((name): name is string => Boolean(name));
    const actorName = action.actorMemberId
      ? membersById[action.actorMemberId]?.name ?? null
      : null;

    return (
      <article className="task-queue-board-card worklog-activity-card">
        <div className="worklog-activity-head">
          <strong className="font-mono">{formatActionTimestamp(action.timestamp)}</strong>
          <strong className="font-mono worklog-activity-operation">
            {action.operation.toUpperCase()}
          </strong>
        </div>
        <div className="worklog-summary-task-meta">
          {task ? (
            <button
              className="worklog-summary-task-link"
              onClick={() => openEditTaskModal(task)}
              type="button"
            >
              {task.title}
            </button>
          ) : (
            <span className="worklog-summary-list-label">
              {formatActivityLabel(action.entityType)}
            </span>
          )}
          <small>{resolveSubsystemLabel(action, task, subsystemsById)}</small>
        </div>
        <p className="worklog-activity-meta">{action.message}</p>
        <p className="worklog-activity-meta">
          {actorName ? `By: ${actorName}` : "By: System"}
          {participantNames.length > 0 ? ` | People: ${participantNames.join(", ")}` : ""}
        </p>
      </article>
    );
  };

  if (focusedColumnId !== null) {
    return (
      <>
        {description ? <p className="section-copy filter-copy">{description}</p> : null}
        {groupingControls ? (
          <div className="worklog-activity-board-controls">{groupingControls}</div>
        ) : null}
        <section className="task-queue-board-focused" data-board-state={focusedColumnId}>
          <div className="task-queue-board-focused-shell">
            <header className="task-queue-board-focused-header">
              <div className="task-queue-board-focused-title-stack">
                <h3 className="task-queue-board-focused-title">
                  <span>{focusedColumn?.label ?? "Activity"}</span>
                </h3>
                <span className="task-queue-board-focused-count">{focusedActions.length}</span>
              </div>
              <button
                aria-label="Exit focused column view"
                className="task-queue-board-focused-exit"
                onClick={() => setFocusedColumnId(null)}
                type="button"
              >
                {"\u00d7"}
              </button>
            </header>
            <div className="task-queue-board-priority-grid worklog-activity-focused-grid">
              {focusedActions.length > 0 ? (
                focusedActions.map((action) => (
                  <div key={action.id}>{renderActionCard(action)}</div>
                ))
              ) : (
                <p className="empty-state">No recent activity in this column.</p>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="empty-state">
        <strong>No recent activity</strong>
        <p className="section-copy">Actions will appear here as workspace updates are made.</p>
      </div>
    );
  }

  return (
    <>
      {description ? <p className="section-copy filter-copy">{description}</p> : null}
      {groupingControls ? (
        <div className="worklog-activity-board-controls">{groupingControls}</div>
      ) : null}
      <KanbanScrollFrame>
        <KanbanColumns
          boardClassName="worklog-activity-board"
          columnBodyClassName="task-queue-board-column-body worklog-activity-column-body"
          columnClassName="task-queue-board-column"
          columnCountClassName="task-queue-board-column-count"
          columnEmptyClassName="task-queue-board-column-empty"
          columnHeaderClassName="task-queue-board-column-header"
          columns={activityColumns.map((column) => ({
            count: column.actions.length,
            header: <span className="worklog-activity-column-title">{column.label}</span>,
            state: column.id,
          }))}
          emptyLabel="No activity"
          itemsByState={actionsByColumn}
          onColumnBodyClick={(state) => setFocusedColumnId(state)}
          renderItem={(action) => {
            return renderActionCard(action);
          }}
        />
      </KanbanScrollFrame>
      <PaginationControls
        label="activity actions"
        onPageChange={activityPagination.setPage}
        onPageSizeChange={activityPagination.setPageSize}
        page={activityPagination.page}
        pageSize={activityPagination.pageSize}
        pageSizeOptions={activityPagination.pageSizeOptions}
        rangeEnd={activityPagination.rangeEnd}
        rangeStart={activityPagination.rangeStart}
        totalItems={activityPagination.totalItems}
        totalPages={activityPagination.totalPages}
      />
    </>
  );
}
