import { useMemo, useState } from "react";

import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import type { ArtifactKind } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { ResourceSortMenu } from "@/features/workspace/shared/resourceList/ResourceSortMenu";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";

import { ArtifactFiltersToolbar } from "./artifacts/ArtifactFiltersToolbar";
import { ArtifactTable } from "./artifacts/ArtifactTable";
import { ARTIFACT_STATUS_OPTIONS, formatUpdatedAt, getUpdatedDateKey, sortArtifacts, type ArtifactSortField } from "./artifacts/artifactInventoryModel";

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
  const [titleFilter, setTitleFilter] = useState<FilterSelection>([]);
  const [linkFilter, setLinkFilter] = useState<FilterSelection>([]);
  const [updatedFilter, setUpdatedFilter] = useState<FilterSelection>([]);
  const [showArchivedArtifacts, setShowArchivedArtifacts] = useState(false);
  const [sortField, setSortField] = useState<ArtifactSortField>("title");
  const [sortDirection, setSortDirection] = useState<ResourceSortDirection>("ascending");
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
        (artifact.workstreamId !== null && workstreamFilter.includes(artifact.workstreamId)) ||
        (artifact.workstreamId === null && workstreamFilter.includes("__project-level__"));
      const matchesStatus = filterSelectionIncludes(statusFilter, artifact.status);
      const matchesTitle = filterSelectionIncludes(titleFilter, artifact.title);
      const matchesLink = filterSelectionIncludes(linkFilter, artifact.link || "No link");
      const matchesUpdated = filterSelectionIncludes(updatedFilter, getUpdatedDateKey(artifact.updatedAt));

      return matchesSearch && matchesWorkstream && matchesStatus && matchesTitle && matchesLink && matchesUpdated;
    });
  }, [artifactKinds, artifacts, linkFilter, search, showArchivedArtifacts, statusFilter, titleFilter, updatedFilter, workstreamFilter]);
  const sortedArtifacts = useMemo(() => sortArtifacts(filteredArtifacts, sortField, sortDirection, workstreamsById), [filteredArtifacts, sortDirection, sortField, workstreamsById]);
  const artifactPagination = useWorkspacePagination(sortedArtifacts);
  const artifactFilterMotionClass = useFilterChangeMotionClass([
    search,
    showArchivedArtifacts,
    statusFilter,
    workstreamFilter,
    titleFilter,
    linkFilter,
    updatedFilter,
  ]);

  const sectionTitle = title ?? "Documents";
  const addLabel = "Add document";
  const artifactNoun = sectionTitle.toLowerCase();
  const hasArtifactFilters =
    search.trim().length > 0 ||
    workstreamFilter.length > 0 ||
    statusFilter.length > 0 || titleFilter.length > 0 || linkFilter.length > 0 || updatedFilter.length > 0;
  const columnOptions = useMemo(() => ({
    title: [...new Set(artifacts.map((artifact) => artifact.title))].sort().map((value) => ({ id: value, name: value })),
    workstream: [...workstreamOptions, { id: "__project-level__", name: "Project-level" }],
    status: ARTIFACT_STATUS_OPTIONS,
    link: [...new Set(artifacts.map((artifact) => artifact.link || "No link"))].sort().map((value) => ({ id: value, name: value })),
    updated: [...new Map(artifacts.map((artifact) => [getUpdatedDateKey(artifact.updatedAt), formatUpdatedAt(artifact.updatedAt)]))]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, name]) => ({ id, name })),
  }), [artifacts, workstreamOptions]);
  const setColumnFilter = (field: ArtifactSortField, value: FilterSelection) => {
    if (field === "title") setTitleFilter(value);
    if (field === "workstream") setWorkstreamFilter(value);
    if (field === "status") setStatusFilter(value);
    if (field === "link") setLinkFilter(value);
    if (field === "updated") setUpdatedFilter(value);
  };
  const handleSort = (field: ArtifactSortField) => {
    if (field === sortField) setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
    else { setSortField(field); setSortDirection("ascending"); }
  };
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
        titleFilter={titleFilter}
        linkFilter={linkFilter}
        updatedFilter={updatedFilter}
        columnOptions={columnOptions}
        setColumnFilter={setColumnFilter}
        sortMenu={<ResourceSortMenu direction={sortDirection} field={sortField} label={artifactNoun} onDirectionChange={setSortDirection} onFieldChange={(field) => setSortField(field as ArtifactSortField)} options={[{ label: "Artifact", value: "title" }, { label: "Workflow", value: "workstream" }, { label: "Status", value: "status" }, { label: "Link", value: "link" }, { label: "Updated", value: "updated" }]} />}
      />

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{sectionTitle}</h2>
        </div>
      </div>

      <WorkspaceTopbarAddMenu
        actions={buildSingleAddMenuAction({
          label: addLabel,
          onSelect: () => openCreateArtifactModal(primaryKind),
        })}
        ariaLabel={addLabel}
        title={addLabel}
        tutorialTarget="create-document-button"
      />

      <ArtifactTable
        artifactNoun={artifactNoun}
        filteredArtifacts={filteredArtifacts}
        filterMotionClass={artifactFilterMotionClass}
        hasArtifactFilters={hasArtifactFilters}
        hasHiddenArchivedArtifacts={hasHiddenArchivedArtifacts}
        openEditArtifactModal={openEditArtifactModal}
        pagination={artifactPagination}
        sectionTitle={sectionTitle}
        setStatusFilter={setStatusFilter}
        setWorkstreamFilter={setWorkstreamFilter}
        statusFilter={statusFilter}
        workstreamFilter={workstreamFilter}
        workstreamsById={workstreamsById}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => handleSort(field as ArtifactSortField)}
        columnOptions={columnOptions}
        columnFilters={{ title: titleFilter, workstream: workstreamFilter, status: statusFilter, link: linkFilter, updated: updatedFilter }}
        setColumnFilter={setColumnFilter}
      />
    </section>
  );
}
