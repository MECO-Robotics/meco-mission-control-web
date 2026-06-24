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
import type { ArtifactKind } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";

import {
  ARTIFACT_GRID_TEMPLATE,
  ARTIFACT_STATUS_DISPLAY,
  ARTIFACT_STATUS_OPTIONS,
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
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  pagination: ArtifactPagination;
  primaryKind: ArtifactKind;
  sectionTitle: string;
  setStatusFilter: (value: FilterSelection) => void;
  setWorkstreamFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  workstreamFilter: FilterSelection;
  workstreamOptions: Array<{ id: string; name: string }>;
  workstreamsById: Record<string, string>;
}

export function ArtifactTable({
  artifactNoun,
  filteredArtifacts,
  filterMotionClass,
  hasArtifactFilters,
  hasHiddenArchivedArtifacts,
  openCreateArtifactModal,
  openEditArtifactModal,
  pagination,
  primaryKind,
  sectionTitle,
  setStatusFilter,
  setWorkstreamFilter,
  statusFilter,
  workstreamFilter,
  workstreamOptions,
  workstreamsById,
}: ArtifactTableProps) {
  const addLabel = "Add document";

  return (
    <div className={`table-shell ${filterMotionClass}`}>
      <div
        className="ops-table ops-table-header materials-table"
        style={{ "--workspace-grid-template": ARTIFACT_GRID_TEMPLATE } as CSSProperties}
      >
        <span>Artifact</span>
        <span className="table-column-header-cell">
          <span className="table-column-title">Workflow</span>
          <ColumnFilterDropdown
            allLabel="All workflows"
            ariaLabel="Filter artifacts by workflow"
            onChange={setWorkstreamFilter}
            options={workstreamOptions}
            value={workstreamFilter}
          />
        </span>
        <span className="table-column-header-cell">
          <span className="table-column-title">Status</span>
          <ColumnFilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter artifacts by status"
            onChange={setStatusFilter}
            options={ARTIFACT_STATUS_OPTIONS}
            value={statusFilter}
          />
        </span>
        <span>Link</span>
        <span>Updated</span>
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
              <strong>{artifact.title}</strong>
              {artifact.isArchived ? <small>Archived</small> : null}
              <small>{artifact.summary || "No summary yet."}</small>
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
          actionLabel={hasArtifactFilters || hasHiddenArchivedArtifacts ? undefined : addLabel}
          onAction={
            hasArtifactFilters || hasHiddenArchivedArtifacts
              ? undefined
              : () => openCreateArtifactModal(primaryKind)
          }
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
