import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/ModalDialog";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { BootstrapPayload } from "@/types/bootstrap";
import { filterSelectionMatchesTaskPeople, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { buildSingleAddMenuAction, WorkspaceTopbarControls } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { PaginationControls, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { buildAttentionQueue } from "../../attention/attentionQueue";
import { getRiskRecordReference } from "../../riskViewData/riskRecordLinks";
import { RiskImpactGraph } from "../RiskImpactGraph";
import { buildPrototypeConcerns, buildConcernAreas, buildConcernContextTasks, createConcernScenarios, createConcernScenarioTasks, filterPrototypeConcerns, type PrototypeConcern, type ConcernContextTask } from "./riskConcernPrototypeModel";
import "../riskTriage.css";
import "./engineeringRisksPrototype.css";

type Selection = { kind: "subject" | "milestone"; id: string } | null;
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const severityTone = (severity: PrototypeConcern["severity"]) => severity === "critical" || severity === "high" ? "danger" : severity === "medium" ? "warning" : "neutral";
const milestoneText = (concern: PrototypeConcern) => concern.milestones.length ? concern.milestones.map((milestone) => `${milestone.basis === "required" ? "Required before" : "Linked milestone"}: ${milestone.title}`).join("; ") : "No milestone linked";

export function EngineeringRisksPrototype({ bootstrap, activePersonFilter }: {
  bootstrap: BootstrapPayload;
  activePersonFilter: FilterSelection;
}) {
  const [source, setSource] = useState<"scenario" | "current">("scenario");
  const [examples, setExamples] = useState(createConcernScenarios);
  const [exampleTasks, setExampleTasks] = useState(createConcernScenarioTasks);
  const [search, setSearch] = useState("");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState({ field: "priority", direction: "asc" as "asc" | "desc" });
  const [draft, setDraft] = useState<PrototypeConcern | null>(null);
  const [taskList, setTaskList] = useState(false);
  const [taskDetail, setTaskDetail] = useState<ConcernContextTask | null>(null);
  const [notice, setNotice] = useState("");
  const [allAreas, setAllAreas] = useState(false);
  const [milestonesExpanded, setMilestonesExpanded] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 851px)").matches);
  useEffect(() => { const media = window.matchMedia("(min-width: 851px)"); const update = () => setMilestonesExpanded(media.matches); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const nextId = useRef(1);
  const reviewTrigger = useRef<HTMLButtonElement | null>(null);
  const closeConcern = () => { setSelectedId(null); reviewTrigger.current?.focus({ preventScroll: true }); };
  const current = useMemo(() => {
    const allowed = new Set(buildAttentionQueue({ bootstrap, activePersonFilter, includeResolvedRisks: true }).filter((row) => row.source === "risk").map((row) => row.recordId));
    return buildPrototypeConcerns(bootstrap).filter((concern) => allowed.has(concern.id));
  }, [bootstrap, activePersonFilter]);
  const concerns = source === "current" ? current : examples;
  const currentTaskIds = new Set(bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task)).map((task) => task.id));
  const tasks = source === "current" ? buildConcernContextTasks(bootstrap).filter((task) => currentTaskIds.has(task.id)) : exampleTasks;
  const base = filterPrototypeConcerns(concerns, { search, includeResolved });
  const areas = buildConcernAreas(base).sort((a, b) => b.criticalCount - a.criticalCount || b.highCount - a.highCount || a.areaLabel.localeCompare(b.areaLabel) || a.label.localeCompare(b.label));
  const maxArea = Math.max(1, ...areas.map((area) => area.count));
  const milestones = [...new Map(base.filter((concern) => concern.status !== "resolved").flatMap((concern) => concern.milestones.map((milestone) => [milestone.id, milestone] as const))).values()].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || a.title.localeCompare(b.title));
  const filtered = base.filter((concern) => !selection || (selection.kind === "subject" ? concern.subjects.some((subject) => subject.id === selection.id) : selection.id === "none" ? !concern.milestones.length : concern.milestones.some((milestone) => milestone.id === selection.id)));
  const rows = [...filtered].sort((a, b) => (sort.direction === "asc" ? 1 : -1) * (sort.field === "title" ? a.title.localeCompare(b.title) : priorityOrder[a.severity] - priorityOrder[b.severity] || a.title.localeCompare(b.title)));
  const pagination = useWorkspacePagination(rows);
  const setPage = pagination.setPage;
  useEffect(() => { setPage(1); }, [search, selection, includeResolved, source, setPage]);
  const selected = concerns.find((concern) => concern.id === selectedId) ?? null;
  const selectedLabel = !selection ? "" : selection.kind === "subject" ? areas.find((area) => area.id === selection.id)?.label ?? "Mechanism" : selection.id === "none" ? "No milestone linked" : milestones.find((milestone) => milestone.id === selection.id)?.title ?? "Milestone";
  const scopedTasks = tasks.filter((task) => task.status !== "complete" && (!selection || selection.kind !== "subject" || task.subjectIds.includes(selection.id)) && (!search.trim() || task.title.toLowerCase().includes(search.toLowerCase())));
  const blocked = scopedTasks.filter((task) => task.blocked);
  const selectMark = (next: NonNullable<Selection>) => { setSelectedId(null); setSelection((previous) => previous?.kind === next.kind && previous.id === next.id ? null : next); };
  const changeSource = (next: "scenario" | "current") => { setSource(next); setSearch(""); setSelection(null); setSelectedId(null); setNotice(""); };
  const selectConcern = (id: string) => { setNotice(""); setSelectedId(id); };
  const replaceExample = (next: PrototypeConcern) => setExamples((records) => records.map((record) => record.id === next.id ? next : record));
  const openTask = (task: ConcernContextTask) => setTaskDetail(task);
  const newExample = () => {
    changeSource("scenario");
    setDraft({ id: `example-added-${nextId.current++}`, title: "", detail: "", severity: "medium", status: "open", blocksWork: false, projectId: "scenario-project", ownerLabel: "Unassigned", subjects: [{ id: "no-mechanism", label: "No mechanism linked", areaLabel: "Project" }], evidence: [], mitigation: null, milestones: [], temporaryRepair: null, verification: { status: "not-recorded", criteria: "" }, scenario: true });
  };
  return <section className="panel dense-panel subsystem-manager-shell workspace-panel engineering-risk-prototype">
    <TopbarResponsiveSearch ariaLabel="Search engineering concerns" compactPlaceholder="Search" placeholder="Search concerns, mechanisms and evidence…" value={search} onChange={(value) => { setSearch(value); setSelectedId(null); }} actions={<>
      <CompactFilterMenu ariaLabel="Concern filters" buttonLabel="Filter concerns" iconOnly activeCount={Number(includeResolved)} items={[{ label: "Prototype data", content: <FilterDropdown className="engineering-prototype-source" allLabel="Prototype data" ariaLabel="Prototype data" showAllOption={false} singleSelect compactSummary hideButtonIcon buttonContent={<span>{source === "scenario" ? "Not saved" : "Read only"}</span>} options={[{ id: "scenario", name: "Review scenarios · not saved" }, { id: "current", name: "Current records · read only" }]} value={[source]} onChange={(value) => changeSource(value[0] === "current" ? "current" : "scenario")} /> }, { label: "Resolved", content: <label className="risk-triage-resolved"><input type="checkbox" checked={includeResolved} onChange={(event) => { setIncludeResolved(event.target.checked); setSelectedId(null); }} />Include resolved concerns</label> }]} />
      <WorkspaceSortMenu label="concerns" field={sort.field} direction={sort.direction} options={[{ value: "priority", label: "Severity" }, { value: "title", label: "Title" }]} onFieldChange={(field) => setSort((previous) => ({ ...previous, field }))} onDirectionChange={(direction) => setSort((previous) => ({ ...previous, direction }))} />
    </>} />
    <AppTopbarSlotPortal slot="controls"><WorkspaceTopbarControls>
      {selection ? <button className="risk-chart-clear" type="button" aria-label={`Clear chart selection: ${selectedLabel}`} onClick={() => { setSelection(null); setSelectedId(null); }}><span>{selectedLabel}</span><strong>Clear</strong></button> : null}
    </WorkspaceTopbarControls></AppTopbarSlotPortal>
    <WorkspaceTopbarAddMenu ariaLabel="Add example concern" title="Add example concern" actions={buildSingleAddMenuAction({ label: "Add example concern", onSelect: newExample })} />
    <div className={`engineering-workspace${selected ? " has-selection" : ""}`}>
      <section className="engineering-concerns" aria-label="Engineering concern queue">
        <div className="risk-queue-summary"><h2>Engineering concerns</h2><span>{rows.length} records{source === "scenario" ? " · scenarios, not saved" : " · current, read only"}</span></div>
        {notice ? <p className="engineering-notice" role="status">{notice}</p> : null}
        {rows.length ? <ul className="workspace-record-list">{pagination.pageItems.map((concern) => <li className="engineering-concern" key={concern.id}>
          <button type="button" className="risk-review-row" aria-pressed={selectedId === concern.id} onClick={(event) => { reviewTrigger.current = event.currentTarget; selectConcern(concern.id); }}>
            <span className="risk-review-row-heading"><strong>{concern.title}</strong><span className={`status-pill status-pill-${severityTone(concern.severity)}`}>{concern.severity}</span></span>
            <span className="risk-review-row-detail">{concern.detail}</span>
            <span className="risk-review-row-meta">{concern.subjects.map((subject) => subject.label).join(", ")} · {concern.ownerLabel} · {concern.status.replaceAll("-", " ")}</span>
            <span className="risk-review-row-signals">{concern.blocksWork ? <span className="risk-signal tone-danger">Explicitly blocks work</span> : <span className="risk-signal tone-neutral">No work block recorded</span>}{concern.temporaryRepair ? <span className="risk-signal tone-warning">Temporary repair</span> : null}{concern.mitigation?.status === "complete" && concern.status !== "resolved" ? <span className="risk-signal tone-info">Action complete; concern open</span> : null}{concern.verification.status === "pending" ? <span className="risk-signal tone-info">Verification pending</span> : null}{!concern.mitigation ? <span className="risk-signal tone-warning">No mitigation task</span> : null}</span>
            <span className="engineering-row-milestone">{milestoneText(concern)}</span>
            <span className="engineering-row-response">{concern.mitigation ? `Action: ${concern.mitigation.title} · ${concern.mitigation.status.replaceAll("-", " ")}` : "Mitigation action not recorded"}</span>
            <span className="engineering-row-review"><span>{concern.evidence.length ? `${concern.evidence[0].role === "source" ? "Reported by" : "Evidence"}: ${concern.evidence[0].label}${concern.evidence[0].available ? "" : " · unavailable"}${concern.evidence.length > 1 ? ` (+${concern.evidence.length - 1})` : ""}` : "Evidence not recorded"}</span><strong>Review concern</strong></span>
          </button>
        </li>)}</ul> : <p className="empty-state">No concerns match this scope. Clear the chart selection or adjust search.</p>}
        <PaginationControls label="engineering concerns" {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </section>
      {selected ? <ConcernContext key={selected.id} concern={selected} bootstrap={bootstrap} onClose={closeConcern} onEdit={() => setDraft(structuredClone(selected))} onReplace={replaceExample} onTaskComplete={() => {
        if (!selected.mitigation) return;
        replaceExample({ ...selected, mitigation: { ...selected.mitigation, status: "complete" } });
        setExampleTasks((records) => records.map((task) => task.id === selected.mitigation!.id ? { ...task, status: "complete", blocked: false } : task));
      }} onResolve={() => {
        if (!selected.scenario || selected.verification.status !== "verified" || !selected.verification.criteria.trim() || selected.verification.criteria === "Not recorded" || !selected.verification.evidence?.trim()) return;
        replaceExample({ ...selected, status: "resolved", blocksWork: false }); setSelectedId(null); setNotice("Example concern resolved after recorded verification. Current records were not changed.");
      }} /> : <aside className="engineering-support" aria-label="Concern comparisons and task context">
        <div className="engineering-overview">
      <section className="engineering-area-chart" aria-labelledby="engineering-areas-title">
        <div className="risk-chart-heading"><h2 id="engineering-areas-title">Open concerns by mechanism</h2><span>{base.filter((concern) => concern.status !== "resolved").length} unique concerns</span></div>
        <div className="engineering-column-labels"><span>Mechanism / subsystem</span><span>Open concerns · severity</span><span>Task context</span></div>
        <div className="risk-chart-legend"><span><i className="risk-chart-swatch tone-danger" />Critical / high</span><span><i className="risk-chart-swatch tone-warning" />Medium / low</span></div>
        {areas.length ? <ul className="engineering-area-list">{(allAreas ? areas : areas.slice(0, 5)).map((area) => {
          const unfinished = tasks.filter((task) => task.status !== "complete" && task.subjectIds.includes(area.id));
          const highCount = area.highCount + area.criticalCount;
          return <li key={area.id}>
            <button className="engineering-area-label" type="button" onClick={() => selectMark({ kind: "subject", id: area.id })} aria-pressed={selection?.kind === "subject" && selection.id === area.id}><strong>{area.label}</strong><small>{area.areaLabel}</small></button>
            <button className="engineering-risk-bar" type="button" aria-label={`${area.label}: ${area.count} open concerns, ${highCount} critical or high`} aria-pressed={selection?.kind === "subject" && selection.id === area.id} onClick={() => selectMark({ kind: "subject", id: area.id })} style={{ "--concern-width": `${area.count / maxArea * 100}%` } as CSSProperties}>
              {highCount ? <span className="engineering-bar-high" style={{ flexGrow: highCount }}>{highCount}</span> : null}{area.count > highCount ? <span className="engineering-bar-other" style={{ flexGrow: area.count - highCount }}>{area.count - highCount}</span> : null}
            </button>
            <span className="engineering-task-count"><span>{unfinished.length} unfinished</span><strong>{unfinished.filter((task) => task.blocked).length} blocked</strong></span>
          </li>;
        })}</ul> : <p className="empty-state">No open engineering concerns in this scope.</p>}
        {areas.length > 5 ? <button className="risk-context-link engineering-area-expand" type="button" onClick={() => setAllAreas(!allAreas)} aria-expanded={allAreas}>{allAreas ? "Show fewer mechanisms" : `Show all ${areas.length} mechanism groups`}</button> : null}
        <p className="risk-chart-note">A concern can affect several mechanisms; it appears once in the queue. Task counts are separate work records.</p>
      </section>
      <section className="engineering-milestones" aria-labelledby="engineering-milestones-title">
        <details className="engineering-milestone-details" open={milestonesExpanded} onToggle={(event) => setMilestonesExpanded(event.currentTarget.open)}><summary><h2 id="engineering-milestones-title">Before each milestone</h2><span>{milestones.length} milestones</span></summary>
        {milestones.map((milestone) => {
          const related = base.filter((concern) => concern.status !== "resolved" && concern.milestones.some((item) => item.id === milestone.id));
          return <button className="engineering-milestone" type="button" key={milestone.id} aria-pressed={selection?.kind === "milestone" && selection.id === milestone.id} onClick={() => selectMark({ kind: "milestone", id: milestone.id })}>
            <span className="engineering-milestone-heading"><strong>{milestone.title}</strong><time>{milestone.date ?? "Date not recorded"}</time></span>
            <span className="engineering-milestone-concerns">{related.map((concern) => {
              const required = concern.milestones.some((item) => item.id === milestone.id && item.basis === "required");
              return <span key={concern.id}><strong className={required ? "engineering-must-resolve" : undefined}>{required ? "Must resolve" : "Linked only"}</strong><span>{concern.title}</span></span>;
            })}</span>
          </button>;
        })}
        <button className="engineering-unlinked" type="button" aria-pressed={selection?.kind === "milestone" && selection.id === "none"} onClick={() => selectMark({ kind: "milestone", id: "none" })}><span>No milestone linked</span><strong>{base.filter((concern) => concern.status !== "resolved" && !concern.milestones.length).length}</strong></button>
        <p className="risk-chart-note">“Must resolve” concerns must be resolved before that milestone. Linked concerns have no recorded resolution requirement.</p></details>
        <button className="engineering-blocked-entry" type="button" onClick={() => setTaskList(true)}><span>Blocked tasks</span><strong>{blocked.length}</strong><span>Review tasks</span></button>
      </section>
    </div>
        <section className="engineering-task-preview" aria-label="Blocked tasks preview"><div className="risk-chart-heading"><h2>Blocked tasks</h2><span>{blocked.length} tasks</span></div>{blocked.slice(0, 3).map((task) => <button className="engineering-task-link" type="button" key={task.id} onClick={() => openTask(task)}><strong>{task.title}</strong><span>Task blocked · {task.status.replaceAll("-", " ")}</span></button>)}{!blocked.length ? <p className="risk-chart-note">No blocked tasks in this task scope. Open concerns can still require action.</p> : <button className="risk-context-link" type="button" onClick={() => setTaskList(true)}>Review all {blocked.length} blocked tasks</button>}</section></aside>}
    </div>
    {draft ? <ConcernEditor concern={draft} subjects={[...new Map(examples.flatMap((concern) => concern.subjects).map((subject) => [subject.id, subject])).values()]} milestones={[...new Map(examples.flatMap((concern) => concern.milestones.map((milestone) => [milestone.id, milestone] as const))).values()]} onClose={() => setDraft(null)} onSave={(next) => { setExamples((records) => records.some((record) => record.id === next.id) ? records.map((record) => record.id === next.id ? next : record) : [...records, next]); setDraft(null); setSelectedId(next.id); }} /> : null}
    {taskList ? <ModalDialog label="Blocked tasks" onClose={() => setTaskList(false)} dismissOnBackdrop><section className="modal-card"><div className="panel-header compact-header"><h2>Blocked tasks · {blocked.length}</h2><button className="secondary-action" type="button" onClick={() => setTaskList(false)}>Close</button></div><ul className="workspace-record-list">{blocked.map((task) => <li key={task.id}><button className="engineering-task-link" type="button" onClick={() => openTask(task)}><strong>{task.title}</strong><span>{task.status.replaceAll("-", " ")}</span></button></li>)}</ul>{!blocked.length ? <p>No blocked tasks in this scope.</p> : null}</section></ModalDialog> : null}
    {taskDetail ? <ModalDialog label={`Task: ${taskDetail.title}`} onClose={() => setTaskDetail(null)} dismissOnBackdrop><section className="modal-card"><div className="panel-header compact-header"><h2>{taskDetail.title}</h2><button className="secondary-action" type="button" onClick={() => setTaskDetail(null)}>Close</button></div><p>{taskDetail.scenario ? "Illustrative task" : "Current task · read only"} · {taskDetail.status.replaceAll("-", " ")}</p><p>{taskDetail.blocked ? "This task is explicitly blocked." : taskDetail.waitingOnDependency ? "Waiting for a hard dependency." : "No work block recorded."}</p>{!taskDetail.scenario ? <p>{bootstrap.tasks.find((task) => task.id === taskDetail.id)?.summary || "No task description recorded."}</p> : null}</section></ModalDialog> : null}
  </section>;
}

function ConcernContext({ concern, bootstrap, onClose, onEdit, onReplace, onTaskComplete, onResolve }: {
  concern: PrototypeConcern; bootstrap: BootstrapPayload; onClose: () => void; onEdit: () => void; onReplace: (next: PrototypeConcern) => void; onTaskComplete: () => void; onResolve: () => void;
}) {
  const [inline, setInline] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 1180px)").matches);
  const reviewHeading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => { if (inline) reviewHeading.current?.focus({ preventScroll: true }); }, [inline]);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationEvidence, setVerificationEvidence] = useState("");
  const [verificationCriteria, setVerificationCriteria] = useState(concern.verification.criteria === "Not recorded" ? "" : concern.verification.criteria);
  const [linkedReference, setLinkedReference] = useState<{ kind: string; id: string } | null>(null);
  useEffect(() => { const media = window.matchMedia("(min-width: 1180px)"); const update = () => setInline(media.matches); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const selectedEvidence = concern.evidence.find((item) => item.id === evidenceId);
  const attachedRecords = concern.scenario ? [] : (bootstrap.risks.find((risk) => risk.id === concern.id)?.relatedTargets ?? []).filter((ref) => !["task", "mechanism", "subsystem", "milestone", "report", "qa-finding", "test-finding", "qa-request", "test-result", "artifact"].includes(ref.kind)).map((ref) => getRiskRecordReference(ref, bootstrap));
  const content = <section className={`risk-review-context engineering-concern-context${inline ? "" : " modal-card task-details-modal"}`} aria-label={`Concern: ${concern.title}`} onKeyDown={(event) => { if (inline && event.key === "Escape" && !verificationOpen) { event.stopPropagation(); onClose(); } }}>
    <div className="risk-context-heading"><h2 ref={reviewHeading} tabIndex={-1}>{concern.title}</h2><button className="icon-button task-details-close-button" type="button" aria-label="Close concern review" onClick={onClose}><X size={18} /></button></div>
    <div className="risk-context-meta"><span className={`status-pill status-pill-${severityTone(concern.severity)}`}>{concern.severity} severity</span><span>{concern.status.replaceAll("-", " ")}</span><span>{concern.scenario ? "Illustrative scenario" : "Current record · read only"}</span></div>
    <p className="risk-context-description">{concern.detail}</p>
    <dl className="engineering-facts"><div><dt>Affects</dt><dd>{concern.subjects.map((subject) => subject.label).join(", ")}</dd></div><div><dt>Owner</dt><dd>{concern.ownerLabel}</dd></div><div><dt>Work blocking</dt><dd>{concern.blocksWork ? "Explicitly blocks work" : "No work block recorded"}</dd></div><div><dt>Milestones</dt><dd>{milestoneText(concern)}</dd></div></dl>
    {concern.milestones.length ? <section className="risk-context-evidence"><h3>Milestone conditions</h3><ul>{concern.milestones.map((milestone) => <li key={milestone.id}><strong>{milestone.title}</strong><p>{milestone.basis === "required" ? "Required concern clearance before milestone" : "Linked milestone; not a concern-clearance gate"} · {milestone.date?.slice(0, 10) ?? "Date not recorded"}</p>{milestone.conditions?.map((condition) => <p key={condition.id}>{condition.required ? "Required condition" : "Optional condition"} · {condition.conditionType}: {condition.conditionValue}{condition.notes ? ` · ${condition.notes}` : ""}</p>)}</li>)}</ul></section> : null}
    <section className="risk-context-evidence"><h3>Evidence</h3>{concern.evidence.length ? <ul>{concern.evidence.map((item) => <li className="engineering-evidence-reference" key={item.id}><span>{item.role === "source" ? "Reported by" : "Supporting evidence"} · {item.kind.replaceAll("-", " ")}</span><button className="risk-context-link" type="button" disabled={!item.available} onClick={() => setEvidenceId(evidenceId === item.id ? null : item.id)}>{item.label}{!item.available ? " · unavailable" : ""}</button></li>)}</ul> : <p>No supporting evidence recorded.</p>}{selectedEvidence ? <div className="engineering-evidence-detail"><strong>{selectedEvidence.label}</strong><p>{selectedEvidence.detail || "No further detail recorded."}</p></div> : null}</section>
    {attachedRecords.length ? <section className="risk-context-evidence"><h3>Other attached records</h3><ul>{attachedRecords.map((record) => <li key={record.key}><button className="risk-context-link" type="button" disabled={!record.available} onClick={() => setLinkedReference(record)}>{record.label}</button></li>)}</ul></section> : null}
    <section className="risk-context-evidence"><h3>Temporary repair / workaround</h3><p>{concern.temporaryRepair || "Not recorded"}</p></section>
    <section className="risk-context-evidence"><h3>Mitigation action</h3>{concern.mitigation ? <><p>{concern.mitigation.title} · <strong>{concern.mitigation.status.replaceAll("-", " ")}</strong></p>{concern.mitigation.status === "complete" && concern.status !== "resolved" ? <p className="engineering-verification-warning">Action complete; concern remains open. Verification is a separate decision.</p> : null}{concern.scenario && concern.mitigation.status !== "complete" ? <button className="secondary-action" type="button" onClick={onTaskComplete}>Mark example action complete</button> : null}</> : <p>No mitigation task recorded. This concern remains in review.</p>}</section>
    <section className="risk-context-evidence"><h3>Verification</h3><p><strong>{concern.verification.status === "not-recorded" ? "Not recorded" : concern.verification.status === "pending" ? "Pending verification" : "Verification recorded"}</strong></p><p>{concern.verification.criteria || "Closure criteria not recorded."}</p>{concern.verification.evidence ? <p>{concern.verification.evidence}</p> : null}{concern.scenario && concern.status !== "resolved" ? <><div className="risk-context-actions"><button className="secondary-action" type="button" onClick={() => setVerificationOpen(true)}>Record example verification</button><button className="secondary-action" type="button" disabled={concern.verification.status !== "verified" || !concern.verification.evidence?.trim()} onClick={onResolve}>Resolve example concern</button></div>{concern.verification.status !== "verified" ? <p>Record verification criteria and evidence before resolving this example.</p> : null}</> : null}</section>
    {concern.scenario ? <button className="secondary-action" type="button" onClick={onEdit}>Edit example concern</button> : null}
    {!concern.scenario && bootstrap.risks.some((risk) => risk.id === concern.id) ? <details className="engineering-relationships"><summary>Recorded relationships</summary><RiskImpactGraph bootstrap={bootstrap} selected={{ kind: "risk", id: concern.id }} onOpenRecord={(kind, id) => setLinkedReference({ kind, id })} /></details> : <details className="engineering-relationships"><summary>Recorded relationships</summary><ul><li>Concern affects {concern.subjects.map((subject) => subject.label).join(", ")}.</li>{concern.mitigation ? <li>Concern mitigated by {concern.mitigation.title}.</li> : null}{concern.milestones.length ? <li>{milestoneText(concern)}.</li> : null}{concern.evidence.map((item) => <li key={item.id}>{item.role === "source" ? "Reported by" : "Supported by"} {item.label}{item.available ? "" : " (unavailable)"}.</li>)}</ul></details>}
    {linkedReference ? <section className="engineering-evidence-detail" aria-live="polite"><strong>{getRiskRecordReference(linkedReference, bootstrap).label}</strong><p>{linkedReference.kind === "task" ? bootstrap.tasks.find((task) => task.id === linkedReference.id)?.summary || "No task description recorded." : getRiskRecordReference(linkedReference, bootstrap).taskIds.map((id) => bootstrap.tasks.find((task) => task.id === id)?.title).filter(Boolean).join(" · ") || "No directly associated work recorded."}</p></section> : null}
    {verificationOpen ? <ModalDialog label="Record example verification" onClose={() => setVerificationOpen(false)} dismissOnBackdrop><section className="modal-card"><h2>Record example verification</h2><form className="modal-form" onSubmit={(event) => { event.preventDefault(); onReplace({ ...concern, verification: { criteria: verificationCriteria.trim(), status: "verified", evidence: verificationEvidence.trim() } }); setVerificationOpen(false); }}><label className="field modal-wide"><span>Verification criteria</span><textarea required minLength={8} value={verificationCriteria} onChange={(event) => setVerificationCriteria(event.target.value)} /></label><label className="field modal-wide"><span>Verification evidence or report reference</span><textarea required minLength={8} value={verificationEvidence} onChange={(event) => setVerificationEvidence(event.target.value)} /></label><p className="risk-chart-note modal-wide">This records scenario evidence. Resolving the concern remains a separate action.</p><div className="modal-actions modal-wide"><button className="secondary-action" type="button" onClick={() => setVerificationOpen(false)}>Cancel</button><button className="primary-action" type="submit">Record verification</button></div></form></section></ModalDialog> : null}
  </section>;
  return inline ? <aside className="risk-review-inspector">{content}</aside> : <ModalDialog label={`Concern: ${concern.title}`} onClose={onClose} dismissOnBackdrop>{content}</ModalDialog>;
}

function ConcernEditor({ concern, subjects, milestones, onClose, onSave }: {
  concern: PrototypeConcern; subjects: PrototypeConcern["subjects"]; milestones: PrototypeConcern["milestones"]; onClose: () => void; onSave: (concern: PrototypeConcern) => void;
}) {
  const [draft, setDraft] = useState(concern);
  const save = (event: FormEvent) => { event.preventDefault(); onSave({ ...draft, title: draft.title.trim(), detail: draft.detail.trim() }); };
  return <ModalDialog label="Example concern editor" onClose={onClose} dismissOnBackdrop><section className="modal-card"><div className="panel-header compact-header"><h2>Edit example concern</h2><button className="secondary-action" type="button" onClick={onClose}>Close</button></div><form className="modal-form" onSubmit={save}>
    <label className="field modal-wide"><span>Concern</span><input required minLength={3} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
    <label className="field modal-wide"><span>Condition and possible consequence</span><textarea required minLength={3} value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} /></label>
    <label className="field"><span>Severity</span><select value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value as PrototypeConcern["severity"] })}>{["critical", "high", "medium", "low"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <label className="field"><span>Owner</span><input value={draft.ownerLabel} onChange={(event) => setDraft({ ...draft, ownerLabel: event.target.value || "Unassigned" })} /></label>
    <div className="field modal-wide"><span>Affected mechanisms / subsystems</span><FilterDropdown allLabel="Affected mechanisms" ariaLabel="Affected mechanisms" showAllOption={false} compactSummary portalMenu options={subjects.filter((subject) => subject.id !== "no-mechanism").map((subject) => ({ id: subject.id, name: subject.label }))} value={draft.subjects.filter((subject) => subject.id !== "no-mechanism").map((subject) => subject.id)} onChange={(ids) => setDraft({ ...draft, subjects: ids.length ? subjects.filter((subject) => ids.includes(subject.id)) : [{ id: "no-mechanism", label: "No mechanism linked", areaLabel: "Project" }] })} /><span className="engineering-selection-list">{draft.subjects.map((subject) => subject.label).join(", ")}</span></div>
    <div className="field modal-wide"><span>Milestones</span><FilterDropdown allLabel="Linked milestones" ariaLabel="Linked milestones" showAllOption={false} compactSummary portalMenu options={milestones.map((milestone) => ({ id: milestone.id, name: milestone.title }))} value={draft.milestones.map((milestone) => milestone.id)} onChange={(ids) => setDraft({ ...draft, milestones: ids.map((id) => draft.milestones.find((milestone) => milestone.id === id) ?? { ...milestones.find((milestone) => milestone.id === id)!, basis: "linked", conditions: [] }) })} /></div>
    {draft.milestones.map((milestone) => <label className="field modal-wide" key={milestone.id}><span>{milestone.title}: commitment</span><select value={milestone.basis} onChange={(event) => setDraft({ ...draft, milestones: draft.milestones.map((item) => item.id === milestone.id ? { ...item, basis: event.target.value as "required" | "linked" } : item) })}><option value="linked">Linked context only</option><option value="required">Require concern clearance before milestone</option></select></label>)}
    <label className="field modal-wide"><span>Temporary repair / workaround</span><textarea value={draft.temporaryRepair ?? ""} onChange={(event) => setDraft({ ...draft, temporaryRepair: event.target.value || null })} /></label>
    <label className="field modal-wide"><span>Verification criteria</span><textarea value={draft.verification.criteria} onChange={(event) => setDraft({ ...draft, verification: { ...draft.verification, criteria: event.target.value, status: "pending", evidence: undefined } })} /></label>
    <label className="field checkbox-field modal-wide"><input type="checkbox" checked={draft.blocksWork} onChange={(event) => setDraft({ ...draft, blocksWork: event.target.checked })} /><span>Explicitly blocks work</span></label>
    <p className="risk-chart-note modal-wide">Illustrative scenario only. Changes stay in this session and never update current records.</p>
    <div className="modal-actions modal-wide"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit">Save example</button></div>
  </form></section></ModalDialog>;
}
