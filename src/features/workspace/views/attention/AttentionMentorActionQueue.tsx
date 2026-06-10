import type { MentorActionQueueItem } from "./attentionViewTypes";

interface AttentionMentorActionQueueProps {
  items: MentorActionQueueItem[];
  onOpenRisk: (riskId: string) => void;
  onOpenTask: (taskId: string) => void;
}

function renderActionLabel(item: MentorActionQueueItem) {
  if (item.actionType === null) {
    return null;
  }

  return item.openLabel;
}

export function AttentionMentorActionQueue({
  items,
  onOpenRisk,
  onOpenTask,
}: AttentionMentorActionQueueProps) {
  const handleAction = (item: MentorActionQueueItem) => {
    if (item.actionType === "open-risk") {
      onOpenRisk(item.recordId);
      return;
    }

    if (item.actionType === "open-task") {
      onOpenTask(item.recordId);
    }
  };

  return (
    <section className="panel-subsection attention-group mentor-action-queue" id="mentor-action-queue">
      <div className="roster-section-header">
        <div className="roster-section-title">
          <h3>Mentor action queue</h3>
          <small>Approvals, help requests, risk reviews, and stale assigned tasks</small>
        </div>
        <span className="pill status-pill status-pill-warning">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">No mentor actions in scope.</p>
      ) : (
        <div className="attention-triage-list mentor-action-queue-list">
          {items.map((item) => {
            const actionLabel = renderActionLabel(item);

            return (
              <article className="attention-triage-item mentor-action-queue-item" key={item.id}>
                <div className="attention-triage-main">
                  <div className="attention-triage-title-row">
                    <strong>{item.title}</strong>
                    <span className="pill status-pill status-pill-warning">{item.sourceLabel}</span>
                  </div>
                  <small>{item.contextLabel}</small>
                  <div className="attention-triage-meta">
                    <span>{item.statusLabel}</span>
                    <span>{item.ownerLabel}</span>
                    <span>{item.priorityLabel}</span>
                  </div>
                </div>
                <div className="attention-triage-side">
                  <span className="attention-item-kind">{item.sourceType}</span>
                  {actionLabel ? (
                    <button
                      className="ghost-button"
                      onClick={() => handleAction(item)}
                      type="button"
                    >
                      {actionLabel}
                    </button>
                  ) : (
                    <span className="attention-item-kind">{item.openLabel}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
