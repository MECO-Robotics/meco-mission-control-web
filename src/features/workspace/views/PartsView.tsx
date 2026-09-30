import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { useMemo, useState } from "react";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { ModalDialog } from "@/components/ModalDialog";
import type { BootstrapPayload } from "@/types/bootstrap";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterPartDefinitions } from "./parts/partsViewData";
import { PartsDefinitionSection } from "./parts/PartsDefinitionSection";
import { PartsToolbar } from "./parts/PartsToolbar";
import type { PartsViewProps } from "./parts/partsViewTypes";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { filterSelectionIncludes, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { ResourceSortMenu } from "@/features/workspace/shared/resourceList/ResourceSortMenu";
import { getResourceFilterOptions } from "@/features/workspace/shared/resourceList/resourceListModel";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { formatIterationVersion } from "@/lib/appUtils/common";
import { PART_DEFINITION_COLUMNS, type PartDefinitionColumnFilters, type PartDefinitionSortField } from "./parts/partsViewTypes";
export { filterPartDefinitions } from "./parts/partsViewData";

export function PartsView({ bootstrap, openCreatePartDefinitionModal, openEditPartDefinitionModal, openEditPartInstanceModal, openCreatePartInstanceModal, mechanismsById, subsystemsById }: PartsViewProps) {
  const [partSearch, setPartSearch] = useRememberedViewState("parts.partSearch", "");
  const [showArchivedPartDefinitions, setShowArchivedPartDefinitions] = useRememberedViewState("parts.showArchivedPartDefinitions", false);
  const [partSubsystem, setPartSubsystem] = useRememberedViewState<string[]>("parts.partSubsystem", []);
  const [partStatus, setPartStatus] = useRememberedViewState<string[]>("parts.partStatus", []);
  const [mapping, setMapping] = useRememberedViewState("parts.mapping", "all");
  const [columnFilters, setColumnFilters] = useState<PartDefinitionColumnFilters>({ name: [], number: [], revision: [], iteration: [], type: [], material: [] });
  const [sortField, setSortField] = useState<PartDefinitionSortField>("name");
  const [sortDirection, setSortDirection] = useState<ResourceSortDirection>("ascending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mechanismId, setMechanismId] = useState("");
  const columnOptions = useMemo(() => {
    const parts = bootstrap.partDefinitions;
    const materialName = (part: BootstrapPayload["partDefinitions"][number]) => bootstrap.materials.find((material) => material.id === part.materialId)?.name ?? "Unassigned";
    return {
      name: getResourceFilterOptions(parts.map((part) => part.name)),
      number: getResourceFilterOptions(parts.map((part) => part.partNumber)),
      revision: getResourceFilterOptions(parts.map((part) => part.revision)),
      iteration: getResourceFilterOptions(parts.map((part) => formatIterationVersion(part.iteration))),
      type: getResourceFilterOptions(parts.map((part) => part.type)),
      material: getResourceFilterOptions(parts.map(materialName)),
    };
  }, [bootstrap.materials, bootstrap.partDefinitions]);
  const filtered = useMemo(() => filterPartDefinitions({ bootstrap, partSearch, partStatus, partSubsystem, showArchivedPartDefinitions })
    .filter((part) => mapping === "all" || bootstrap.partInstances.some((instance) => instance.partDefinitionId === part.id) === (mapping === "mapped"))
    .filter((part) => {
      const material = bootstrap.materials.find((item) => item.id === part.materialId)?.name ?? "Unassigned";
      return filterSelectionIncludes(columnFilters.name, part.name) &&
        filterSelectionIncludes(columnFilters.number, part.partNumber) &&
        filterSelectionIncludes(columnFilters.revision, part.revision) &&
        filterSelectionIncludes(columnFilters.iteration, formatIterationVersion(part.iteration)) &&
        filterSelectionIncludes(columnFilters.type, part.type) &&
        filterSelectionIncludes(columnFilters.material, material);
    }), [bootstrap, columnFilters, mapping, partSearch, partStatus, partSubsystem, showArchivedPartDefinitions]);
  const sorted = useMemo(() => {
    const value = (part: BootstrapPayload["partDefinitions"][number]) => {
      if (sortField === "iteration") return part.iteration;
      if (sortField === "material") return bootstrap.materials.find((material) => material.id === part.materialId)?.name ?? "Unassigned";
      return sortField === "name" ? part.name : sortField === "number" ? part.partNumber : sortField === "revision" ? part.revision : part.type;
    };
    const multiplier = sortDirection === "ascending" ? 1 : -1;
    return [...filtered].sort((left, right) => {
      const a = value(left); const b = value(right);
      return multiplier * (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }));
    });
  }, [bootstrap.materials, filtered, sortDirection, sortField]);
  const pagination = useWorkspacePagination(sorted);
  const selected = bootstrap.partDefinitions.find(part => part.id === selectedId);
  const instances = bootstrap.partInstances.filter(instance => instance.partDefinitionId === selectedId);
  const hasFilters = Boolean(partSearch || partStatus.length || partSubsystem.length || mapping !== "all" || Object.values(columnFilters).some((value) => value.length > 0));
  const setColumnFilter = (field: PartDefinitionSortField, value: FilterSelection) => setColumnFilters((current) => ({ ...current, [field]: value }));
  const handleSort = (field: PartDefinitionSortField) => {
    if (field === sortField) setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
    else { setSortField(field); setSortDirection("ascending"); }
  };
  return <section className={`panel dense-panel part-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
    <AppTopbarSlotPortal slot="controls"><div className="panel-actions filter-toolbar">
      <PartsToolbar bootstrap={bootstrap} mapping={mapping} partSearch={partSearch} partStatus={partStatus} partSubsystem={partSubsystem} setPartSearch={setPartSearch} setMapping={setMapping} setPartStatus={setPartStatus} setPartSubsystem={setPartSubsystem} setShowArchivedPartDefinitions={setShowArchivedPartDefinitions} showArchivedPartDefinitions={showArchivedPartDefinitions} activeColumnFilterCount={Object.values(columnFilters).filter((value) => value.length > 0).length} columnFilters={columnFilters} columnOptions={columnOptions} setColumnFilter={setColumnFilter} sortMenu={<ResourceSortMenu direction={sortDirection} field={sortField} label="parts" onDirectionChange={setSortDirection} onFieldChange={(field) => setSortField(field as PartDefinitionSortField)} options={PART_DEFINITION_COLUMNS.map(({ field, label }) => ({ label, value: field }))} />} />
      <WorkspaceTopbarAddMenu
        actions={buildSingleAddMenuAction({ label: "Add part", onSelect: openCreatePartDefinitionModal })}
        ariaLabel="Add part"
        title="Add part"
        tutorialTarget="create-part-button"
      />
    </div></AppTopbarSlotPortal>
    <PartsDefinitionSection bootstrap={bootstrap} filteredPartDefinitions={pagination.pageItems} hasActiveFilters={hasFilters} hasHiddenArchivedPartDefinitions={!showArchivedPartDefinitions && !hasFilters && bootstrap.partDefinitions.length > 0 && filtered.length === 0} onCreatePartDefinition={openCreatePartDefinitionModal} onEditPartDefinition={part => setSelectedId(part.id)} partDefinitionFilterMotionClass="" pageChangeHandlers={{ onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize, page: pagination.page, pageSize: pagination.pageSize, pageSizeOptions: pagination.pageSizeOptions, rangeEnd: pagination.rangeEnd, rangeStart: pagination.rangeStart, totalItems: pagination.totalItems, totalPages: pagination.totalPages }} columnFilters={columnFilters} columnOptions={columnOptions} setColumnFilter={setColumnFilter} sortField={sortField} sortDirection={sortDirection} onSort={(field) => handleSort(field as PartDefinitionSortField)} />
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
