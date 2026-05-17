import type { AttentionTriageGroup, AttentionTriageItem } from "./attentionViewModel";

interface AttentionTriageListProps {
  groups: AttentionTriageGroup[];
  onOpenRisk: (riskId: string) => void;
  onOpenTask: (taskId: string) => void;
}

function renderActionLabel(item: AttentionTriageItem) {
  if (item.actionType === "open-risk") {
    return "Open risk";
  }

  if (item.actionType === "open-task") {
    return "Open task";
  }

  return null;
}

export function AttentionTriageList({
  groups,
  onOpenRisk,
  onOpenTask,
}: AttentionTriageListProps) {
  const handleAction = (item: AttentionTriageItem) => {
    if (item.actionType === "open-risk") {
      onOpenRisk(item.recordId);
      return;
    }

    if (item.actionType === "open-task") {
      onOpenTask(item.recordId);
    }
  };

  return (
    <div className="attention-groups">
      {groups.map((group) => (
        <section className="panel-subsection attention-group" id={group.id} key={group.id}>
          <div className="roster-section-header">
            <div className="roster-section-title">
              <h3>{group.title}</h3>
            </div>
            <span className="pill status-pill status-pill-neutral">{group.items.length}</span>
          </div>

          {group.items.length === 0 ? (
            <p className="empty-state">{group.emptyLabel}</p>
          ) : (
            <div className="attention-triage-list">
              {group.items.map((item) => {
                const actionLabel = renderActionLabel(item);

                return (
                  <article className="attention-triage-item" key={item.id}>
                    <div className="attention-triage-main">
                      <div className="attention-triage-title-row">
                        <strong>{item.title}</strong>
                        <span className="pill status-pill status-pill-warning">
                          {item.severityLabel}
                        </span>
                      </div>
                      <small>{item.subtitle}</small>
                      <div className="attention-triage-meta">
                        <span>{item.statusLabel}</span>
                        <span>{item.ownerLabel}</span>
                        <span>{item.contextLabel}</span>
                      </div>
                    </div>
                    <div className="attention-triage-side">
                      <span className="attention-item-kind">{item.kind}</span>
                      {actionLabel ? (
                        <button
                          className="ghost-button"
                          onClick={() => handleAction(item)}
                          type="button"
                        >
                          {actionLabel}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
