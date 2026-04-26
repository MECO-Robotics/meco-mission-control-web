import { useMemo, useState, type CSSProperties } from "react";

import { IconManufacturing, IconTasks } from "@/components/shared";
import type { BootstrapPayload, PartDefinitionRecord } from "@/types";
import {
  ColumnFilterDropdown,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { PART_STATUS_OPTIONS } from "@/features/workspace/shared";

interface PartsViewProps {
  bootstrap: BootstrapPayload;
  openCreatePartDefinitionModal: () => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function PartsView({
  bootstrap,
  openCreatePartDefinitionModal,
  openEditPartDefinitionModal,
  mechanismsById,
  partDefinitionsById,
  subsystemsById,
}: PartsViewProps) {
  const [partSearch, setPartSearch] = useState("");
  const [partSubsystem, setPartSubsystem] = useState<FilterSelection>([]);
  const [partStatus, setPartStatus] = useState<FilterSelection>([]);

  const filteredPartDefinitions = useMemo(() => {
    const search = partSearch.toLowerCase();
    return bootstrap.partDefinitions.filter((partDefinition) => {
      const materialName = partDefinition.materialId
        ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name ?? ""
        : "";

      return (
        !search ||
        partDefinition.name.toLowerCase().includes(search) ||
        partDefinition.partNumber.toLowerCase().includes(search) ||
        `iteration ${partDefinition.iteration}`.includes(search) ||
        partDefinition.type.toLowerCase().includes(search) ||
        partDefinition.source.toLowerCase().includes(search) ||
        materialName.toLowerCase().includes(search)
      );
    });
  }, [bootstrap.materials, bootstrap.partDefinitions, partSearch]);

  const filteredPartInstances = useMemo(() => {
    const search = partSearch.toLowerCase();
    return bootstrap.partInstances.filter((partInstance) => {
      const definition = partDefinitionsById[partInstance.partDefinitionId];
      const mechanismName = partInstance.mechanismId
        ? mechanismsById[partInstance.mechanismId]?.name ?? ""
        : "";
      const matchesSearch =
        !search ||
        partInstance.name.toLowerCase().includes(search) ||
        definition?.name.toLowerCase().includes(search) ||
        definition?.partNumber.toLowerCase().includes(search) ||
        mechanismName.toLowerCase().includes(search);
      const matchesSubsystem = filterSelectionIncludes(partSubsystem, partInstance.subsystemId);
      const matchesStatus = filterSelectionIncludes(partStatus, partInstance.status);
      return matchesSearch && matchesSubsystem && matchesStatus;
    });
  }, [bootstrap.partInstances, mechanismsById, partDefinitionsById, partSearch, partStatus, partSubsystem]);
  const partDefinitionPagination = useWorkspacePagination(filteredPartDefinitions);
  const partInstancePagination = useWorkspacePagination(filteredPartInstances);

  return (
    <section className={`panel dense-panel part-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Part manager</h2>
          <p className="section-copy">
            Reusable part definitions and subsystem-specific part instances for traceability.
          </p>
        </div>
        <div className="panel-actions filter-toolbar part-manager-toolbar">
          <SearchToolbarInput
            ariaLabel="Search parts"
            onChange={setPartSearch}
            placeholder="Search parts..."
            value={partSearch}
          />

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter parts by subsystem"
            className="mobile-filter-control"
            icon={<IconManufacturing />}
            onChange={setPartSubsystem}
            options={bootstrap.subsystems}
            value={partSubsystem}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter parts by status"
            className="mobile-filter-control"
            icon={<IconTasks />}
            onChange={setPartStatus}
            options={PART_STATUS_OPTIONS}
            value={partStatus}
          />

          <button
            aria-label="Add part definition"
            className="primary-action queue-toolbar-action part-manager-toolbar-action"
            onClick={openCreatePartDefinitionModal}
            title="Add part definition"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="panel-subsection">
        <div className="table-shell">
          <div
            className="ops-table ops-table-header"
            style={{ "--workspace-grid-template": "minmax(180px, 2fr) 1fr 0.6fr 0.7fr 0.8fr 1fr" } as CSSProperties}
          >
            <span>Part</span>
            <span>Number</span>
            <span>Rev</span>
            <span>Iter</span>
            <span>Type</span>
            <span>Material</span>
          </div>
          {partDefinitionPagination.pageItems.map((partDefinition) => (
            <div
              className="ops-table ops-row editable-row-clickable editable-hover-target editable-hover-target-row"
              key={partDefinition.id}
              onClick={() => openEditPartDefinitionModal(partDefinition)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openEditPartDefinitionModal(partDefinition);
                }
              }}
              role="button"
              tabIndex={0}
              style={{ "--workspace-grid-template": "minmax(180px, 2fr) 1fr 0.6fr 0.7fr 0.8fr 1fr" } as CSSProperties}
              title={`Edit ${partDefinition.name}`}
            >
              <TableCell label="Part">
                <strong>{partDefinition.name}</strong>
                {partDefinition.description ? <small>{partDefinition.description}</small> : null}
              </TableCell>
              <TableCell label="Number">{partDefinition.partNumber}</TableCell>
              <TableCell label="Rev">{partDefinition.revision}</TableCell>
              <TableCell label="Iteration">Iteration {partDefinition.iteration}</TableCell>
              <TableCell label="Type">{partDefinition.type}</TableCell>
              <TableCell label="Material">
                {(partDefinition.materialId
                  ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name
                  : null) ?? "Unassigned"}
              </TableCell>
              <EditableHoverIndicator />
            </div>
          ))}
          {filteredPartDefinitions.length === 0 ? (
            <p className="empty-state">No part definitions match the current search.</p>
          ) : null}
          <PaginationControls
            label="part definitions"
            onPageChange={partDefinitionPagination.setPage}
            onPageSizeChange={partDefinitionPagination.setPageSize}
            page={partDefinitionPagination.page}
            pageSize={partDefinitionPagination.pageSize}
            pageSizeOptions={partDefinitionPagination.pageSizeOptions}
            rangeEnd={partDefinitionPagination.rangeEnd}
            rangeStart={partDefinitionPagination.rangeStart}
            totalItems={partDefinitionPagination.totalItems}
            totalPages={partDefinitionPagination.totalPages}
          />
        </div>
      </div>

      <div className="panel-subsection">
        <div className="roster-section-header">
          <h3>Part instances</h3>
        </div>
        <div className="table-shell">
          <div
            className="ops-table ops-table-header"
            style={{ "--workspace-grid-template": "minmax(180px, 2fr) 1fr 1fr 1fr 0.5fr 0.8fr" } as CSSProperties}
          >
            <span>Instance</span>
            <span>Definition</span>
            <span>Mechanism</span>
            <span className="table-column-header-cell">
              <span className="table-column-title">Subsystem</span>
              <ColumnFilterDropdown
                allLabel="All subsystems"
                ariaLabel="Filter parts by subsystem"
                onChange={setPartSubsystem}
                options={bootstrap.subsystems}
                value={partSubsystem}
              />
            </span>
            <span>Qty</span>
            <span className="table-column-header-cell">
              <span className="table-column-title">Status</span>
              <ColumnFilterDropdown
                allLabel="All statuses"
                ariaLabel="Filter parts by status"
                onChange={setPartStatus}
                options={PART_STATUS_OPTIONS}
                value={partStatus}
              />
            </span>
          </div>
          {partInstancePagination.pageItems.map((partInstance) => (
            <div
              className="ops-table ops-row"
              key={partInstance.id}
              style={{ "--workspace-grid-template": "minmax(180px, 2fr) 1fr 1fr 1fr 0.5fr 0.8fr" } as CSSProperties}
            >
              <TableCell label="Instance">
                <strong>{partInstance.name}</strong>
                <small>{partInstance.trackIndividually ? "Individual tracking" : "Bulk quantity"}</small>
              </TableCell>
              <TableCell label="Definition">
                {partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part"}
              </TableCell>
              <TableCell label="Mechanism">
                {partInstance.mechanismId
                  ? mechanismsById[partInstance.mechanismId]?.name ?? "Unknown"
                  : "Unassigned"}
              </TableCell>
              <TableCell label="Subsystem">
                {(partInstance.subsystemId ? subsystemsById[partInstance.subsystemId]?.name : null) ?? "Unknown"}
              </TableCell>
              <TableCell label="Qty">{partInstance.quantity}</TableCell>
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(partInstance.status)}>{partInstance.status}</span>
              </TableCell>
            </div>
          ))}
          {filteredPartInstances.length === 0 ? (
            <p className="empty-state">No part instances match the current filters.</p>
          ) : null}
          <PaginationControls
            label="part instances"
            onPageChange={partInstancePagination.setPage}
            onPageSizeChange={partInstancePagination.setPageSize}
            page={partInstancePagination.page}
            pageSize={partInstancePagination.pageSize}
            pageSizeOptions={partInstancePagination.pageSizeOptions}
            rangeEnd={partInstancePagination.rangeEnd}
            rangeStart={partInstancePagination.rangeStart}
            totalItems={partInstancePagination.totalItems}
            totalPages={partInstancePagination.totalPages}
          />
        </div>
      </div>
    </section>
  );
}




