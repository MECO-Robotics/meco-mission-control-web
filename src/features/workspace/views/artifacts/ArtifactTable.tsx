import type { CSSProperties } from "react";

import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import {
  EditableHoverIndicator,
  PaginationControls,
  TableCell,
  type useWorkspacePagination,
} from "@/features/workspace/shared/table/workspaceTableChrome";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import type { ArtifactRecord } from "@/types/recordsInventory";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { ResourceColumnHeader, type ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import "./ArtifactTable.css";
import type { ArtifactSortField } from "./artifactInventoryModel";

import {
  ARTIFACT_GRID_TEMPLATE,
  ARTIFACT_STATUS_DISPLAY,
  formatUpdatedAt,
  summarizeUri,
} from "./artifactInventoryModel";

type ArtifactPagination = ReturnType<typeof useWorkspacePagination<ArtifactRecord>>;

interface ArtifactTableProps {
  artifactNoun: string;
  filteredArtifacts: ArtifactRecord[];
  filterMotionClass: string;
  hasArtifactFilters: boolean;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  pagination: ArtifactPagination;
  sectionTitle: string;
  setStatusFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  sortField: ArtifactSortField | null;
  sortDirection: ResourceSortDirection;
  onSort: (field: ArtifactSortField) => void;
  columnOptions: Record<ArtifactSortField, Array<{ id: string; name: string }>>;
  columnFilters: Record<ArtifactSortField, FilterSelection>;
  setColumnFilter: (field: ArtifactSortField, value: FilterSelection) => void;
}

export function ArtifactTable({
  artifactNoun,
  filteredArtifacts,
  filterMotionClass,
  hasArtifactFilters,
  openEditArtifactModal,
  pagination,
  sectionTitle,
  setStatusFilter,
  statusFilter,
  sortField,
  sortDirection,
  onSort,
  columnOptions,
  columnFilters,
  setColumnFilter,
}: ArtifactTableProps) {
  return (
    <div className={`table-shell ${filterMotionClass}`}>
      <div
        className="ops-table ops-table-header materials-table artifact-table"
        style={{ "--workspace-grid-template": ARTIFACT_GRID_TEMPLATE } as CSSProperties}
      >
        <ResourceColumnHeader field="title" label="Artifact" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All artifacts" ariaLabel="Filter artifacts by title" onChange={(value) => setColumnFilter("title", value)} options={columnOptions.title} value={columnFilters.title} />
        </ResourceColumnHeader>
        <ResourceColumnHeader field="targets" label="Linked to" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All targets" ariaLabel="Filter artifacts by linked target" onChange={(value) => setColumnFilter("targets", value)} options={columnOptions.targets} value={columnFilters.targets} />
        </ResourceColumnHeader>
        <ResourceColumnHeader field="status" label="Status" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter artifacts by status"
            onChange={(value) => { setStatusFilter(value); setColumnFilter("status", value); }}
            options={columnOptions.status}
            value={statusFilter}
          />
        </ResourceColumnHeader>
        <ResourceColumnHeader field="uri" label="URI" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All URIs" ariaLabel="Filter artifacts by URI" onChange={(value) => setColumnFilter("uri", value)} options={columnOptions.uri} value={columnFilters.uri} />
        </ResourceColumnHeader>
        <ResourceColumnHeader field="updated" label="Updated" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All dates" ariaLabel="Filter artifacts by updated date" onChange={(value) => setColumnFilter("updated", value)} options={columnOptions.updated} value={columnFilters.updated} />
        </ResourceColumnHeader>
      </div>

      {pagination.pageItems.map((artifact) => {
        const linkedTargets = artifact.targetRefs.map((target) => `${target.kind}: ${target.id}`).join(", ") || "Project-level";
        const statusMeta = ARTIFACT_STATUS_DISPLAY[artifact.status];

        return (
          <button
            className="ops-table ops-row materials-table artifact-table editable-hover-target editable-hover-target-row"
            key={artifact.id}
            onClick={() => openEditArtifactModal(artifact)}
            style={{ "--workspace-grid-template": ARTIFACT_GRID_TEMPLATE } as CSSProperties}
            title={`Edit ${artifact.title}`}
            type="button"
          >
            <ResourceRecordCell label="Artifact" photoUrl={artifact.photoUrl} name={artifact.title} subtitle={artifact.summary || "No summary yet."} />
            <TableCell label="Linked to">{linkedTargets}</TableCell>
            <TableCell label="Status" valueClassName="table-cell-pill">
              <span className={getStatusPillClassName(statusMeta.statusValue)}>
                {statusMeta.label}
              </span>
            </TableCell>
            <TableCell label="URI" valueClassName="artifact-link-value">
              {summarizeUri(artifact.uri)}
            </TableCell>
            <TableCell label="Updated" valueClassName="font-mono">
              {formatUpdatedAt(artifact.updatedAt)}
            </TableCell>
            <EditableHoverIndicator />
          </button>
        );
      })}

      {filteredArtifacts.length === 0 ? (
        <WorkspaceEmptyState
          reason={
            hasArtifactFilters
                ? "The current search, target, or status filters hide every document in this project scope."
                : `This project has not linked any ${artifactNoun} for planning notes, files, or handoffs yet.`
          }
          title={
            hasArtifactFilters
                ? `No ${artifactNoun} match these filters`
                : `${sectionTitle} collect project files and handoffs here`
          }
        />
      ) : null}

      <PaginationControls
        label={`${artifactNoun} artifacts`}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
        page={pagination.page}
        pageSize={pagination.pageSize}
        pageSizeOptions={pagination.pageSizeOptions}
        rangeEnd={pagination.rangeEnd}
        rangeStart={pagination.rangeStart}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
