import type { ReactNode } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { createResourceFilterMenuItem } from "@/features/workspace/shared/resourceList/ResourceFilterMenuItem";

import type { ArtifactSortField } from "./artifactInventoryModel";

interface ArtifactFiltersToolbarProps {
  artifactNoun: string;
  search: string;
  setSearch: (value: string) => void;
  setStatusFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  targetFilter: FilterSelection;
  sortMenu: ReactNode;
  titleFilter: FilterSelection;
  uriFilter: FilterSelection;
  updatedFilter: FilterSelection;
  columnOptions: Record<ArtifactSortField, Array<{ id: string; name: string }>>;
  setColumnFilter: (field: ArtifactSortField, value: FilterSelection) => void;
}

export function ArtifactFiltersToolbar({
  artifactNoun,
  search,
  setSearch,
  setStatusFilter,
  statusFilter,
  targetFilter,
  sortMenu,
  titleFilter,
  uriFilter,
  updatedFilter,
  columnOptions,
  setColumnFilter,
}: ArtifactFiltersToolbarProps) {
  const activeFilterCount = [statusFilter, titleFilter, uriFilter, updatedFilter].filter(
    (value) => value.length > 0,
  ).length;

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
                createResourceFilterMenuItem({ allLabel: "All targets", ariaLabel: "Filter artifacts by linked target", label: "Linked to", onChange: (value) => setColumnFilter("targets", value), options: columnOptions.targets, value: targetFilter }),
                createResourceFilterMenuItem({ allLabel: "All statuses", ariaLabel: "Filter artifacts by status", label: "Status", onChange: (value) => { setStatusFilter(value); setColumnFilter("status", value); }, options: columnOptions.status, value: statusFilter }),
                createResourceFilterMenuItem({ allLabel: "All URIs", ariaLabel: "Filter artifacts by URI", label: "URI", onChange: (value) => setColumnFilter("uri", value), options: columnOptions.uri, value: uriFilter }),
                createResourceFilterMenuItem({ allLabel: "All dates", ariaLabel: "Filter artifacts by updated date", label: "Updated", onChange: (value) => setColumnFilter("updated", value), options: columnOptions.updated, value: updatedFilter }),
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
