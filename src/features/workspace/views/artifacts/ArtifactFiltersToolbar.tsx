import type { ReactNode } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { ArchiveFilterCheckbox } from "@/features/workspace/shared/filters/ArchiveFilterCheckbox";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { createResourceFilterMenuItem } from "@/features/workspace/shared/resourceList/ResourceFilterMenuItem";

import type { ArtifactSortField } from "./artifactInventoryModel";

interface ArtifactFiltersToolbarProps {
  artifactNoun: string;
  search: string;
  setSearch: (value: string) => void;
  setShowArchivedArtifacts: (value: boolean) => void;
  setStatusFilter: (value: FilterSelection) => void;
  setWorkstreamFilter: (value: FilterSelection) => void;
  showArchivedArtifacts: boolean;
  statusFilter: FilterSelection;
  workstreamFilter: FilterSelection;
  sortMenu: ReactNode;
  titleFilter: FilterSelection;
  linkFilter: FilterSelection;
  updatedFilter: FilterSelection;
  columnOptions: Record<ArtifactSortField, Array<{ id: string; name: string }>>;
  setColumnFilter: (field: ArtifactSortField, value: FilterSelection) => void;
}

export function ArtifactFiltersToolbar({
  artifactNoun,
  search,
  setSearch,
  setShowArchivedArtifacts,
  setStatusFilter,
  setWorkstreamFilter,
  showArchivedArtifacts,
  statusFilter,
  workstreamFilter,
  sortMenu,
  titleFilter,
  linkFilter,
  updatedFilter,
  columnOptions,
  setColumnFilter,
}: ArtifactFiltersToolbarProps) {
  const activeFilterCount = [workstreamFilter, statusFilter, titleFilter, linkFilter, updatedFilter].filter(
    (value) => value.length > 0,
  ).length + Number(showArchivedArtifacts);

  return (
    <AppTopbarSlotPortal slot="controls">
      <div className="panel-actions filter-toolbar materials-toolbar">
        <TopbarResponsiveSearch
          actions={
            <>
            <CompactFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="Artifact filters"
              buttonLabel="Filters"
              className="materials-filter-menu"
              items={[
                createResourceFilterMenuItem({ allLabel: "All artifacts", ariaLabel: "Filter artifacts by title", label: "Artifact", onChange: (value) => setColumnFilter("title", value), options: columnOptions.title, value: titleFilter }),
                createResourceFilterMenuItem({ allLabel: "All workflows", ariaLabel: "Filter artifacts by workflow", label: "Workflow", onChange: (value) => { setWorkstreamFilter(value); setColumnFilter("workstream", value); }, options: columnOptions.workstream, value: workstreamFilter }),
                createResourceFilterMenuItem({ allLabel: "All statuses", ariaLabel: "Filter artifacts by status", label: "Status", onChange: (value) => { setStatusFilter(value); setColumnFilter("status", value); }, options: columnOptions.status, value: statusFilter }),
                createResourceFilterMenuItem({ allLabel: "All links", ariaLabel: "Filter artifacts by link", label: "Link", onChange: (value) => setColumnFilter("link", value), options: columnOptions.link, value: linkFilter }),
                createResourceFilterMenuItem({ allLabel: "All dates", ariaLabel: "Filter artifacts by updated date", label: "Updated", onChange: (value) => setColumnFilter("updated", value), options: columnOptions.updated, value: updatedFilter }),
                {
                  label: "Archive",
                  content: <ArchiveFilterCheckbox checked={showArchivedArtifacts} label="Show archived" onChange={setShowArchivedArtifacts} />,
                },
              ]}
            />
            {sortMenu}
            </>
          }
          ariaLabel={`Search ${artifactNoun}`}
          compactPlaceholder="Search"
          onChange={setSearch}
          placeholder={`Search ${artifactNoun}...`}
          value={search}
        />
      </div>
    </AppTopbarSlotPortal>
  );
}
