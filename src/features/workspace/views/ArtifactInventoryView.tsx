import { useMemo, useState } from "react";

import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";
import type { ArtifactKind } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import { ArtifactFiltersToolbar } from "./artifacts/ArtifactFiltersToolbar";
import { ArtifactTable } from "./artifacts/ArtifactTable";

interface ArtifactInventoryViewProps {
  bootstrap: BootstrapPayload;
  artifacts: ArtifactRecord[];
  createKind?: ArtifactKind;
  kinds: readonly ArtifactKind[];
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  title?: string;
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
  const workstreamsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.workstreams.map((workstream) => [workstream.id, workstream.name]),
      ),
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
  const artifactNoun = sectionTitle.toLowerCase();
  const hasArtifactFilters =
    search.trim().length > 0 ||
    workstreamFilter.length > 0 ||
    statusFilter.length > 0;
  const hasHiddenArchivedArtifacts =
    !showArchivedArtifacts &&
    !hasArtifactFilters &&
    artifacts.some((artifact) => artifactKinds.includes(artifact.kind)) &&
    filteredArtifacts.length === 0;

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <ArtifactFiltersToolbar
        artifactNoun={artifactNoun}
        search={search}
        setSearch={setSearch}
        setShowArchivedArtifacts={setShowArchivedArtifacts}
        setStatusFilter={setStatusFilter}
        setWorkstreamFilter={setWorkstreamFilter}
        showArchivedArtifacts={showArchivedArtifacts}
        statusFilter={statusFilter}
        workstreamFilter={workstreamFilter}
        workstreamOptions={workstreamOptions}
      />

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{sectionTitle}</h2>
          <p className="section-copy">
            Artifact inventory scoped to this project selection.
          </p>
        </div>
      </div>

      <WorkspaceFloatingAddButton
        ariaLabel={addLabel}
        onClick={() => openCreateArtifactModal(primaryKind)}
        title={addLabel}
        tutorialTarget="create-document-button"
      />

      <ArtifactTable
        artifactNoun={artifactNoun}
        filteredArtifacts={filteredArtifacts}
        filterMotionClass={artifactFilterMotionClass}
        hasArtifactFilters={hasArtifactFilters}
        hasHiddenArchivedArtifacts={hasHiddenArchivedArtifacts}
        openCreateArtifactModal={openCreateArtifactModal}
        openEditArtifactModal={openEditArtifactModal}
        pagination={artifactPagination}
        primaryKind={primaryKind}
        sectionTitle={sectionTitle}
        setStatusFilter={setStatusFilter}
        setWorkstreamFilter={setWorkstreamFilter}
        statusFilter={statusFilter}
        workstreamFilter={workstreamFilter}
        workstreamOptions={workstreamOptions}
        workstreamsById={workstreamsById}
      />
    </section>
  );
}
