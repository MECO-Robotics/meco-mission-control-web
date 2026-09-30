import type { ReactNode } from "react";

import { IconManufacturing, IconTasks } from "@/components/shared/Icons";
import { ArchiveFilterCheckbox } from "@/features/workspace/shared/filters/ArchiveFilterCheckbox";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { READINESS_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { ALL_FILTER_LABEL, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { createResourceFilterMenuItem } from "@/features/workspace/shared/resourceList/ResourceFilterMenuItem";
import { PART_DEFINITION_COLUMNS, type PartDefinitionColumnFilters, type PartDefinitionSortField } from "./partsViewTypes";

interface PartsToolbarProps {
  bootstrap: BootstrapPayload;
  mapping: string;
  partSearch: string;
  partStatus: FilterSelection;
  partSubsystem: FilterSelection;
  setPartSearch: (value: string) => void;
  setMapping: (value: string) => void;
  setPartStatus: (value: FilterSelection) => void;
  setPartSubsystem: (value: FilterSelection) => void;
  setShowArchivedPartDefinitions: (value: boolean) => void;
  showArchivedPartDefinitions: boolean;
  sortMenu?: ReactNode;
  activeColumnFilterCount?: number;
  columnFilters?: PartDefinitionColumnFilters;
  columnOptions?: Record<PartDefinitionSortField, Array<{ id: string; name: string }>>;
  setColumnFilter?: (field: PartDefinitionSortField, value: FilterSelection) => void;
}

export function PartsToolbar({
  bootstrap,
  mapping,
  partSearch,
  partStatus,
  partSubsystem,
  setPartSearch,
  setMapping,
  setPartStatus,
  setPartSubsystem,
  setShowArchivedPartDefinitions,
  showArchivedPartDefinitions,
  sortMenu,
  activeColumnFilterCount = 0,
  columnFilters = { name: [], number: [], revision: [], iteration: [], type: [], material: [] },
  columnOptions = { name: [], number: [], revision: [], iteration: [], type: [], material: [] },
  setColumnFilter = () => undefined,
}: PartsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar part-manager-toolbar">
      <TopbarResponsiveSearch
        actions={
          <>
            <CompactFilterMenu
              activeCount={[partSubsystem, partStatus].filter((value) => value.length > 0).length + Number(mapping !== "all") + Number(showArchivedPartDefinitions) + activeColumnFilterCount}
              ariaLabel="Part filters"
              buttonLabel="Filters"
              className="materials-filter-menu"
              items={[
                ...PART_DEFINITION_COLUMNS.map(({ field, label, allLabel }) => createResourceFilterMenuItem({
                  allLabel,
                  ariaLabel: `Filter parts by ${label.toLowerCase()}`,
                  label,
                  onChange: (value) => setColumnFilter(field, value),
                  options: columnOptions[field],
                  value: columnFilters[field],
                })),
                {
                  label: "Subsystem",
                  content: (
                    <FilterDropdown
                      allLabel="All subsystems"
                      ariaLabel="Filter parts by subsystem"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconManufacturing />}
                      onChange={setPartSubsystem}
                      options={bootstrap.subsystems}
                      value={partSubsystem}
                    />
                  ),
                },
                {
                  label: "Status",
                  content: (
                    <FilterDropdown
                      allLabel="All statuses"
                      ariaLabel="Filter parts by status"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconTasks />}
                      onChange={setPartStatus}
                      options={READINESS_STATUS_OPTIONS}
                      value={partStatus}
                    />
                  ),
                },
                {
                  label: "Allocation",
                  content: (
                    <select
                      aria-label="Part allocation"
                      className="toolbar-filter-select"
                      onChange={(event) => setMapping(event.target.value)}
                      value={mapping}
                    >
                      <option value="all">{ALL_FILTER_LABEL}</option>
                      <option value="mapped">Mapped</option>
                      <option value="unmapped">Needs mapping</option>
                    </select>
                  ),
                },
                {
                  label: "Archive",
                  content: <ArchiveFilterCheckbox checked={showArchivedPartDefinitions} label="Show archived definitions" onChange={setShowArchivedPartDefinitions} />,
                },
              ]}
            />
            {sortMenu}
          </>
        }
        ariaLabel="Search parts"
        compactPlaceholder="Search"
        onChange={setPartSearch}
        placeholder="Search parts..."
        tutorialTarget="parts-search-input"
        value={partSearch}
      />
    </div>
  );
}
