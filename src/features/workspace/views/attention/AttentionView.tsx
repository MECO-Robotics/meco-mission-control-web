import { useMemo } from "react";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { buildAttentionViewModel, type MentorActionQueueItem } from "./attentionViewModel";
import { buildAttentionQueue } from "./attentionQueue";

type AttentionSourceFilter = "all" | "risk" | "task" | "manufacturing" | "purchase" | "quality";
export function mentorQueueItemMatchesFilters(item: MentorActionQueueItem, source: AttentionSourceFilter, search: string) {
  return (source === "all" || (source === "quality" ? item.sourceType === "qa" : item.sourceType === source)) && [item.title, item.contextLabel, item.ownerLabel, item.priorityLabel, item.sourceLabel, item.sourceType, item.statusLabel].join(" ").toLowerCase().includes(search.trim().toLowerCase());
}
interface AttentionViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onOpenRisk: (id: string) => void;
  onOpenTask: (id: string) => void;
  onOpenSource?: (source: string, id: string) => void;
}
export function AttentionView({ activePersonFilter, bootstrap, onOpenRisk, onOpenTask, onOpenSource }: AttentionViewProps) {
  const [search, setSearch] = useRememberedViewState("home.search", "");
  const [source, setSource] = useRememberedViewState("home.source", "all");
  const [reviewOnly, setReviewOnly] = useRememberedViewState("home.reviewOnly", false);
  const [showAll, setShowAll] = useRememberedViewState("home.showAll", false);
  const rows = useMemo(() => buildAttentionQueue(buildAttentionViewModel({ activePersonFilter, bootstrap })), [activePersonFilter, bootstrap]);
  const filtered = rows.filter(row => (!reviewOnly || row.needsReview) && (source === "all" || row.source === source) && [row.title, row.context, ...row.reasons].join(" ").toLowerCase().includes(search.toLowerCase()));
  const visible = showAll ? filtered : filtered.slice(0, 6);
  return <section className="home-attention" aria-label="Needs attention">
    <div className="workspace-section-heading"><h2>Needs attention</h2><span>{filtered.length} items</span></div>
    <div className="workspace-presentation-controls">
      <input aria-label="Search attention" placeholder="Search attention…" value={search} onChange={event => setSearch(event.target.value)} />
      <select aria-label="Attention source" value={source} onChange={event => setSource(event.target.value)}>
        <option value="all">All sources</option><option value="task">Tasks</option><option value="risk">Risks</option><option value="qa">QA / reports</option><option value="manufacturing">Manufacturing</option><option value="purchase">Purchases</option>
      </select>
      <button className="ghost-button" aria-pressed={reviewOnly} onClick={() => setReviewOnly(!reviewOnly)} type="button">Needs review</button>
    </div>
    {visible.length ? <ul className="workspace-record-list">{visible.map(row => <li key={row.key}>
      <div><strong>{row.action === "open-task" ? bootstrap.tasks.find(task => task.id === row.recordId)?.title ?? row.title : row.title}</strong><small>{row.context}</small><p>{row.reasons.slice(0, 2).join(" · ")}</p>{row.reasons.length > 2 ? <details className="attention-reasons"><summary>{row.reasons.length - 2} more signals</summary><ul>{row.reasons.slice(2).map(reason => <li key={reason}>{reason}</li>)}</ul></details> : null}</div>
      <button className="ghost-button" type="button" onClick={() => row.action === "open-task" ? onOpenTask(row.recordId) : row.action === "open-risk" ? onOpenRisk(row.recordId) : onOpenSource?.(row.source, row.recordId)}>Open {row.action === "open-task" ? "task" : row.source === "qa" ? "report" : row.source}</button>
    </li>)}</ul> : <p className="empty-state">No attention items match this view.</p>}
    {filtered.length > 6 ? <button className="ghost-button" onClick={() => setShowAll(!showAll)} type="button">{showAll ? "Show fewer" : `Show all ${filtered.length} items`}</button> : null}
  </section>;
}
