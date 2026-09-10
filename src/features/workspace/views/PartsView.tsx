import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { useMemo, useState } from "react";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { ModalDialog } from "@/components/ModalDialog";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterPartDefinitions } from "./parts/partsViewData";
import { PartsDefinitionSection } from "./parts/PartsDefinitionSection";
import { PartsToolbar } from "./parts/PartsToolbar";
import type { PartsViewProps } from "./parts/partsViewTypes";
export { filterPartDefinitions } from "./parts/partsViewData";

export function PartsView({ bootstrap, openCreatePartDefinitionModal, openEditPartDefinitionModal, openEditPartInstanceModal, openCreatePartInstanceModal, mechanismsById, subsystemsById }: PartsViewProps) {
  const [partSearch, setPartSearch] = useRememberedViewState("parts.partSearch", "");
  const [showArchivedPartDefinitions, setShowArchivedPartDefinitions] = useRememberedViewState("parts.showArchivedPartDefinitions", false);
  const [partSubsystem, setPartSubsystem] = useRememberedViewState<string[]>("parts.partSubsystem", []);
  const [partStatus, setPartStatus] = useRememberedViewState<string[]>("parts.partStatus", []);
  const [mapping, setMapping] = useRememberedViewState("parts.mapping", "all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mechanismId, setMechanismId] = useState("");
  const filtered = useMemo(() => filterPartDefinitions({ bootstrap, partSearch, partStatus, partSubsystem, showArchivedPartDefinitions }).filter(part => mapping === "all" || bootstrap.partInstances.some(instance => instance.partDefinitionId === part.id) === (mapping === "mapped")), [bootstrap, partSearch, partStatus, partSubsystem, showArchivedPartDefinitions, mapping]);
  const pagination = useWorkspacePagination(filtered);
  const selected = bootstrap.partDefinitions.find(part => part.id === selectedId);
  const instances = bootstrap.partInstances.filter(instance => instance.partDefinitionId === selectedId);
  const hasFilters = Boolean(partSearch || partStatus.length || partSubsystem.length || mapping !== "all");
  return <section className={`panel dense-panel part-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
    <AppTopbarSlotPortal slot="controls"><div className="panel-actions filter-toolbar">
      <PartsToolbar bootstrap={bootstrap} partSearch={partSearch} partStatus={partStatus} partSubsystem={partSubsystem} setPartSearch={setPartSearch} setPartStatus={setPartStatus} setPartSubsystem={setPartSubsystem} setShowArchivedPartDefinitions={setShowArchivedPartDefinitions} showArchivedPartDefinitions={showArchivedPartDefinitions} />
      <button className="primary-action" onClick={openCreatePartDefinitionModal} data-tutorial-target="create-part-button" type="button">Add part</button>
    </div></AppTopbarSlotPortal>
    <div className="workspace-presentation-controls"><label>Allocation <select aria-label="Part allocation" value={mapping} onChange={event => setMapping(event.target.value)}><option value="all">All parts</option><option value="mapped">Mapped</option><option value="unmapped">Needs mapping</option></select></label><span>{filtered.length} definitions</span></div>
    <PartsDefinitionSection bootstrap={bootstrap} filteredPartDefinitions={pagination.pageItems} hasActiveFilters={hasFilters} hasHiddenArchivedPartDefinitions={!showArchivedPartDefinitions && !hasFilters && bootstrap.partDefinitions.length > 0 && filtered.length === 0} onCreatePartDefinition={openCreatePartDefinitionModal} onEditPartDefinition={part => setSelectedId(part.id)} partDefinitionFilterMotionClass="" pageChangeHandlers={{ onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize, page: pagination.page, pageSize: pagination.pageSize, pageSizeOptions: pagination.pageSizeOptions, rangeEnd: pagination.rangeEnd, rangeStart: pagination.rangeStart, totalItems: pagination.totalItems, totalPages: pagination.totalPages }} />
    {selected ? <ModalDialog label={selected.name} onClose={() => setSelectedId(null)} className="modal-scrim workspace-detail-dialog"><section className="modal-card workspace-detail-card">
      <div className="workspace-section-heading"><h2>{selected.name}</h2><button className="ghost-button" onClick={() => setSelectedId(null)} type="button">Close</button></div>
      <p>{selected.partNumber} · Revision {selected.revision} · {selected.type}</p><p>{selected.description}</p>
      <button className="ghost-button" onClick={() => { setSelectedId(null); openEditPartDefinitionModal(selected); }} type="button">Edit definition</button>
      <h3>Installed instances</h3>
      {instances.length ? <ul className="workspace-record-list">{instances.map(instance => <li key={instance.id}><div><strong>{instance.name}</strong><small>{subsystemsById[instance.subsystemId]?.name} · {instance.mechanismId ? mechanismsById[instance.mechanismId]?.name : "No mechanism"} · {instance.quantity} · {instance.status}</small></div><button className="ghost-button" type="button" onClick={() => { setSelectedId(null); openEditPartInstanceModal?.(instance); }}>Edit instance</button></li>)}</ul> : <p>No instances yet. Choose a mechanism to allocate this definition.</p>}
      {openCreatePartInstanceModal ? <div className="workspace-presentation-controls"><label>Mechanism <select aria-label="Allocate to mechanism" value={mechanismId} onChange={event => setMechanismId(event.target.value)}><option value="">Choose mechanism</option>{bootstrap.mechanisms.map(mechanism => <option key={mechanism.id} value={mechanism.id}>{subsystemsById[mechanism.subsystemId]?.name} / {mechanism.name}</option>)}</select></label><button className="primary-action" disabled={!mechanismsById[mechanismId]} type="button" onClick={() => { const mechanism = mechanismsById[mechanismId]; if (mechanism) { setSelectedId(null); openCreatePartInstanceModal(mechanism, selected.id); } }}>Add instance</button></div> : null}
    </section></ModalDialog> : null}
  </section>;
}
