import { useMemo } from "react";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { ALL_FILTER_LABEL, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { buildAttentionViewModel, type MentorActionQueueItem } from "./attentionViewModel";
import { buildAttentionQueue } from "./attentionQueue";

type AttentionSourceFilter = "all" | "risk" | "task" | "manufacturing" | "purchase" | "quality";

const FILTER_CHECKBOX_LABEL_STYLE = {
  alignItems: "center",
  color: "var(--text-copy)",
  display: "inline-flex",
  fontSize: "0.85rem",
  gap: "0.35rem",
} as const;

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
    <TopbarResponsiveSearch
        actions={
          <CompactFilterMenu
            activeCount={Number(source !== "all") + Number(reviewOnly)}
            ariaLabel="Attention filters"
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Source",
                content: (
                  <select aria-label="Attention source" className="toolbar-filter-select" value={source} onChange={event => setSource(event.target.value)}>
                    <option value="all">{ALL_FILTER_LABEL}</option><option value="task">Tasks</option><option value="risk">Risks</option><option value="qa">QA / reports</option><option value="manufacturing">Manufacturing</option><option value="purchase">Purchases</option>
                  </select>
                ),
              },
              {
                label: "Review",
                content: (
                  <div className="task-queue-filter-menu-checkboxes">
                    <label style={FILTER_CHECKBOX_LABEL_STYLE}>
                      <input aria-label="Needs review only" checked={reviewOnly} onChange={event => setReviewOnly(event.target.checked)} type="checkbox" />
                      Needs review only
                    </label>
                  </div>
                ),
              },
            ]}
          />
        }
        ariaLabel="Search attention"
        compactPlaceholder="Search"
        onChange={setSearch}
        placeholder="Search attention…"
        value={search}
    />
    <div className="workspace-section-heading"><h2>Needs attention</h2><span>{filtered.length} items</span></div>
    {visible.length ? <ul className="workspace-record-list">{visible.map(row => <li key={row.key}>
      <div><strong>{row.action === "open-task" ? bootstrap.tasks.find(task => task.id === row.recordId)?.title ?? row.title : row.title}</strong><small>{row.context}</small><p>{row.reasons.slice(0, 2).join(" · ")}</p>{row.reasons.length > 2 ? <details className="attention-reasons"><summary>{row.reasons.length - 2} more signals</summary><ul>{row.reasons.slice(2).map(reason => <li key={reason}>{reason}</li>)}</ul></details> : null}</div>
      <button className="ghost-button" type="button" onClick={() => row.action === "open-task" ? onOpenTask(row.recordId) : row.action === "open-risk" ? onOpenRisk(row.recordId) : onOpenSource?.(row.source, row.recordId)}>Open {row.action === "open-task" ? "task" : row.source === "qa" ? "report" : row.source}</button>
    </li>)}</ul> : <p className="empty-state">No attention items match this view.</p>}
    {filtered.length > 6 ? <button className="ghost-button" onClick={() => setShowAll(!showAll)} type="button">{showAll ? "Show fewer" : `Show all ${filtered.length} items`}</button> : null}
  </section>;
}
