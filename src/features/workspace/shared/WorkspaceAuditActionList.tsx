import type { AuditActionRecord } from "@/types/recordsExecution";

interface WorkspaceAuditActionListProps {
  actions: AuditActionRecord[];
  emptyText?: string;
  title?: string;
}

function formatActionTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
}

export function WorkspaceAuditActionList({
  actions,
  emptyText = "No audit actions recorded.",
  title = "Audit actions",
}: WorkspaceAuditActionListProps) {
  const sortedActions = [...actions].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

  return (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>{title}</span>
      {sortedActions.length > 0 ? (
        <div className="workspace-detail-list">
          {sortedActions.slice(0, 5).map((action) => (
            <div className="workspace-detail-list-item" key={action.id}>
              <div>
                <strong>{action.message || action.entityLabel}</strong>
                <small style={{ color: "var(--text-copy)" }}>
                  {formatActionTime(action.timestamp)}
                  {action.changedFields.length > 0
                    ? ` · ${action.changedFields.join(", ")}`
                    : ""}
                </small>
              </div>
              <span className="pill status-pill status-pill-neutral">{action.operation}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="task-detail-copy">{emptyText}</p>
      )}
    </div>
  );
}
