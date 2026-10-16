import type { CSSProperties } from "react";

import type { TaskRecord } from "@/types/recordsExecution";
import { formatDate } from "@/lib/appUtils/common";
import { PaginationControls, TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";

import type {
  ActivityPaginationState,
  WorkLogsViewState,
} from "./workLogsViewState";

interface WorkLogsActivitySectionProps {
  actions: WorkLogsViewState["activityActions"];
  activityPagination: ActivityPaginationState;
  membersById: MembersById;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: SubsystemsById;
  taskById: WorkLogsViewState["taskById"];
}

const GRID_TEMPLATE = "minmax(170px, 1fr) minmax(130px, 0.7fr) minmax(190px, 1.3fr) minmax(170px, 1.2fr) minmax(220px, 1.7fr)";

function formatActionTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return `${formatDate(parsed.toISOString().slice(0, 10))} ${parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function resolveSubsystemLabel(
  action: WorkLogsViewState["activityActions"][number],
  task: WorkLogsViewState["taskById"][string] | undefined,
  subsystemsById: SubsystemsById,
) {
  if (action.subsystemId) return subsystemsById[action.subsystemId]?.name ?? "Unknown subsystem";
  if (!task) return "Unknown subsystem";
  return task.subsystemIds.map((id) => subsystemsById[id]?.name ?? "").filter(Boolean).join(", ") || "Unknown subsystem";
}

export function WorkLogsActivitySection({
  actions,
  activityPagination,
  membersById,
  openEditTaskModal,
  subsystemsById,
  taskById,
}: WorkLogsActivitySectionProps) {
  return (
    <div className="table-shell">
      <div className="ops-table ops-table-header worklog-activity-table" style={{ "--workspace-grid-template": GRID_TEMPLATE } as CSSProperties}>
        <span>Date</span><span>Action</span><span>Record</span><span>By</span><span>Details</span>
      </div>
      {activityPagination.pageItems.map((action) => {
        const task = action.taskId ? taskById[action.taskId] : undefined;
        const actorName = action.actorMemberId ? membersById[action.actorMemberId]?.name ?? "Unknown member" : "System";
        return (
          <div key={action.id} className="ops-table ops-row worklog-activity-row" style={{ "--workspace-grid-template": GRID_TEMPLATE } as CSSProperties}>
            <TableCell label="Date"><span className="font-mono">{formatActionTimestamp(action.timestamp)}</span></TableCell>
            <TableCell label="Action"><span className="worklog-activity-operation">{action.operation.toUpperCase()}</span></TableCell>
            <TableCell label="Record">
              <div className="requested-item-meta">
                {task ? <button className="worklog-summary-task-link" onClick={() => openEditTaskModal(task)} type="button">{task.title}</button> : <strong className="requested-item-title">{action.entityLabel || action.entityType}</strong>}
                <small className="requested-item-subtitle">{resolveSubsystemLabel(action, task, subsystemsById)}</small>
              </div>
            </TableCell>
            <TableCell label="By">{actorName}</TableCell>
            <TableCell label="Details">{action.message}</TableCell>
          </div>
        );
      })}
      {actions.length === 0 ? <p className="empty-state">No activity matches the current filters.</p> : null}
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
    </div>
  );
}
