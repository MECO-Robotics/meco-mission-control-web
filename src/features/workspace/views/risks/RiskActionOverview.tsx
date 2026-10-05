import { useMemo, useState, type DragEvent } from "react";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";
import { toRiskPayload } from "../riskViewData/riskViewDataPayload";

type RiskStatus = RiskRecord["status"];
const statuses: RiskStatus[] = ["open", "in-progress", "blocked", "resolved"];
const severities: RiskRecord["severity"][] = ["critical", "high", "medium", "low"];

export function filterRiskRecords(risks: RiskRecord[], filters: { owner: string; status: RiskStatus | "active"; due: string; people: FilterSelection; search?: string }, today: string) {
  const query = filters.search?.trim().toLocaleLowerCase() ?? "";
  return risks.filter((risk) => {
    const overdue = Boolean(risk.mitigationDueDate && risk.mitigationDueDate < today);
    return (!filters.people.length || (risk.ownerMemberId !== null && filters.people.includes(risk.ownerMemberId)))
      && (filters.status === "active" ? risk.status !== "resolved" : risk.status === filters.status)
      && (filters.owner === "all" || (filters.owner === "unassigned" ? !risk.ownerMemberId : risk.ownerMemberId === filters.owner))
      && (filters.due === "all" || (filters.due === "overdue" ? overdue : filters.due === "unset" ? !risk.mitigationDueDate : Boolean(risk.mitigationDueDate)))
      && (!query || `${risk.title} ${risk.detail}`.toLocaleLowerCase().includes(query));
  });
}

export function countRiskActions(risks: RiskRecord[], today: string) {
  const active = risks.filter((risk) => risk.status !== "resolved");
  return {
    unassigned: active.filter((risk) => !risk.ownerMemberId),
    blocked: active.filter((risk) => risk.status === "blocked"),
    overdue: active.filter((risk) => Boolean(risk.mitigationDueDate && risk.mitigationDueDate < today)),
  };
}

export function changeRiskSeverity(risks: RiskRecord[], riskId: string, severity: RiskRecord["severity"], update: Props["onUpdateRisk"]) {
  const risk = risks.find((item) => item.id === riskId);
  if (risk && risk.severity !== severity) void update(riskId, { ...toRiskPayload(risk), severity });
}

interface Props {
  bootstrap: BootstrapPayload;
  activePersonFilter: FilterSelection;
  onCreateRisk: () => void;
  onOpenRisk: (risk: RiskRecord) => void;
  onUpdateRisk: (id: string, payload: RiskPayload) => Promise<void>;
}

export function RiskActionOverview({ activePersonFilter, bootstrap, onCreateRisk, onOpenRisk, onUpdateRisk }: Props) {
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<RiskStatus | "active">("active");
  const [dueFilter, setDueFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const risks = useMemo(() => filterRiskRecords(bootstrap.risks, { owner: ownerFilter, status: statusFilter, due: dueFilter, people: activePersonFilter, search: searchFilter }, today), [activePersonFilter, bootstrap.risks, dueFilter, ownerFilter, searchFilter, statusFilter, today]);
  const actionCountsByType = countRiskActions(bootstrap.risks.filter((risk) => !activePersonFilter.length || (risk.ownerMemberId !== null && activePersonFilter.includes(risk.ownerMemberId))), today);
  const overdueIds = new Set(actionCountsByType.overdue.map((risk) => risk.id));
  const actionCounts: Array<{ label: string; risks: RiskRecord[] }> = [
    { label: "Unassigned", risks: actionCountsByType.unassigned },
    { label: "Blocked", risks: actionCountsByType.blocked },
    { label: "Overdue", risks: actionCountsByType.overdue },
  ];
  const ownerName = (risk: RiskRecord) => bootstrap.members.find((member) => member.id === risk.ownerMemberId)?.name ?? "Unassigned";
  const taskName = (risk: RiskRecord) => {
    const task = bootstrap.tasks.find((item) => item.id === risk.mitigationTaskId);
    return task ? `Mitigation · ${task.title} · ${task.status}` : "No mitigation task";
  };
  const moveSeverity = (event: DragEvent<HTMLElement>, severity: RiskRecord["severity"]) => {
    const id = event.dataTransfer.getData("text/risk-id");
    changeRiskSeverity(bootstrap.risks, id, severity, onUpdateRisk);
  };
  return <>
    <TopbarResponsiveSearch
      actions={<CompactFilterMenu
        activeCount={(ownerFilter === "all" ? 0 : 1) + (statusFilter === "active" ? 0 : 1) + (dueFilter === "all" ? 0 : 1)}
        ariaLabel="Risk filters"
        buttonLabel="Filter risks"
        iconOnly
        items={[
          { label: "Owner", content: <select aria-label="Risk owner filter" className="toolbar-filter-select" onChange={(event) => setOwnerFilter(event.target.value)} value={ownerFilter}><option value="all">All owners</option><option value="unassigned">Unassigned</option>{bootstrap.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select> },
          { label: "Status", content: <select aria-label="Risk status filter" className="toolbar-filter-select" onChange={(event) => setStatusFilter(event.target.value as RiskStatus | "active")} value={statusFilter}><option value="active">Active (default)</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select> },
          { label: "Due date", content: <select aria-label="Risk due date filter" className="toolbar-filter-select" onChange={(event) => setDueFilter(event.target.value)} value={dueFilter}><option value="all">Any due date</option><option value="overdue">Overdue</option><option value="set">Has due date</option><option value="unset">No due date</option></select> },
        ]}
      />}
      ariaLabel="Search risks"
      compactPlaceholder="Search"
      onChange={setSearchFilter}
      placeholder="Search risks..."
      portalToTopbar
      value={searchFilter}
    />
    <WorkspaceTopbarAddMenu
      actions={buildSingleAddMenuAction({ label: "Add risk", onSelect: onCreateRisk })}
      ariaLabel="Add risk"
      title="Add risk"
    />
    <section aria-label="Risk actions and severity board" className="risk-action-workspace">
    <div className="risk-action-counts">
      {actionCounts.map(({ label, risks: rows }) => <section className="risk-action-count" key={label}><span>{label}</span><strong>{rows.length}</strong><ul>{rows.map((risk) => <li key={risk.id}><button className="ghost-button" onClick={() => onOpenRisk(risk)} type="button">{risk.title}</button></li>)}</ul></section>)}
    </div>
    <div className="risk-severity-board" aria-label="Risks by severity">{severities.map((severity) => {
      const lane = risks.filter((risk) => risk.severity === severity);
      return <section className="risk-severity-lane" key={severity} onDragOver={(event) => event.preventDefault()} onDrop={(event) => moveSeverity(event, severity)}><h3>{severity} <span>{lane.length}</span></h3>{lane.map((risk) => <article className="risk-board-card" draggable onDragStart={(event) => event.dataTransfer.setData("text/risk-id", risk.id)} key={risk.id}><button className="risk-board-title" onClick={() => onOpenRisk(risk)} type="button">{risk.title}</button><p>{ownerName(risk)} · {risk.status}</p><small>{risk.mitigationDueDate ? `${overdueIds.has(risk.id) ? "Overdue · " : "Due · "}${risk.mitigationDueDate}` : "No due date"}</small><small>{taskName(risk)}</small></article>)}</section>;
    })}</div>
    </section>
  </>;
}
