import { useMemo, useState } from "react";

import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import type { ArtifactKind } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";
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
  artifacts: ArtifactRecord[];
  createKind?: ArtifactKind;
  kinds: readonly ArtifactKind[];
  openCreateArtifactModal: (kind: ArtifactKind) => void;
  openEditArtifactModal: (artifact: ArtifactRecord) => void;
  title?: string;
}

export function ArtifactInventoryView({
  artifacts,
  createKind,
  kinds,
  openCreateArtifactModal,
  openEditArtifactModal,
  title,
}: ArtifactInventoryViewProps) {
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState<FilterSelection>([]);
  const [statusFilter, setStatusFilter] = useState<FilterSelection>([]);
  const [titleFilter, setTitleFilter] = useState<FilterSelection>([]);
  const [uriFilter, setUriFilter] = useState<FilterSelection>([]);
  const [updatedFilter, setUpdatedFilter] = useState<FilterSelection>([]);
  const [sortField, setSortField] = useState<ArtifactSortField>("title");
  const [sortDirection, setSortDirection] = useState<ResourceSortDirection>("ascending");
  const artifactKinds = useMemo(
    () => (kinds.length > 0 ? kinds : [createKind ?? "document"]),
    [createKind, kinds],
  );
  const primaryKind = createKind ?? artifactKinds[0] ?? "document";

  const targetOptions = useMemo(() => [...new Set(artifacts.flatMap((a) => a.targetRefs.map((target) => `${target.kind}:${target.id}`)))].sort().map((id) => ({ id, name: id.replace(":", " · ") })), [artifacts]);

  const filteredArtifacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return artifacts.filter((artifact) => {
      if (!artifactKinds.includes(artifact.kind)) {
        return false;
      }
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [artifact.title, artifact.summary, artifact.uri, ...artifact.targetRefs.map((target) => `${target.kind} ${target.id}`)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesTarget = targetFilter.length === 0 || artifact.targetRefs.some((target) => targetFilter.includes(`${target.kind}:${target.id}`));
      const matchesStatus = filterSelectionIncludes(statusFilter, artifact.status);
      const matchesTitle = filterSelectionIncludes(titleFilter, artifact.title);
      const matchesUri = filterSelectionIncludes(uriFilter, artifact.uri || "No URI");
      const matchesUpdated = filterSelectionIncludes(updatedFilter, getUpdatedDateKey(artifact.updatedAt));

      return matchesSearch && matchesTarget && matchesStatus && matchesTitle && matchesUri && matchesUpdated;
    });
  }, [artifactKinds, artifacts, search, statusFilter, targetFilter, titleFilter, updatedFilter, uriFilter]);
  const sortedArtifacts = useMemo(() => sortArtifacts(filteredArtifacts, sortField, sortDirection), [filteredArtifacts, sortDirection, sortField]);
  const artifactPagination = useWorkspacePagination(sortedArtifacts);
  const artifactFilterMotionClass = useFilterChangeMotionClass([
    search,
    statusFilter,
    targetFilter,
    titleFilter,
    uriFilter,
    updatedFilter,
  ]);

  const sectionTitle = title ?? "Documents";
  const addLabel = "Add document";
  const artifactNoun = sectionTitle.toLowerCase();
  const hasArtifactFilters =
    search.trim().length > 0 ||
    targetFilter.length > 0 ||
    statusFilter.length > 0 || titleFilter.length > 0 || uriFilter.length > 0 || updatedFilter.length > 0;
  const columnOptions = useMemo(() => ({
    title: [...new Set(artifacts.map((artifact) => artifact.title))].sort().map((value) => ({ id: value, name: value })),
    targets: targetOptions,
    status: ARTIFACT_STATUS_OPTIONS,
    uri: [...new Set(artifacts.map((artifact) => artifact.uri || "No URI"))].sort().map((value) => ({ id: value, name: value })),
    updated: [...new Map(artifacts.map((artifact) => [getUpdatedDateKey(artifact.updatedAt), formatUpdatedAt(artifact.updatedAt)]))]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, name]) => ({ id, name })),
  }), [artifacts, targetOptions]);
  const setColumnFilter = (field: ArtifactSortField, value: FilterSelection) => {
    if (field === "title") setTitleFilter(value);
    if (field === "targets") setTargetFilter(value);
    if (field === "status") setStatusFilter(value);
    if (field === "uri") setUriFilter(value);
    if (field === "updated") setUpdatedFilter(value);
  };
  const handleSort = (field: ArtifactSortField) => {
    if (field === sortField) setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
    else { setSortField(field); setSortDirection("ascending"); }
  };
  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <ArtifactFiltersToolbar
        artifactNoun={artifactNoun}
        search={search}
        setSearch={setSearch}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
        targetFilter={targetFilter}
        titleFilter={titleFilter}
        uriFilter={uriFilter}
        updatedFilter={updatedFilter}
        columnOptions={columnOptions}
        setColumnFilter={setColumnFilter}
        sortMenu={<ResourceSortMenu direction={sortDirection} field={sortField} label={artifactNoun} onDirectionChange={setSortDirection} onFieldChange={(field) => setSortField(field as ArtifactSortField)} options={[{ label: "Artifact", value: "title" }, { label: "Linked to", value: "targets" }, { label: "Status", value: "status" }, { label: "URI", value: "uri" }, { label: "Updated", value: "updated" }]} />}
      />

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
        openEditArtifactModal={openEditArtifactModal}
        pagination={artifactPagination}
        sectionTitle={sectionTitle}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => handleSort(field as ArtifactSortField)}
        columnOptions={columnOptions}
        columnFilters={{ title: titleFilter, targets: targetFilter, status: statusFilter, uri: uriFilter, updated: updatedFilter }}
        setColumnFilter={setColumnFilter}
      />
    </section>
  );
}
