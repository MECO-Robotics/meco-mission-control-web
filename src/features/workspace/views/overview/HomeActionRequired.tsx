import type { AttentionQueueRow } from "@/features/workspace/views/attention/attentionQueue";

const VISIBLE_ACTION_COUNT = 5;

function actionLabel(row: AttentionQueueRow) {
  if (row.action === "open-task") return "Open task";
  if (row.action === "open-risk") return "Open risk";
  if (row.source === "qa") return "Open QA";
  return `Open ${row.source}`;
}

function sourceLabel(source: string) {
  if (source === "qa") return "QA";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function HomeActionRequired({
  items,
  onOpenItem,
  onOpenAll,
  scopeLabel,
}: {
  items: AttentionQueueRow[];
  onOpenItem: (item: AttentionQueueRow) => void;
  onOpenAll: () => void;
  scopeLabel: string;
}) {
  const visibleItems = items.slice(0, VISIBLE_ACTION_COUNT);

  return (
    <section className="home-action-required" aria-labelledby="home-action-required-title">
      <div className="workspace-section-heading">
        <h2 id="home-action-required-title">Action Required</h2>
        <span>{items.length} action{items.length === 1 ? "" : "s"} · {scopeLabel}</span>
      </div>
      {visibleItems.length ? (
        <ul className="workspace-record-list home-action-list">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <div className="home-action-copy">
                <strong>{item.title}</strong>
                <small>{sourceLabel(item.source)} · {item.context || scopeLabel}</small>
                <p>{item.reasons.slice(0, 2).join(" · ")}</p>
              </div>
              <button className="ghost-button" onClick={() => onOpenItem(item)} type="button">
                {actionLabel(item)}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state home-action-empty">No current action items in this scope.</p>
      )}
      {items.length > VISIBLE_ACTION_COUNT ? (
        <button className="ghost-button home-action-all" onClick={onOpenAll} type="button">
          View all {items.length} in Risks
        </button>
      ) : null}
    </section>
  );
}
