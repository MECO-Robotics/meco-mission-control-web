import type { AttentionQueueRow } from "@/features/workspace/views/attention/attentionQueue";

export const HOME_ACTION_GROUPS = [
  { id: "blocked", label: "Blocking work", tone: "danger" },
  { id: "overdue", label: "Overdue", tone: "danger" },
  { id: "high-risk", label: "High priority risks", tone: "warning" },
  { id: "waiting-qa", label: "Waiting for QA", tone: "info" },
  { id: "due-soon", label: "Due within 7 days", tone: "warning" },
  { id: "other", label: "Other active risks", tone: "neutral" },
] as const;

export function groupHomeActions(items: AttentionQueueRow[]) {
  return HOME_ACTION_GROUPS.map(group => ({
    ...group,
    items: items.filter(item =>
      (HOME_ACTION_GROUPS.find(candidate => item.signals.includes(candidate.id))?.id ?? "other") === group.id,
    ),
  }));
}

export function HomeActionRequired({ items, onSelect }: {
  items: AttentionQueueRow[];
  onSelect: (group: string | null) => void;
}) {
  const groups = groupHomeActions(items);
  const max = Math.max(1, ...groups.map(group => group.items.length));
  return (
    <section className="home-action-required" aria-labelledby="home-action-required-title">
      <div className="workspace-section-heading">
        <h2 id="home-action-required-title">Action Required</h2>
        <button className="secondary-action" disabled={!items.length} onClick={() => onSelect(null)} type="button">
          {items.length} actions
        </button>
      </div>
      {!items.length ? <p className="empty-state">No current action items in this scope.</p> : null}
      <div className="home-pressure-chart" aria-label="Actions by most urgent signal">
        {groups.map(group => (
          <button className="home-pressure-row" key={group.id} type="button" disabled={!group.items.length}
            aria-label={`${group.label}: ${group.items.length} actions`}
            onClick={() => onSelect(group.id)}>
            <span>{group.label}</span>
            <span className="home-pressure-track" aria-hidden="true">
              <span className={`home-chart-fill home-tone-${group.tone}`} style={{ width: `${group.items.length / max * 100}%` }} />
            </span>
            <strong>{group.items.length}</strong>
          </button>
        ))}
      </div>
      <p className="home-chart-caption">Each record appears once, under its most urgent signal.</p>
    </section>
  );
}
