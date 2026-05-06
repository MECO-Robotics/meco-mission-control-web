import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { IconSubsystems, IconWorkLogs } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";

import type { WorkLogSortMode } from "./workLogsViewState";

interface WorkLogsToolbarProps {
  bootstrap: BootstrapPayload;
  openCreateWorkLogModal: () => void;
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
  openCreateWorkLogModal,
  search,
  setSearch,
  setSortMode,
  setSubsystemFilter,
  sortMode,
  sortOptions,
  subsystemFilter,
}: WorkLogsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar queue-toolbar worklog-toolbar">
      <SearchToolbarInput
        ariaLabel="Search work logs"
        onChange={setSearch}
        placeholder="Search work logs..."
        value={search}
      />

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

      <label
        className={`toolbar-filter toolbar-filter-compact${sortMode !== "recent" ? " is-active" : ""}`}
        aria-label="Sort work logs"
      >
        <span className="toolbar-filter-icon">
          <IconWorkLogs />
        </span>
        <select
          aria-label="Sort work logs"
          onChange={(milestone) => setSortMode(milestone.target.value as WorkLogSortMode)}
          value={sortMode}
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <button
        aria-label="Add work log"
        className="primary-action queue-toolbar-action"
        data-tutorial-target="create-worklog-button"
        onClick={openCreateWorkLogModal}
        title="Add work log"
        type="button"
      >
        Add
      </button>
    </div>
  );
}
