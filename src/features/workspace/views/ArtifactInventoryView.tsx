import { useMemo, useState, type CSSProperties } from "react";

import { IconManufacturing, IconTasks } from "@/components/shared";
import type {
  ArtifactKind,
  ArtifactRecord,
  ArtifactStatus,
  BootstrapPayload,
} from "@/types";
import {
  EditableHoverIndicator,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";

interface ArtifactInventoryViewProps {
  bootstrap: BootstrapPayload;
  artifacts: ArtifactRecord[];
  kind: ArtifactKind;
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
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
  kind,
  openCreateArtifactModal,
  openEditArtifactModal,
}: ArtifactInventoryViewProps) {
  const [search, setSearch] = useState("");
  const [workstreamFilter, setWorkstreamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
      if (artifact.kind !== kind) {
        return false;
      }

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [artifact.title, artifact.summary, artifact.link]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesWorkstream =
        workstreamFilter === "all" || artifact.workstreamId === workstreamFilter;
      const matchesStatus =
        statusFilter === "all" || artifact.status === statusFilter;

      return matchesSearch && matchesWorkstream && matchesStatus;
    });
  }, [artifacts, kind, search, statusFilter, workstreamFilter]);

  const sectionTitle = kind === "document" ? "Documents" : "Non-Technical";
  const addLabel = kind === "document" ? "Add document" : "Add non-technical";

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

          <FilterDropdown
            allLabel="All workflows"
            ariaLabel="Filter artifacts by workflow"
            icon={<IconManufacturing />}
            onChange={setWorkstreamFilter}
            options={workstreamOptions}
            value={workstreamFilter}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter artifacts by status"
            icon={<IconTasks />}
            onChange={setStatusFilter}
            options={ARTIFACT_STATUS_OPTIONS}
            value={statusFilter}
          />

          <button
            aria-label={addLabel}
            className="primary-action queue-toolbar-action"
            onClick={() => openCreateArtifactModal(kind)}
            title={addLabel}
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div
          className="ops-table ops-table-header materials-table"
          style={{ "--workspace-grid-template": ARTIFACT_GRID_TEMPLATE } as CSSProperties}
        >
          <span>Artifact</span>
          <span>Workflow</span>
          <span>Status</span>
          <span>Link</span>
          <span>Updated</span>
        </div>

        {filteredArtifacts.map((artifact) => {
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
      </div>
    </section>
  );
}




