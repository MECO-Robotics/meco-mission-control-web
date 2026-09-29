import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { IconManufacturing, IconTasks } from "@/components/shared/Icons";
import { ArchiveFilterCheckbox } from "@/features/workspace/shared/filters/ArchiveFilterCheckbox";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import { ARTIFACT_STATUS_OPTIONS } from "./artifactInventoryModel";

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
  workstreamOptions: Array<{ id: string; name: string }>;
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
  workstreamOptions,
}: ArtifactFiltersToolbarProps) {
  const activeFilterCount = [workstreamFilter, statusFilter].filter(
    (value) => value.length > 0,
  ).length + Number(showArchivedArtifacts);

  return (
    <AppTopbarSlotPortal slot="controls">
      <div className="panel-actions filter-toolbar materials-toolbar">
        <TopbarResponsiveSearch
          actions={
            <CompactFilterMenu
              activeCount={activeFilterCount}
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
                {
                  label: "Archive",
                  content: <ArchiveFilterCheckbox checked={showArchivedArtifacts} label="Show archived" onChange={setShowArchivedArtifacts} />,
                },
              ]}
            />
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
