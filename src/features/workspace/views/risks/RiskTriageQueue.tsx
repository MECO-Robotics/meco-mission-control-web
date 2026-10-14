import { useEffect, useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { PaginationControls, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { buildAttentionQueue } from "../attention/attentionQueue";
import { filterRiskTriageRows, type RiskTriageFilters } from "./riskTriageModel";
import { RiskTriageRow } from "./RiskTriageRow";
import "./riskTriage.css";

const initialFilters: RiskTriageFilters = { search: "", source: "all", owner: "all", signal: "all", sortField: "priority", sortDirection: "asc" };
const signalOptions = [
  ["blocked", "Blocking work"], ["overdue", "Overdue"], ["high-risk", "Critical / high risk"],
  ["waiting-qa", "Waiting for QA"], ["due-soon", "Due soon"], ["unassigned", "Unassigned"], ["no-mitigation", "No mitigation task"],
] as const;

interface Props {
  bootstrap: BootstrapPayload;
  activePersonFilter: FilterSelection;
  pendingRiskIds: ReadonlySet<string>;
  riskErrors: Readonly<Record<string, string>>;
  editingRiskId: string | null;
  onCreateRisk: () => void;
  onOpenRisk: (risk: RiskRecord) => void;
  onOpenTask: (id: string) => void;
  onUpdateRisk: (id: string, patch: Partial<RiskPayload>) => Promise<void>;
}

export function RiskTriageQueue({ bootstrap, activePersonFilter, pendingRiskIds, riskErrors, editingRiskId, onCreateRisk, onOpenRisk, onOpenTask, onUpdateRisk }: Props) {
  const [filters, setFilters] = useRememberedViewState("risks.triage.filters", initialFilters);
  const [includeResolvedRisks, setIncludeResolvedRisks] = useRememberedViewState("risks.triage.includeResolved", false);
  const rows = useMemo(() => buildAttentionQueue({ bootstrap, activePersonFilter, includeResolvedRisks }), [bootstrap, activePersonFilter, includeResolvedRisks]);
  const filtered = useMemo(() => filterRiskTriageRows(rows, filters), [rows, filters]);
  const pagination = useWorkspacePagination(filtered);
  const setPage = pagination.setPage;
  useEffect(() => { setPage(1); }, [filters, includeResolvedRisks, activePersonFilter, setPage]);
  const risksById = useMemo(() => new Map(bootstrap.risks.map((risk) => [risk.id, risk])), [bootstrap.risks]);
  const tasksById = useMemo(() => new Map(bootstrap.tasks.map((task) => [task.id, task])), [bootstrap.tasks]);
  const updateFilters = (patch: Partial<RiskTriageFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const activeCount = Number(filters.source !== "all") + Number(filters.owner !== "all") + Number(filters.signal !== "all") + Number(includeResolvedRisks);
  return <>
    <TopbarResponsiveSearch ariaLabel="Search risks" compactPlaceholder="Search" placeholder="Search risks and tasks…" value={filters.search} onChange={(search) => updateFilters({ search })} actions={<>
      <CompactFilterMenu ariaLabel="Risk filters" buttonLabel="Filter risks" iconOnly activeCount={activeCount} items={[
        { label: "Source", content: <select className="toolbar-filter-select" aria-label="Triage source" value={filters.source} onChange={(event) => updateFilters({ source: event.target.value })}><option value="all">Risks and tasks</option><option value="risk">Risks</option><option value="task">Tasks</option></select> },
        { label: "Owner", content: <select className="toolbar-filter-select" aria-label="Triage owner" value={filters.owner} onChange={(event) => updateFilters({ owner: event.target.value })}><option value="all">All owners</option><option value="unassigned">Unassigned</option>{bootstrap.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select> },
        { label: "Signal", content: <select className="toolbar-filter-select" aria-label="Triage signal" value={filters.signal} onChange={(event) => updateFilters({ signal: event.target.value })}><option value="all">All signals</option>{signalOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> },
        { label: "Resolved", content: <label className="risk-triage-resolved"><input type="checkbox" checked={includeResolvedRisks} onChange={(event) => setIncludeResolvedRisks(event.target.checked)} />Include resolved risks</label> },
      ]} />
      <WorkspaceSortMenu label="risks" field={filters.sortField} direction={filters.sortDirection} onFieldChange={(sortField) => updateFilters({ sortField })} onDirectionChange={(sortDirection) => updateFilters({ sortDirection })} options={[{ label: "Priority", value: "priority" }, { label: "Title", value: "title" }, { label: "Due date", value: "dueDate" }]} />
    </>} />
    <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add risk", onSelect: onCreateRisk })} ariaLabel="Add risk" title="Add risk" />
    <section className="risk-triage" aria-label="Action Required">
      {filtered.length ? <ul className="workspace-record-list">{pagination.pageItems.map((row) => {
        const risk = row.source === "risk" ? risksById.get(row.recordId) : undefined;
        return <RiskTriageRow key={row.key} row={row} risk={risk} members={bootstrap.members} mitigationTask={risk?.mitigationTaskId ? tasksById.get(risk.mitigationTaskId) : undefined} pending={Boolean(risk && pendingRiskIds.has(risk.id))} editing={Boolean(risk && editingRiskId === risk.id)} error={risk ? riskErrors[risk.id] : undefined} onOpenRisk={onOpenRisk} onOpenTask={onOpenTask} onUpdateRisk={onUpdateRisk} />;
      })}</ul> : <p className="empty-state">{rows.length ? "No risks or tasks match these filters. Change the search or filters to see more." : "No active risks or tasks need attention in this scope."}</p>}
      <PaginationControls label="triage items" {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </section>
  </>;
}
