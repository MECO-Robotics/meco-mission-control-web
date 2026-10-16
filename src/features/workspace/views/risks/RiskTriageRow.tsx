import type { AttentionQueueRow } from "../attention/attentionQueue";

const signalTones: Record<string, string> = { blocked: "danger", overdue: "danger", "high-risk": "danger", "waiting-qa": "info", "due-soon": "warning", unassigned: "warning", "no-mitigation": "warning", resolved: "success" };

export function RiskTriageRow({ row, selected, pending, onSelect }: { row: AttentionQueueRow; selected: boolean; pending: boolean; onSelect: () => void }) {
  return <li className={`risk-triage-row${selected ? " is-selected" : ""}`} aria-busy={pending}>
    <button className="risk-review-row" type="button" onClick={onSelect} aria-pressed={selected} disabled={pending}>
      <span className="risk-review-row-heading"><strong>{row.title}</strong><span className={`status-pill status-pill-${row.priority === "critical" || row.priority === "high" ? "danger" : row.priority === "medium" ? "warning" : "neutral"}`}>{row.priority} {row.source === "risk" ? "risk" : "priority"}</span></span>
      {row.detail ? <span className="risk-review-row-detail">{row.detail}</span> : null}
      <span className="risk-review-row-meta">{row.source === "risk" ? "Risk" : "Task"} · {row.context} · {row.status.replaceAll("-", " ")}{row.areaLabels?.length ? ` · ${row.areaLabels.join(", ")}` : ""} · {row.dueDate ? <>Due <time dateTime={row.dueDate}>{row.dueDate}</time></> : "No due date"}</span>
      {row.reasons.length ? <span className="risk-review-row-signals">{row.reasons.map((reason, index) => <span className={`risk-signal tone-${signalTones[row.signals[index]] ?? "neutral"}`} key={reason}>{reason}</span>)}</span> : null}
      {pending ? <span role="status">Saving risk…</span> : null}
    </button>
  </li>;
}
