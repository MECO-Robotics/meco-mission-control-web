import type { AttentionQueueRow } from "@/features/workspace/views/attention/attentionQueue";
import { HOME_PRESSURE_BUCKETS, type HomePressureBucket, type HomePressureGroup } from "./homePressureModel";

export function HomeActionRequired({ items, groups, bucket, onSelect }: {
  items: AttentionQueueRow[];
  groups: HomePressureGroup[];
  bucket: HomePressureBucket;
  onSelect: (group: string | null) => void;
}) {
  const total = new Set(items.map(item => item.key)).size;
  const overlaps = groups.reduce((count, group) => count + group.items.length, 0) > total;
  const label = HOME_PRESSURE_BUCKETS.find(option => option.id === bucket)?.label.toLowerCase();
  const max = Math.max(1, ...groups.map(group => group.items.length));
  return (
    <section className="home-action-required" aria-labelledby="home-action-required-title">
      <div className="workspace-section-heading">
        <h2 id="home-action-required-title">{bucket === "urgency" ? "Action Required" : `Pressure by ${label}`}</h2>
        <button className="secondary-action" disabled={!total} onClick={() => onSelect(null)} type="button">
          {total} actions
        </button>
      </div>
      {!items.length ? <p className="empty-state">No current action items in this scope.</p> : null}
      <div className="home-pressure-chart" aria-label={bucket === "urgency" ? "Actions by most urgent signal" : `Actions by ${label}`}>
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
      <p className="home-chart-caption">{bucket === "urgency" ? "Each record appears once, under its most urgent signal."
        : overlaps ? "Records linked to multiple groups appear in each. The total counts each record once."
          : "Each record appears once in its recorded group."}</p>
    </section>
  );
}
