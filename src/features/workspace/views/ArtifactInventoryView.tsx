import { useMemo, useState, type CSSProperties } from "react";
import { Plus } from "lucide-react";

import { IconManufacturing, IconTasks } from "@/components/shared/Icons";
import type { ArtifactKind, ArtifactStatus } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { EditableHoverIndicator, PaginationControls, TableCell, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

interface ArtifactInventoryViewProps {
  bootstrap: BootstrapPayload;
  artifacts: ArtifactRecord[];
  createKind?: ArtifactKind;
  kinds: readonly ArtifactKind[];
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  title?: string;
}

const ARTIFACT_GRID_TEMPLATE = "minmax(240px, 2fr) 1.1fr 0.9fr 1fr 0.8fr";

const ARTIFACT_STATUS_OPTIONS: Array<{ id: ArtifactStatus; name: string }> = [
  { id: "draft", name: "Draft" },
  { id: "in-review", name: "In review" },
  { id: "published", name: "Published" },
];

const ARTIFACT_STATUS_DISPLAY: Record<
  ArtifactStatus,
  { label: string; statusValue: string }
> = {
  draft: { label: "Draft", statusValue: "not-started" },
  "in-review": { label: "In review", statusValue: "waiting-for-qa" },
  published: { label: "Published", statusValue: "complete" },
};

function formatUpdatedAt(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString();
}

function summarizeLink(link: string) {
  if (!link.trim()) {
    return "No link";
  }

  try {
    const url = new URL(link);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return link;
  }
}

export function ArtifactInventoryView({
  bootstrap,
  artifacts,
  createKind,
  kinds,
  openCreateArtifactModal,
  openEditArtifactModal,
  title,
}: ArtifactInventoryViewProps) {
  const [search, setSearch] = useState("");
  const [workstreamFilter, setWorkstreamFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [showArchivedArtifacts, setShowArchivedArtifacts] = useState(false);
  const artifactKinds = useMemo(
    () => (kinds.length > 0 ? kinds : [createKind ?? "document"]),
    [createKind, kinds],
  );
  const primaryKind = createKind ?? artifactKinds[0] ?? "document";

  const workstreamOptions = useMemo(
    () =>
      bootstrap.workstreams
        .map((workstream) => ({
          id: workstream.id,
          name: workstream.name,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [bootstrap.workstreams],
  );

  const filteredArtifacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return artifacts.filter((artifact) => {
      if (!artifactKinds.includes(artifact.kind)) {
        return false;
      }
      if (!showArchivedArtifacts && artifact.isArchived) {
        return false;
      }

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [artifact.title, artifact.summary, artifact.link]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesWorkstream =
        workstreamFilter.length === 0 ||
        (artifact.workstreamId !== null && workstreamFilter.includes(artifact.workstreamId));
      const matchesStatus = filterSelectionIncludes(statusFilter, artifact.status);

      return matchesSearch && matchesWorkstream && matchesStatus;
    });
  }, [artifactKinds, artifacts, search, showArchivedArtifacts, statusFilter, workstreamFilter]);
  const artifactPagination = useWorkspacePagination(filteredArtifacts);
  const artifactFilterMotionClass = useFilterChangeMotionClass([
    search,
    showArchivedArtifacts,
    statusFilter,
    workstreamFilter,
  ]);

  const sectionTitle = title ?? "Documents";
  const addLabel = "Add document";

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{sectionTitle}</h2>
          <p className="section-copy">
            Artifact inventory scoped to this project selection.
          </p>
        </div>

        <div className="panel-actions filter-toolbar materials-toolbar">
          <SearchToolbarInput
            ariaLabel={`Search ${sectionTitle.toLowerCase()}`}
            onChange={setSearch}
            placeholder={`Search ${sectionTitle.toLowerCase()}...`}
            value={search}
          />

          <CompactFilterMenu
            activeCount={[workstreamFilter, statusFilter].filter((value) => value.length > 0).length}
            ariaLabel="Artifact filters"
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Workflow",
                content: (
                  <FilterDropdown
                    allLabel="All workflows"
                    ariaLabel="Filter artifacts by workflow"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconManufacturing />}
                    onChange={setWorkstreamFilter}
                    options={workstreamOptions}
                    value={workstreamFilter}
                  />
                ),
              },
              {
                label: "Status",
                content: (
                  <FilterDropdown
                    allLabel="All statuses"
                    ariaLabel="Filter artifacts by status"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconTasks />}
                    onChange={setStatusFilter}
                    options={ARTIFACT_STATUS_OPTIONS}
                    value={statusFilter}
                  />
                ),
              },
            ]}
          />
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
              checked={showArchivedArtifacts}
              onChange={(milestone) => setShowArchivedArtifacts(milestone.target.checked)}
              type="checkbox"
            />
            Show archived
          </label>

          <button
            aria-label={addLabel}
            className="primary-action queue-toolbar-action queue-toolbar-action-round"
            data-tutorial-target="create-document-button"
            onClick={() => openCreateArtifactModal(primaryKind)}
            title={addLabel}
            type="button"
          >
            <Plus size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className={`table-shell ${artifactFilterMotionClass}`}>
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

        {artifactPagination.pageItems.map((artifact) => {
          const workflowName = artifact.workstreamId
            ? bootstrap.workstreams.find(
                (workstream) => workstream.id === artifact.workstreamId,
              )?.name ?? "Unknown workflow"
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
              <TableCell label="Updated">{formatUpdatedAt(artifact.updatedAt)}</TableCell>
              <EditableHoverIndicator />
            </button>
          );
        })}

        {filteredArtifacts.length === 0 ? (
          <p className="empty-state">
            No {sectionTitle.toLowerCase()} artifacts match the current filters.
          </p>
        ) : null}
        <PaginationControls
          label={`${sectionTitle.toLowerCase()} artifacts`}
          onPageChange={artifactPagination.setPage}
          onPageSizeChange={artifactPagination.setPageSize}
          page={artifactPagination.page}
          pageSize={artifactPagination.pageSize}
          pageSizeOptions={artifactPagination.pageSizeOptions}
          rangeEnd={artifactPagination.rangeEnd}
          rangeStart={artifactPagination.rangeStart}
          totalItems={artifactPagination.totalItems}
          totalPages={artifactPagination.totalPages}
        />
      </div>
    </section>
  );
}
