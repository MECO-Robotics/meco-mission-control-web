import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";
import type { AttentionQueueRow } from "../attention/attentionQueue";

interface Props {
  row: AttentionQueueRow;
  risk?: RiskRecord;
  members: BootstrapPayload["members"];
  mitigationTask?: BootstrapPayload["tasks"][number];
  pending: boolean;
  editing: boolean;
  error?: string;
  onOpenRisk: (risk: RiskRecord) => void;
  onOpenTask: (id: string) => void;
  onUpdateRisk: (id: string, patch: Partial<RiskPayload>) => Promise<void>;
}

export function RiskTriageRow({ row, risk, members, mitigationTask, pending, editing, error, onOpenRisk, onOpenTask, onUpdateRisk }: Props) {
  const disabled = pending || editing;
  return <li className="risk-triage-row" aria-busy={pending}>
    <div className="risk-triage-record">
      <button className="ghost-button risk-triage-title" disabled={pending} type="button" onClick={() => risk ? onOpenRisk(risk) : onOpenTask(row.recordId)}>{row.title}</button>
      <small>{risk ? "Risk" : "Task"} · {row.context}{!risk ? ` · ${row.priority} · ${row.status}` : ""} · {row.dueDate ? <>Due <time dateTime={row.dueDate}>{row.dueDate}</time></> : "No due date"}</small>
      {row.reasons.length ? <p>{row.reasons.slice(0, 2).join(" · ")}</p> : null}
      {row.reasons.length > 2 ? <details className="risk-triage-signals"><summary>{row.reasons.length - 2} more {row.reasons.length === 3 ? "signal" : "signals"}</summary><ul>{row.reasons.slice(2).map((reason) => <li key={reason}>{reason}</li>)}</ul></details> : null}
      {mitigationTask ? <button className="ghost-button risk-triage-mitigation" type="button" onClick={() => onOpenTask(mitigationTask.id)}>Mitigation: {mitigationTask.title} · {mitigationTask.status}</button> : null}
      {pending ? <small role="status">Saving risk…</small> : null}
      {error ? <p className="error-message" role="alert">{error} Choose the value again to retry.</p> : null}
    </div>
    {risk ? <div className="risk-triage-actions" role="group" aria-label={`Update ${row.title}`}>
      <label className="field"><span>Owner</span><select aria-label={`Owner for ${row.title}`} disabled={disabled} value={risk.ownerMemberId ?? ""} onChange={(event) => void onUpdateRisk(risk.id, { ownerMemberId: event.target.value || null })}>
        <option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
      </select></label>
      <label className="field"><span>Severity</span><select aria-label={`Severity for ${row.title}`} disabled={disabled} value={risk.severity} onChange={(event) => void onUpdateRisk(risk.id, { severity: event.target.value as RiskRecord["severity"] })}>
        <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
      </select></label>
      <label className="field"><span>Status</span><select aria-label={`Status for ${row.title}`} disabled={disabled} value={risk.status} onChange={(event) => void onUpdateRisk(risk.id, { status: event.target.value as RiskRecord["status"] })}>
        <option value="open">Open</option><option value="in-progress">In progress</option><option value="blocked">Blocked</option><option value="resolved">Resolved</option>
      </select></label>
    </div> : null}
  </li>;
}
