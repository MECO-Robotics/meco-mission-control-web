import { useEffect, useMemo, useRef, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { PaginationControls, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { buildSingleAddMenuAction, WorkspaceTopbarControls } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { AttentionQueueRow } from "../attention/attentionQueue";
import { buildRiskDashboard, type RiskChartSelection } from "./riskDashboardModel";
import type { RiskTriageFilters } from "./riskTriageModel";
import { RiskDashboardCharts } from "./RiskDashboardCharts";
import { RiskReviewContext } from "./RiskReviewContext";
import { RiskTriageRow } from "./RiskTriageRow";
import "./riskTriage.css";

const initialFilters: RiskTriageFilters = { search: "", source: "all", owner: "all", signal: "all", sortField: "priority", sortDirection: "asc" };
const signalOptions = [["blocked", "Blocking work"], ["overdue", "Overdue"], ["high-risk", "Critical / high risk"], ["waiting-qa", "Waiting for QA"], ["due-soon", "Due soon"], ["unassigned", "Unassigned"], ["no-mitigation", "No mitigation task"]] as const;

interface Props {
  bootstrap: BootstrapPayload;
  activePersonFilter: FilterSelection;
  pendingRiskIds: ReadonlySet<string>;
  riskErrors: Readonly<Record<string, string>>;
  selectedRisk: RiskRecord | null;
  onCreateRisk: () => void;
  onOpenRisk: (risk: RiskRecord) => void;
  onCloseRisk: () => void;
  onEditRisk: (risk: RiskRecord) => void;
  onOpenRecord: (kind: string, id: string) => void;
  onUpdateRisk: (id: string, patch: Partial<RiskPayload>) => Promise<void>;
}

export function RiskTriageQueue({ bootstrap, activePersonFilter, pendingRiskIds, riskErrors, selectedRisk, onCreateRisk, onOpenRisk, onCloseRisk, onEditRisk, onOpenRecord, onUpdateRisk }: Props) {
  const [filters, setFilters] = useRememberedViewState("risks.triage.filters", initialFilters);
  const [includeResolvedRisks, setIncludeResolvedRisks] = useRememberedViewState("risks.triage.includeResolved", false);
  const [selection, setSelection] = useRememberedViewState<RiskChartSelection | null>("risks.review.selection", null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const peopleScope = JSON.stringify([...activePersonFilter].sort());
  const previousPeopleScope = useRef(peopleScope);
  useEffect(() => {
    if (previousPeopleScope.current === peopleScope) return;
    previousPeopleScope.current = peopleScope;
    setSelectedTaskId(null);
    onCloseRisk();
  }, [peopleScope, onCloseRisk]);
  const model = useMemo(() => buildRiskDashboard({ bootstrap, activePersonFilter, filters, includeResolvedRisks, selection }), [bootstrap, activePersonFilter, filters, includeResolvedRisks, selection]);
  const pagination = useWorkspacePagination(model.queueRows);
  const setPage = pagination.setPage;
  useEffect(() => { setPage(1); }, [filters, includeResolvedRisks, activePersonFilter, selection, setPage]);
  const selected = selectedRisk ? { kind: "risk" as const, id: selectedRisk.id } : selectedTaskId && bootstrap.tasks.some((task) => task.id === selectedTaskId) ? { kind: "task" as const, id: selectedTaskId } : null;
  const closeContext = () => { setSelectedTaskId(null); onCloseRisk(); };
  const updateFilters = (patch: Partial<RiskTriageFilters>) => { closeContext(); setFilters((current) => ({ ...current, ...patch })); };
  const selectChart = (next: RiskChartSelection) => {
    closeContext();
    setSelection((current) => JSON.stringify(current) === JSON.stringify(next) ? null : next);
  };
  const selectionLabel = !selection ? "" : selection.kind === "area" ? `${model.areas.find((area) => area.id === selection.areaId)?.label ?? "Area"}${selection.segment ? ` · ${selection.segment === "qa" ? "QA" : selection.segment}` : ""}` : selection.kind === "deadline" ? `${selection.source === "task" ? "Tasks" : "Mitigations"} · ${model.deadlines.find((bucket) => bucket.id === selection.bucket)?.label ?? selection.bucket}` : `${selection.owner ? "Named owner" : "No named owner"} · ${selection.mitigation ? "mitigation linked" : "no mitigation"}`;
  const selectRow = (row: AttentionQueueRow) => {
    if (row.source === "risk") {
      setSelectedTaskId(null);
      const risk = bootstrap.risks.find((item) => item.id === row.recordId);
      if (risk) onOpenRisk(risk);
    } else { onCloseRisk(); setSelectedTaskId(row.recordId); }
  };
  const activeCount = Number(filters.source !== "all") + Number(filters.owner !== "all") + Number(filters.signal !== "all") + Number(includeResolvedRisks);
  return <>
    <TopbarResponsiveSearch ariaLabel="Search risks" compactPlaceholder="Search" placeholder="Search risks and affected work…" value={filters.search} onChange={(search) => updateFilters({ search })} actions={<>
      <CompactFilterMenu ariaLabel="Risk filters" buttonLabel="Filter risks" iconOnly activeCount={activeCount} items={[
        { label: "Source", content: <select className="toolbar-filter-select" aria-label="Triage source" value={filters.source} onChange={(event) => updateFilters({ source: event.target.value })}><option value="all">Risks and tasks</option><option value="risk">Risks</option><option value="task">Tasks</option></select> },
        { label: "Owner", content: <select className="toolbar-filter-select" aria-label="Triage owner" value={filters.owner} onChange={(event) => updateFilters({ owner: event.target.value })}><option value="all">All owners</option><option value="unassigned">Unassigned</option>{bootstrap.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select> },
        { label: "Signal", content: <select className="toolbar-filter-select" aria-label="Triage signal" value={filters.signal} onChange={(event) => updateFilters({ signal: event.target.value })}><option value="all">All signals</option>{signalOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> },
        { label: "Resolved", content: <label className="risk-triage-resolved"><input type="checkbox" checked={includeResolvedRisks} onChange={(event) => { closeContext(); setIncludeResolvedRisks(event.target.checked); }} />Include resolved risks</label> },
      ]} />
      <WorkspaceSortMenu label="risks" field={filters.sortField} direction={filters.sortDirection} onFieldChange={(sortField) => updateFilters({ sortField })} onDirectionChange={(sortDirection) => updateFilters({ sortDirection })} options={[{ label: "Priority", value: "priority" }, { label: "Title", value: "title" }, { label: "Due date", value: "dueDate" }]} />
    </>} />
    {selection ? <AppTopbarSlotPortal slot="controls"><WorkspaceTopbarControls><button className="risk-chart-clear" type="button" aria-label={`Clear chart selection: ${selectionLabel}`} onClick={() => { closeContext(); setSelection(null); }}><span>{selectionLabel}</span><strong>Clear</strong></button></WorkspaceTopbarControls></AppTopbarSlotPortal> : null}
    <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add risk", onSelect: onCreateRisk })} ariaLabel="Add risk" title="Add risk" />
    <RiskDashboardCharts areas={model.areas} deadlines={model.deadlines} responses={model.responses} selection={selection} onSelect={selectChart} />
    <div className={`risk-review-workspace${selected ? " has-selection" : ""}`}>
      <section className="risk-triage" aria-label="Review queue">
        <div className="risk-queue-summary"><h2>Review queue</h2><span>{model.queueRows.length} records · {model.queueRows.filter((row) => row.source === "risk").length} risks · {model.queueRows.filter((row) => row.source === "task").length} tasks</span></div>
        {model.queueRows.length ? <ul className="workspace-record-list">{pagination.pageItems.map((row) => <RiskTriageRow key={row.key} row={row} pending={row.source === "risk" && pendingRiskIds.has(row.recordId)} selected={selected?.kind === row.source && selected.id === row.recordId} onSelect={() => selectRow(row)} />)}</ul> : <p className="empty-state">{model.rows.length ? "No records match this selection. Clear the chart selection or adjust the filters." : "No matching risks or unfinished tasks in this scope."}</p>}
        <PaginationControls label="triage items" {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </section>
      {selected ? <RiskReviewContext key={`${selected.kind}:${selected.id}`} bootstrap={bootstrap} selected={selected} pending={selected.kind === "risk" && pendingRiskIds.has(selected.id)} error={selected.kind === "risk" ? riskErrors[selected.id] : undefined} onClose={closeContext} onEditRisk={onEditRisk} onUpdateRisk={onUpdateRisk} onOpenRecord={onOpenRecord} /> : null}
    </div>
  </>;
}
