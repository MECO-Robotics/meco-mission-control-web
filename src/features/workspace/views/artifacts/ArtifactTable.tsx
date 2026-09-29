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
import { ResourceRecordPreview } from "@/features/workspace/shared/resourceList/ResourceRecordPreview";
import { ResourceColumnHeader, type ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import type { ArtifactSortField } from "./artifactInventoryModel";

import {
  ARTIFACT_GRID_TEMPLATE,
  ARTIFACT_STATUS_DISPLAY,
  formatUpdatedAt,
  summarizeLink,
} from "./artifactInventoryModel";

type ArtifactPagination = ReturnType<typeof useWorkspacePagination<ArtifactRecord>>;

interface ArtifactTableProps {
  artifactNoun: string;
  filteredArtifacts: ArtifactRecord[];
  filterMotionClass: string;
  hasArtifactFilters: boolean;
  hasHiddenArchivedArtifacts: boolean;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  pagination: ArtifactPagination;
  sectionTitle: string;
  setStatusFilter: (value: FilterSelection) => void;
  setWorkstreamFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  workstreamFilter: FilterSelection;
  workstreamsById: Record<string, string>;
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
  hasHiddenArchivedArtifacts,
  openEditArtifactModal,
  pagination,
  sectionTitle,
  setStatusFilter,
  setWorkstreamFilter,
  statusFilter,
  workstreamFilter,
  workstreamsById,
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
        className="ops-table ops-table-header materials-table"
        style={{ "--workspace-grid-template": ARTIFACT_GRID_TEMPLATE } as CSSProperties}
      >
        <ResourceColumnHeader field="title" label="Artifact" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All artifacts" ariaLabel="Filter artifacts by title" onChange={(value) => setColumnFilter("title", value)} options={columnOptions.title} value={columnFilters.title} />
        </ResourceColumnHeader>
        <ResourceColumnHeader field="workstream" label="Workflow" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown
            allLabel="All workflows"
            ariaLabel="Filter artifacts by workflow"
            onChange={(value) => { setWorkstreamFilter(value); setColumnFilter("workstream", value); }}
            options={columnOptions.workstream}
            value={workstreamFilter}
          />
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
        <ResourceColumnHeader field="link" label="Link" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All links" ariaLabel="Filter artifacts by link" onChange={(value) => setColumnFilter("link", value)} options={columnOptions.link} value={columnFilters.link} />
        </ResourceColumnHeader>
        <ResourceColumnHeader field="updated" label="Updated" onSort={(field) => onSort(field as ArtifactSortField)} sortDirection={sortDirection} sortField={sortField}>
          <ColumnFilterDropdown allLabel="All dates" ariaLabel="Filter artifacts by updated date" onChange={(value) => setColumnFilter("updated", value)} options={columnOptions.updated} value={columnFilters.updated} />
        </ResourceColumnHeader>
      </div>

      {pagination.pageItems.map((artifact) => {
        const workflowName = artifact.workstreamId
          ? workstreamsById[artifact.workstreamId] ?? "Unknown workflow"
          : "Project-level";
        const statusMeta = ARTIFACT_STATUS_DISPLAY[artifact.status];

        return (
          <button
            className="ops-table ops-row materials-table editable-hover-target editable-hover-target-row"
            key={artifact.id}
            onClick={() => openEditArtifactModal(artifact)}
            style={{ "--workspace-grid-template": ARTIFACT_GRID_TEMPLATE } as CSSProperties}
            title={`Edit ${artifact.title}`}
            type="button"
          >
            <TableCell label="Artifact">
              <ResourceRecordPreview archived={artifact.isArchived} photoUrl={artifact.photoUrl} name={artifact.title} subtitle={artifact.summary || "No summary yet."} />
            </TableCell>
            <TableCell label="Workflow">{workflowName}</TableCell>
            <TableCell label="Status" valueClassName="table-cell-pill">
              <span className={getStatusPillClassName(statusMeta.statusValue)}>
                {statusMeta.label}
              </span>
            </TableCell>
            <TableCell label="Link">{summarizeLink(artifact.link)}</TableCell>
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
            hasHiddenArchivedArtifacts
              ? `Archived ${artifactNoun} are hidden. Turn on Show archived to review existing records.`
              : hasArtifactFilters
                ? "The current search, workflow, or status filters hide every artifact in this project scope."
                : `This project has not linked any ${artifactNoun} for planning notes, files, or handoffs yet.`
          }
          title={
            hasHiddenArchivedArtifacts
              ? `Archived ${artifactNoun} are hidden`
              : hasArtifactFilters
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
