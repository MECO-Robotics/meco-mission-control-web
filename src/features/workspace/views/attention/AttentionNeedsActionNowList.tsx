import { formatAgeLabel, normalizeDateOnly } from "./attentionViewHelpers";
import type { AttentionNowItem } from "./attentionViewModel";

interface AttentionNeedsActionNowListProps {
  items: AttentionNowItem[];
  onOpenRisk: (riskId: string) => void;
  onOpenTask: (taskId: string) => void;
}

const SOURCE_LABELS: Record<AttentionNowItem["sourceType"], string> = {
  manufacturing: "Manufacturing",
  purchase: "Purchase",
  qa: "QA",
  risk: "Risk",
  task: "Task",
};

function renderAction(item: AttentionNowItem) {
  if (item.actionType === null) {
    return null;
  }

  return item.openLabel;
}

export function AttentionNeedsActionNowList({
  items,
  onOpenRisk,
  onOpenTask,
}: AttentionNeedsActionNowListProps) {
  const handleAction = (item: AttentionNowItem) => {
    if (item.actionType === "open-risk") {
      onOpenRisk(item.recordId);
      return;
    }

    if (item.actionType === "open-task") {
      onOpenTask(item.recordId);
    }
  };

  return (
    <section className="panel-subsection attention-group attention-now-group" id="needs-action-now">
      <div className="roster-section-header">
        <div className="roster-section-title">
          <h3>Needs action now</h3>
          <small>Ranked by operational urgency</small>
        </div>
        <span className="pill status-pill status-pill-warning">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">No urgent intervention signals in scope.</p>
      ) : (
        <div className="attention-triage-list attention-now-list">
          {items.map((item) => {
            const actionLabel = renderAction(item);
            const ageLabel = formatAgeLabel(item.lastUpdatedAt);

            return (
              <article className="attention-triage-item attention-now-item" key={item.id}>
                <div className="attention-triage-main">
                  <div className="attention-triage-title-row">
                    <strong>{item.title}</strong>
                    {item.severityLabel ? (
                      <span className="pill status-pill status-pill-warning">{item.severityLabel}</span>
                    ) : null}
                  </div>
                  <div className="attention-now-meta-row">
                    <span className="attention-item-kind">{SOURCE_LABELS[item.sourceType]}</span>
                    {item.statusLabel ? <span>{item.statusLabel}</span> : null}
                    <span>Urgency {item.urgencyScore}</span>
                  </div>
                  <p className="attention-now-why">{item.whyNow}</p>
                  <div className="attention-now-detail-grid">
                    {item.ownerLabel ? (
                      <span>
                        <strong>Owner:</strong> {item.ownerLabel}
                      </span>
                    ) : null}
                    {ageLabel ? (
                      <span>
                        <strong>Last update:</strong> {ageLabel}
                      </span>
                    ) : null}
                    {item.dueDate ? (
                      <span>
                        <strong>Due:</strong> {normalizeDateOnly(item.dueDate)}
                      </span>
                    ) : null}
                    {item.blockingImpact ? (
                      <span>
                        <strong>Impact:</strong> {item.blockingImpact}
                      </span>
                    ) : null}
                    {item.contextLabel ? (
                      <span>
                        <strong>Scope:</strong> {item.contextLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="attention-now-next">
                    <strong>Next action:</strong> {item.nextAction}
                  </p>
                </div>
                {actionLabel ? (
                  <div className="attention-triage-side">
                    <button
                      className="ghost-button"
                      onClick={() => handleAction(item)}
                      type="button"
                    >
                      {actionLabel}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
