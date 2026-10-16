import { useState } from "react";
import { RiskDetailsView } from "./RiskDetailsView";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";
import { WorkspaceAuditActionList } from "@/features/workspace/shared/WorkspaceAuditActionList";
import { riskAuditActions } from "../riskViewData/riskAuditActions";
import { getRiskRecordReference } from "../riskViewData/riskRecordLinks";
import { RiskImpactGraph } from "./RiskImpactGraph";

interface Props {
  bootstrap: BootstrapPayload;
  selected: { kind: "risk" | "task"; id: string };
  pending: boolean;
  error?: string;
  onClose: () => void;
  onEditRisk: (risk: RiskRecord) => void;
  onUpdateRisk: (id: string, patch: Partial<RiskPayload>) => Promise<void>;
  onOpenRecord: (kind: string, id: string) => void;
}

export function RiskReviewContext({ bootstrap, selected, pending, error, onClose, onEditRisk, onUpdateRisk, onOpenRecord }: Props) {
  const [inspectedReference, setInspectedReference] = useState<{ kind: string; id: string } | null>(null);
  const risk = selected.kind === "risk" ? bootstrap.risks.find((item) => item.id === selected.id) : undefined;
  const task = selected.kind === "task" ? bootstrap.tasks.find((item) => item.id === selected.id) : undefined;
  if (!risk && !task) return null;
  const title = risk?.title ?? task!.title;
  const priority = risk?.severity ?? task!.priority;
  const source = risk && risk.source.kind !== "manual" ? getRiskRecordReference(risk.source, bootstrap) : null;
  const sourceReport = source?.kind === "report" ? bootstrap.reports.find((report) => report.id === source.id) : null;
  const owner = bootstrap.members.find((member) => member.id === (risk?.ownerMemberId ?? task?.ownerId));
  const ownerGroup = risk?.ownerGroupId ? bootstrap.responsibleGroups.find((group) => group.id === risk.ownerGroupId) : undefined;
  const links = risk ? risk.relatedTargets.map((ref) => getRiskRecordReference(ref, bootstrap)) : [];
  const preview = inspectedReference ? getRiskRecordReference(inspectedReference, bootstrap) : null;
  const openRecord = (kind: string, id: string) => {
    if (["project", "responsible-group", "vendor", "meeting", "event", "design-iteration"].includes(kind)) setInspectedReference({ kind, id });
    else onOpenRecord(kind, id);
  };
  return <RiskDetailsView title={title} kind={selected.kind} pending={pending} onClose={onClose}>
    <div className="risk-context-meta"><span className={`status-pill status-pill-${priority === "high" || priority === "critical" ? "danger" : priority === "medium" ? "warning" : "neutral"}`}>{priority} {risk ? "risk" : "priority"}</span><span>{(risk?.status ?? task!.status).replaceAll("-", " ")}</span></div>
    <p className="risk-context-description">{risk?.detail || task?.summary || "No additional details recorded."}</p>
    <RiskImpactGraph key={`${selected.kind}:${selected.id}`} bootstrap={bootstrap} selected={selected} onOpenRecord={openRecord} />
    {preview ? <section className="risk-context-evidence" aria-label={`Linked record ${preview.label}`}>
      <div className="risk-context-heading"><h3>{preview.label}</h3><button className="risk-context-link" type="button" onClick={() => setInspectedReference(null)}>Close linked record</button></div>
      {preview.taskIds.length ? <ul>{preview.taskIds.map((id) => <li key={id}><button className="risk-context-link" type="button" onClick={() => onOpenRecord("task", id)}>{bootstrap.tasks.find((item) => item.id === id)?.title ?? id}</button></li>)}</ul> : <p>No directly linked work is recorded.</p>}
    </section> : null}
    {risk ? <>
      <div className="risk-context-fields" role="group" aria-label={`Update ${title}`}>
        <label className="field"><span>Owner</span><select aria-label={`Owner for ${title}`} disabled={pending} value={risk.ownerMemberId ?? ""} onChange={(event) => void onUpdateRisk(risk.id, { ownerMemberId: event.target.value || null })}>
          <option value="">Unassigned{ownerGroup ? ` (${ownerGroup.name} group)` : ""}</option>{bootstrap.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select></label>
        <label className="field"><span>Severity</span><select aria-label={`Severity for ${title}`} disabled={pending} value={risk.severity} onChange={(event) => void onUpdateRisk(risk.id, { severity: event.target.value as RiskRecord["severity"] })}>
          <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select></label>
        <label className="field"><span>Status</span><select aria-label={`Status for ${title}`} disabled={pending} value={risk.status} onChange={(event) => void onUpdateRisk(risk.id, { status: event.target.value as RiskRecord["status"] })}>
          <option value="open">Open</option><option value="in-progress">In progress</option><option value="blocked">Blocked</option><option value="resolved">Resolved</option>
        </select></label>
        <label className="field risk-context-wide"><span>Mitigation work</span><select aria-label={`Mitigation for ${title}`} disabled={pending} value={risk.mitigationTaskId ?? ""} onChange={(event) => void onUpdateRisk(risk.id, { mitigationTaskId: event.target.value || null })}>
          <option value="">No mitigation task</option>{risk.mitigationTaskId && !bootstrap.tasks.some((item) => item.id === risk.mitigationTaskId) ? <option value={risk.mitigationTaskId}>Linked task unavailable</option> : null}{bootstrap.tasks.filter((item) => item.projectId === risk.projectId).map((item) => <option key={item.id} value={item.id}>{item.title}{item.status === "complete" ? " (complete)" : ""}</option>)}
        </select></label>
      </div>
      <div className="risk-context-actions"><button className="secondary-action" type="button" disabled={pending} onClick={() => onEditRisk(risk)}>Edit risk</button>{risk.mitigationTaskId && bootstrap.tasks.some((item) => item.id === risk.mitigationTaskId) ? <button className="secondary-action" type="button" onClick={() => onOpenRecord("task", risk.mitigationTaskId!)}>Open mitigation task</button> : null}</div>
      <p className="risk-context-meta">Mitigation due: {risk.mitigationDueDate ?? "Not set"}{risk.mitigationTaskId && bootstrap.tasks.find((item) => item.id === risk.mitigationTaskId)?.status === "complete" && risk.status !== "resolved" ? " · Mitigation complete; risk still open" : ""}</p>
    </> : <div className="risk-context-actions"><span>{owner?.name ?? "Unassigned"} · Due {task!.dueDate || "not set"}</span><button className="secondary-action" type="button" onClick={() => onOpenRecord("task", task!.id)}>Open task</button></div>}
    {pending ? <p role="status">Saving risk…</p> : null}
    {error ? <p className="risk-context-error" role="alert">{error} Choose the value again to retry.</p> : null}
    {source ? <section className="risk-context-evidence"><h3>Source evidence</h3><button className="risk-context-link" disabled={!source.available} type="button" onClick={() => openRecord(source.kind, source.id)}>{source.label}{!source.available ? " (unavailable)" : ""}</button>{sourceReport ? <p>{(sourceReport.result ?? "Not assessed").replaceAll("-", " ")}{sourceReport.notes && sourceReport.notes !== sourceReport.summary ? ` · ${sourceReport.notes}` : ""}</p> : null}</section> : null}
    {links.length ? <section className="risk-context-evidence"><h3>Attached records</h3><ul>{links.map((ref) => <li key={ref.key}><button className="risk-context-link" disabled={!ref.available} type="button" onClick={() => openRecord(ref.kind, ref.id)}>{ref.label}{!ref.available ? " (unavailable)" : ""}</button></li>)}</ul></section> : null}
    {risk ? <details className="risk-context-audit"><summary>Risk history</summary><WorkspaceAuditActionList actions={riskAuditActions(bootstrap.actions, risk)} emptyText="No risk changes recorded." /></details> : null}
  </RiskDetailsView>;
}
