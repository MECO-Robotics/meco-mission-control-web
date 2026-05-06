import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatDate } from "@/lib/appUtils/common";
import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { EditableHoverIndicator, PaginationControls, TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";

import type {
  WorkLogPaginationState,
  WorkLogsViewState,
} from "./workLogsViewState";

interface WorkLogsTableSectionProps {
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openEditTaskModal: (task: TaskRecord) => void;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  subsystemsById: SubsystemsById;
  subsystemFilter: FilterSelection;
  taskById: WorkLogsViewState["taskById"];
  workLogFilterMotionClass: string;
  workLogPagination: WorkLogPaginationState;
  workLogs: WorkLogsViewState["workLogs"];
}

const GRID_TEMPLATE = "minmax(220px, 2.05fr) minmax(190px, 1.35fr) minmax(180px, 1fr) 0.45fr";

function WorkLogsRow({
  membersById,
  openEditTaskModal,
  subsystemsById,
  taskById,
  workLog,
}: {
  membersById: MembersById;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: SubsystemsById;
  taskById: WorkLogsViewState["taskById"];
  workLog: WorkLogsViewState["workLogs"][number];
}) {
  const task = taskById[workLog.taskId];
  const subsystemName = task
    ? task.subsystemIds
        .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
        .filter(Boolean)
        .join(", ") || "Unknown subsystem"
    : "Unknown task";
  const participantNames = workLog.participantIds
    .map((participantId) => membersById[participantId]?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <button
      className="ops-table ops-row worklog-row ops-button-row editable-hover-target editable-hover-target-row"
      onClick={() => {
        if (task) {
          openEditTaskModal(task);
        }
      }}
      style={{ "--workspace-grid-template": GRID_TEMPLATE } as CSSProperties}
      title={task ? `Open ${task.title}` : "Linked task not found"}
      type="button"
    >
      <TableCell label="Log">
        <div className="requested-item-meta">
          <strong className="requested-item-title">{formatDate(workLog.date)}</strong>
          <small className="requested-item-subtitle">{workLog.hours.toFixed(1)}h logged</small>
          <small>{workLog.notes || "No notes recorded"}</small>
        </div>
      </TableCell>
      <TableCell label="Task">
        <div className="requested-item-meta">
          <strong className="requested-item-title">{task?.title ?? "Missing task"}</strong>
          <small className="requested-item-subtitle">{subsystemName}</small>
        </div>
      </TableCell>
      <TableCell label="People">
        {participantNames.length > 0 ? participantNames.join(", ") : "Unassigned"}
      </TableCell>
      <TableCell label="Open">{task ? <EditableHoverIndicator /> : null}</TableCell>
    </button>
  );
}

export function WorkLogsTableSection({
  bootstrap,
  membersById,
  openEditTaskModal,
  setSubsystemFilter,
  subsystemsById,
  subsystemFilter,
  taskById,
  workLogFilterMotionClass,
  workLogPagination,
  workLogs,
}: WorkLogsTableSectionProps) {
  return (
    <div className={`table-shell ${workLogFilterMotionClass}`}>
      <div
        className="ops-table ops-table-header worklog-table"
        style={{ "--workspace-grid-template": GRID_TEMPLATE } as CSSProperties}
      >
        <span>Log</span>
        <span className="table-column-header-cell">
          <span className="table-column-title">Task</span>
          <ColumnFilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter work logs by subsystem"
            onChange={setSubsystemFilter}
            options={bootstrap.subsystems}
            value={subsystemFilter}
          />
        </span>
        <span>People</span>
        <span>Open</span>
      </div>

      {workLogPagination.pageItems.map((workLog) => (
        <WorkLogsRow
          key={workLog.id}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          subsystemsById={subsystemsById}
          taskById={taskById}
          workLog={workLog}
        />
      ))}

      {workLogs.length === 0 ? (
        <p className="empty-state">No work logs match the current filters.</p>
      ) : null}
      <PaginationControls
        label="work logs"
        onPageChange={workLogPagination.setPage}
        onPageSizeChange={workLogPagination.setPageSize}
        page={workLogPagination.page}
        pageSize={workLogPagination.pageSize}
        pageSizeOptions={workLogPagination.pageSizeOptions}
        rangeEnd={workLogPagination.rangeEnd}
        rangeStart={workLogPagination.rangeStart}
        totalItems={workLogPagination.totalItems}
        totalPages={workLogPagination.totalPages}
      />
    </div>
  );
}
