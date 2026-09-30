import type { CSSProperties } from "react";

import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import { EditableHoverIndicator, PaginationControls, TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { formatIterationVersion } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionRecord } from "@/types/recordsInventory";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { ResourceColumnHeader, type ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import type { PartDefinitionColumnFilters, PartDefinitionSortField } from "./partsViewTypes";

import { PART_DEFINITION_GRID_TEMPLATE } from "./partsViewTypes";

interface PartsDefinitionSectionProps {
  bootstrap: BootstrapPayload;
  filteredPartDefinitions: BootstrapPayload["partDefinitions"];
  hasActiveFilters: boolean;
  hasHiddenArchivedPartDefinitions: boolean;
  onCreatePartDefinition: () => void;
  onEditPartDefinition: (partDefinition: PartDefinitionRecord) => void;
  partDefinitionFilterMotionClass: string;
  pageChangeHandlers: {
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    page: number;
    pageSize: number;
    pageSizeOptions: readonly number[];
    rangeEnd: number;
    rangeStart: number;
    totalItems: number;
    totalPages: number;
  };
  columnFilters: PartDefinitionColumnFilters;
  columnOptions: Record<PartDefinitionSortField, Array<{ id: string; name: string }>>;
  setColumnFilter: (field: PartDefinitionSortField, value: string[]) => void;
  sortField: PartDefinitionSortField | null;
  sortDirection: ResourceSortDirection;
  onSort: (field: PartDefinitionSortField) => void;
}

export function PartsDefinitionSection({
  bootstrap,
  filteredPartDefinitions,
  hasActiveFilters,
  hasHiddenArchivedPartDefinitions,
  onCreatePartDefinition,
  onEditPartDefinition,
  partDefinitionFilterMotionClass,
  pageChangeHandlers,
  columnFilters,
  columnOptions,
  setColumnFilter,
  sortField,
  sortDirection,
  onSort,
}: PartsDefinitionSectionProps) {
  return (
    <div className="panel-subsection">
      <div className={`table-shell ${partDefinitionFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header materials-table"
          style={{ "--workspace-grid-template": PART_DEFINITION_GRID_TEMPLATE } as CSSProperties}
        >
          <ResourceColumnHeader field="name" label="Part" onSort={(field) => onSort(field as PartDefinitionSortField)} sortDirection={sortDirection} sortField={sortField}><ColumnFilterDropdown allLabel="All parts" ariaLabel="Filter parts by name" onChange={(value) => setColumnFilter("name", value)} options={columnOptions.name} value={columnFilters.name} /></ResourceColumnHeader>
          <ResourceColumnHeader field="number" label="Number" onSort={(field) => onSort(field as PartDefinitionSortField)} sortDirection={sortDirection} sortField={sortField}><ColumnFilterDropdown allLabel="All numbers" ariaLabel="Filter parts by number" onChange={(value) => setColumnFilter("number", value)} options={columnOptions.number} value={columnFilters.number} /></ResourceColumnHeader>
          <ResourceColumnHeader field="revision" label="Rev" onSort={(field) => onSort(field as PartDefinitionSortField)} sortDirection={sortDirection} sortField={sortField}><ColumnFilterDropdown allLabel="All revisions" ariaLabel="Filter parts by revision" onChange={(value) => setColumnFilter("revision", value)} options={columnOptions.revision} value={columnFilters.revision} /></ResourceColumnHeader>
          <ResourceColumnHeader field="iteration" label="Iter" onSort={(field) => onSort(field as PartDefinitionSortField)} sortDirection={sortDirection} sortField={sortField}><ColumnFilterDropdown allLabel="All iterations" ariaLabel="Filter parts by iteration" onChange={(value) => setColumnFilter("iteration", value)} options={columnOptions.iteration} value={columnFilters.iteration} /></ResourceColumnHeader>
          <ResourceColumnHeader field="type" label="Type" onSort={(field) => onSort(field as PartDefinitionSortField)} sortDirection={sortDirection} sortField={sortField}><ColumnFilterDropdown allLabel="All types" ariaLabel="Filter parts by type" onChange={(value) => setColumnFilter("type", value)} options={columnOptions.type} value={columnFilters.type} /></ResourceColumnHeader>
          <ResourceColumnHeader field="material" label="Material" onSort={(field) => onSort(field as PartDefinitionSortField)} sortDirection={sortDirection} sortField={sortField}><ColumnFilterDropdown allLabel="All materials" ariaLabel="Filter parts by material" onChange={(value) => setColumnFilter("material", value)} options={columnOptions.material} value={columnFilters.material} /></ResourceColumnHeader>
        </div>
        {filteredPartDefinitions.map((partDefinition) => {
          const materialName =
            (partDefinition.materialId
              ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name
              : null) ?? "Unassigned";
          const partSubtitle =
            partDefinition.description.trim().length > 0
              ? partDefinition.description
              : `Source: ${partDefinition.source} | Material: ${materialName}`;

          return (
            <button
              className="ops-table ops-row materials-table editable-hover-target editable-hover-target-row"
              key={partDefinition.id}
              onClick={() => onEditPartDefinition(partDefinition)}
              style={{ "--workspace-grid-template": PART_DEFINITION_GRID_TEMPLATE } as CSSProperties}
              title={`Open ${partDefinition.name}`}
              type="button"
            >
              <ResourceRecordCell archived={partDefinition.isArchived} label="Part" photoUrl={partDefinition.photoUrl} name={partDefinition.name} subtitle={partSubtitle} />
              <TableCell label="Number" valueClassName="font-mono">{partDefinition.partNumber}</TableCell>
              <TableCell label="Rev" valueClassName="font-mono">{partDefinition.revision}</TableCell>
              <TableCell label="Iteration">
                {formatIterationVersion(partDefinition.iteration)}
              </TableCell>
              <TableCell label="Type">{partDefinition.type}</TableCell>
              <TableCell label="Material">{materialName}</TableCell>
              <EditableHoverIndicator />
            </button>
          );
        })}
        {filteredPartDefinitions.length === 0 ? (
          <WorkspaceEmptyState
            actionLabel={
              hasActiveFilters || hasHiddenArchivedPartDefinitions ? undefined : "Add part definition"
            }
            onAction={
              hasActiveFilters || hasHiddenArchivedPartDefinitions
                ? undefined
                : onCreatePartDefinition
            }
            reason={
              hasHiddenArchivedPartDefinitions
                ? "Archived part definitions are hidden. Turn on Show archived to review existing definitions."
                : hasActiveFilters
                  ? "The current search, subsystem, or status filters hide every reusable part definition."
                  : "No reusable parts have been defined for fabrication, purchasing, or subsystem traceability yet."
            }
            title={
              hasHiddenArchivedPartDefinitions
                ? "Archived part definitions are hidden"
                : hasActiveFilters
                  ? "No part definitions match these filters"
                  : "Catalog reusable part definitions here"
            }
          />
        ) : null}
        <PaginationControls {...pageChangeHandlers} label="part definitions" />
      </div>
    </div>
  );
}
