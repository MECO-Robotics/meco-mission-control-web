import { useMemo, useState, type CSSProperties } from "react";

import { IconManufacturing, IconTasks } from "@/components/shared";
import type { BootstrapPayload, PartDefinitionRecord } from "@/types";
import {
  ColumnFilterDropdown,
  CompactFilterMenu,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  useFilterChangeMotionClass,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { PART_STATUS_OPTIONS } from "@/features/workspace/shared";
import { formatIterationVersion } from "@/lib/appUtils";

interface PartsViewProps {
  bootstrap: BootstrapPayload;
  openCreatePartDefinitionModal: () => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

const PART_DEFINITION_GRID_TEMPLATE = "minmax(220px, 2.3fr) 1fr 0.6fr 0.7fr 0.8fr 1fr";
const PART_INSTANCE_GRID_TEMPLATE = "minmax(220px, 2.3fr) 1fr 1fr 1fr 0.5fr 0.8fr";

export function filterPartDefinitions({
  bootstrap,
  partSearch,
  partStatus,
  partSubsystem,
  showArchivedPartDefinitions = false,
}: {
  bootstrap: BootstrapPayload;
  partSearch: string;
  partStatus: FilterSelection;
  partSubsystem: FilterSelection;
  showArchivedPartDefinitions?: boolean;
}) {
  const search = partSearch.trim().toLowerCase();
  const hasInstanceFilters = partSubsystem.length > 0 || partStatus.length > 0;

  return bootstrap.partDefinitions.filter((partDefinition) => {
    if (!showArchivedPartDefinitions && partDefinition.isArchived) {
      return false;
    }

    const materialName = partDefinition.materialId
      ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name ?? ""
      : "";
    const matchesSearch =
      !search ||
      partDefinition.name.toLowerCase().includes(search) ||
      partDefinition.partNumber.toLowerCase().includes(search) ||
      `iteration ${partDefinition.iteration}`.includes(search) ||
      formatIterationVersion(partDefinition.iteration).toLowerCase().includes(search) ||
      partDefinition.type.toLowerCase().includes(search) ||
      partDefinition.source.toLowerCase().includes(search) ||
      materialName.toLowerCase().includes(search);

    if (!matchesSearch) {
      return false;
    }

    if (!hasInstanceFilters) {
      return true;
    }

    return bootstrap.partInstances.some(
      (partInstance) =>
        partInstance.partDefinitionId === partDefinition.id &&
        filterSelectionIncludes(partSubsystem, partInstance.subsystemId) &&
        filterSelectionIncludes(partStatus, partInstance.status),
    );
  });
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
  const [showArchivedPartDefinitions, setShowArchivedPartDefinitions] = useState(false);
  const [partSubsystem, setPartSubsystem] = useState<FilterSelection>([]);
  const [partMechanism, setPartMechanism] = useState<FilterSelection>([]);
  const [partStatus, setPartStatus] = useState<FilterSelection>([]);

  const filteredPartDefinitions = useMemo(
    () =>
      filterPartDefinitions({
        bootstrap,
        partSearch,
        partStatus,
        partSubsystem,
        showArchivedPartDefinitions,
      }),
    [
      bootstrap,
      partSearch,
      partStatus,
      partSubsystem,
      showArchivedPartDefinitions,
    ],
  );

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
      const matchesMechanism = filterSelectionIncludes(partMechanism, partInstance.mechanismId);
      const matchesStatus = filterSelectionIncludes(partStatus, partInstance.status);
      return matchesSearch && matchesSubsystem && matchesMechanism && matchesStatus;
    });
  }, [
    bootstrap.partInstances,
    mechanismsById,
    partDefinitionsById,
    partMechanism,
    partSearch,
    partStatus,
    partSubsystem,
  ]);
  const partDefinitionPagination = useWorkspacePagination(filteredPartDefinitions);
  const partInstancePagination = useWorkspacePagination(filteredPartInstances);
  const partDefinitionFilterMotionClass = useFilterChangeMotionClass([
    partSearch,
    partStatus,
    partSubsystem,
    showArchivedPartDefinitions,
  ]);
  const partInstanceFilterMotionClass = useFilterChangeMotionClass([
    partMechanism,
    partSearch,
    partStatus,
    partSubsystem,
  ]);

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
          <div data-tutorial-target="parts-search-input">
            <SearchToolbarInput
              ariaLabel="Search parts"
              onChange={setPartSearch}
              placeholder="Search parts..."
              value={partSearch}
            />
          </div>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              color: "var(--text-copy)",
              fontSize: "0.85rem",
            }}
          >
            <input
              checked={showArchivedPartDefinitions}
              onChange={(event) => setShowArchivedPartDefinitions(event.target.checked)}
              type="checkbox"
            />
            Show archived definitions
          </label>

          <CompactFilterMenu
            activeCount={[partSubsystem, partStatus].filter((value) => value.length > 0).length}
            ariaLabel="Part filters"
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Subsystem",
                content: (
                  <FilterDropdown
                    allLabel="All subsystems"
                    ariaLabel="Filter parts by subsystem"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconManufacturing />}
                    onChange={setPartSubsystem}
                    options={bootstrap.subsystems}
                    value={partSubsystem}
                  />
                ),
              },
              {
                label: "Status",
                content: (
                  <FilterDropdown
                    allLabel="All statuses"
                    ariaLabel="Filter parts by status"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconTasks />}
                    onChange={setPartStatus}
                    options={PART_STATUS_OPTIONS}
                    value={partStatus}
                  />
                ),
              },
            ]}
          />

          <button
            aria-label="Add part definition"
            className="primary-action queue-toolbar-action part-manager-toolbar-action"
            data-tutorial-target="create-part-button"
            onClick={openCreatePartDefinitionModal}
            title="Add part definition"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="panel-subsection">
        <div className={`table-shell ${partDefinitionFilterMotionClass}`}>
          <div
            className="ops-table ops-table-header"
            style={{ "--workspace-grid-template": PART_DEFINITION_GRID_TEMPLATE } as CSSProperties}
          >
            <span>Part</span>
            <span>Number</span>
            <span>Rev</span>
            <span>Iter</span>
            <span>Type</span>
            <span>Material</span>
          </div>
          {partDefinitionPagination.pageItems.map((partDefinition) => {
            const materialName =
              (partDefinition.materialId
                ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name
                : null) ?? "Unassigned";
            const partSubtitle =
              partDefinition.description.trim().length > 0
                ? partDefinition.description
                : `Source: ${partDefinition.source} | Material: ${materialName}`;

            return (
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
                style={{ "--workspace-grid-template": PART_DEFINITION_GRID_TEMPLATE } as CSSProperties}
                title={`Edit ${partDefinition.name}`}
              >
                <span className="queue-title table-cell table-cell-primary part-primary-cell" data-label="Part">
                  <span className="requested-item-meta">
                    <span className="requested-item-title">{partDefinition.name}</span>
                    {partDefinition.isArchived ? (
                      <small className="requested-item-subtitle">Archived</small>
                    ) : null}
                    <small className="requested-item-subtitle" title={partSubtitle}>
                      {partSubtitle}
                    </small>
                  </span>
                </span>
                <TableCell label="Number">{partDefinition.partNumber}</TableCell>
                <TableCell label="Rev">{partDefinition.revision}</TableCell>
                <TableCell label="Iteration">
                  {formatIterationVersion(partDefinition.iteration)}
                </TableCell>
                <TableCell label="Type">{partDefinition.type}</TableCell>
                <TableCell label="Material">{materialName}</TableCell>
                <EditableHoverIndicator />
              </div>
            );
          })}
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
        <div className={`table-shell ${partInstanceFilterMotionClass}`}>
          <div
            className="ops-table ops-table-header"
            style={{ "--workspace-grid-template": PART_INSTANCE_GRID_TEMPLATE } as CSSProperties}
          >
            <span>Instance</span>
            <span>Definition</span>
            <span className="table-column-header-cell">
              <span className="table-column-title">Mechanism</span>
              <ColumnFilterDropdown
                allLabel="All mechanisms"
                ariaLabel="Filter parts by mechanism"
                onChange={setPartMechanism}
                options={bootstrap.mechanisms}
                value={partMechanism}
              />
            </span>
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
          {partInstancePagination.pageItems.map((partInstance) => {
            const trackingSubtitle = partInstance.trackIndividually ? "Individual tracking" : "Bulk quantity";
            const mechanismName = partInstance.mechanismId
              ? mechanismsById[partInstance.mechanismId]?.name ?? "Unknown"
              : "Unassigned";
            const subsystemName =
              (partInstance.subsystemId ? subsystemsById[partInstance.subsystemId]?.name : null) ?? "Unknown";

            return (
              <div
                className="ops-table ops-row"
                key={partInstance.id}
                style={{ "--workspace-grid-template": PART_INSTANCE_GRID_TEMPLATE } as CSSProperties}
              >
                <span className="queue-title table-cell table-cell-primary part-instance-primary-cell" data-label="Instance">
                  <span className="requested-item-meta">
                    <span className="requested-item-title">{partInstance.name}</span>
                    <small className="requested-item-subtitle">{trackingSubtitle}</small>
                  </span>
                </span>
                <TableCell label="Definition">
                  {partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part"}
                </TableCell>
                <TableCell label="Mechanism">
                  <span className="part-instance-dropdown-chip" title={mechanismName}>
                    <span>{mechanismName}</span>
                  </span>
                </TableCell>
                <TableCell label="Subsystem">
                  <span className="part-instance-dropdown-chip" title={subsystemName}>
                    <span>{subsystemName}</span>
                  </span>
                </TableCell>
                <TableCell label="Qty">{partInstance.quantity}</TableCell>
                <TableCell label="Status" valueClassName="table-cell-pill">
                  <span className={getStatusPillClassName(partInstance.status)}>{partInstance.status}</span>
                </TableCell>
              </div>
            );
          })}
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
