import type { TaskRecord } from "@/types/recordsExecution";
import { formatDate } from "@/lib/appUtils/common";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { PaginationControls } from "@/features/workspace/shared/table/workspaceTableChrome";

import type {
  WorkLogPaginationState,
  WorkLogsViewState,
} from "./workLogsViewState";

interface WorkLogsActivitySectionProps {
  membersById: MembersById;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: SubsystemsById;
  taskById: WorkLogsViewState["taskById"];
  workLogPagination: WorkLogPaginationState;
  workLogs: WorkLogsViewState["workLogs"];
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

function buildSubsystemLabel(
  task: WorkLogsViewState["taskById"][string] | undefined,
  subsystemsById: SubsystemsById,
) {
  if (!task) {
    return "Unknown subsystem";
  }

  const names = task.subsystemIds
    .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
    .filter(Boolean);

  return names.join(", ") || "Unknown subsystem";
}

export function WorkLogsActivitySection({
  membersById,
  openEditTaskModal,
  subsystemsById,
  taskById,
  workLogPagination,
  workLogs,
}: WorkLogsActivitySectionProps) {
  if (workLogs.length === 0) {
    return (
      <div className="empty-state">
        <strong>No recent activity</strong>
        <p className="section-copy">Create work logs to populate team activity updates.</p>
      </div>
    );
  }

  return (
    <>
      <p className="section-copy filter-copy">Recent work log activity across the current workspace scope.</p>
      <div className="worklog-activity-grid">
        {workLogPagination.pageItems.map((workLog) => {
          const task = taskById[workLog.taskId];
          const participantNames = workLog.participantIds
            .map((participantId) => membersById[participantId]?.name)
            .filter((name): name is string => Boolean(name));

          return (
            <article className="worklog-summary-card worklog-activity-card" key={workLog.id}>
              <div className="worklog-activity-head">
                <strong className="font-mono">{formatDate(workLog.date)}</strong>
                <strong className="font-mono">{formatHours(workLog.hours)}</strong>
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
                  <span className="worklog-summary-list-label">Missing task</span>
                )}
                <small>{buildSubsystemLabel(task, subsystemsById)}</small>
              </div>
              <p className="worklog-activity-meta">
                {participantNames.length > 0
                  ? `People: ${participantNames.join(", ")}`
                  : "People: Unassigned"}
              </p>
              <p className="section-copy">{workLog.notes.trim() || "No notes recorded."}</p>
            </article>
          );
        })}
      </div>
      <PaginationControls
        label="work log activity"
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
    </>
  );
}
