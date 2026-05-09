import type { TaskRecord } from "@/types/recordsExecution";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { PaginationControls } from "@/features/workspace/shared/table/workspaceTableChrome";

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

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (char) => char.toUpperCase());
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
  activityPagination,
  membersById,
  openEditTaskModal,
  subsystemsById,
  taskById,
}: WorkLogsActivitySectionProps) {
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
      <p className="section-copy filter-copy">Recent workspace activity across the current workspace scope.</p>
      <div className="worklog-activity-grid">
        {activityPagination.pageItems.map((action) => {
          const task = action.taskId ? taskById[action.taskId] : undefined;
          const participantNames = action.memberIds
            .map((memberId) => membersById[memberId]?.name)
            .filter((name): name is string => Boolean(name));
          const actorName = action.actorMemberId
            ? membersById[action.actorMemberId]?.name ?? null
            : null;

          return (
            <article className="worklog-summary-card worklog-activity-card" key={action.id}>
              <div className="worklog-activity-head">
                <strong className="font-mono">{formatActionTimestamp(action.timestamp)}</strong>
                <strong className="font-mono">{action.operation.toUpperCase()}</strong>
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
                  <span className="worklog-summary-list-label">{toTitleCase(action.entityType)}</span>
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
        })}
      </div>
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
