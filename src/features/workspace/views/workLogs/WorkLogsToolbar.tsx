import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { IconSort, IconSubsystems } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";

import type { WorkLogSortMode } from "./workLogsViewState";

interface WorkLogsToolbarProps {
  bootstrap: BootstrapPayload;
  renderMode?: "panel" | "topbar";
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  setSortMode: Dispatch<SetStateAction<WorkLogSortMode>>;
  setSubsystemFilter: Dispatch<SetStateAction<FilterSelection>>;
  sortMode: WorkLogSortMode;
  sortOptions: DropdownOption[];
  subsystemFilter: FilterSelection;
}

export function WorkLogsToolbar({
  bootstrap,
  renderMode = "panel",
  search,
  setSearch,
  setSortMode,
  setSubsystemFilter,
  sortMode,
  sortOptions,
  subsystemFilter,
}: WorkLogsToolbarProps) {
  const isTopbar = renderMode === "topbar";

  return (
    <div
      className={`panel-actions filter-toolbar queue-toolbar worklog-toolbar${isTopbar ? " worklog-toolbar-topbar" : ""}`}
    >
      <TopbarResponsiveSearch
        actionCount={2}
        actions={
          <>
            <CompactFilterMenu
              activeCount={subsystemFilter.length}
              ariaLabel="Work log filters"
              buttonLabel="Filters"
              className="materials-filter-menu"
              items={[
                {
                  label: "Subsystem",
                  content: (
                    <FilterDropdown
                      allLabel="All subsystems"
                      ariaLabel="Filter work logs by subsystem"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconSubsystems />}
                      onChange={setSubsystemFilter}
                      options={bootstrap.subsystems}
                      value={subsystemFilter}
                    />
                  ),
                },
              ]}
            />
            <CompactFilterMenu
              activeCount={sortMode !== "recent" ? 1 : 0}
              ariaLabel="Sort work logs"
              buttonLabel="Sort"
              className="task-queue-sort-menu"
              icon={<IconSort />}
              items={[
                {
                  label: "Sort by",
                  content: (
                    <select
                      aria-label="Sort work logs"
                      className="task-queue-sort-menu-select"
                      onChange={(milestone) => setSortMode(milestone.target.value as WorkLogSortMode)}
                      value={sortMode}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
              ]}
            />
          </>
        }
        ariaLabel="Search work logs"
        onChange={setSearch}
        placeholder="Search work logs..."
        value={search}
      />

    </div>
  );
}
