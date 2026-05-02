import type { Dispatch, SetStateAction } from "react";

import { IconParts, IconSort, IconTasks } from "@/components/shared";
import type { BootstrapPayload, EventType } from "@/types";
import {
  CompactFilterMenu,
  FilterDropdown,
  SearchToolbarInput,
  type FilterSelection,
} from "@/features/workspace/shared";
import { EVENT_TYPE_STYLES } from "@/features/workspace/shared/eventStyles";
import type { MilestoneSortField } from "./milestonesViewUtils";

const EVENT_TYPE_OPTIONS: { id: EventType; name: string }[] = (
  Object.entries(EVENT_TYPE_STYLES) as [EventType, (typeof EVENT_TYPE_STYLES)[EventType]][]
).map(([id, style]) => ({
  id,
  name: style.label,
}));

const MILESTONE_SORT_OPTIONS: { id: MilestoneSortField; name: string }[] = [
  { id: "title", name: "Milestone" },
  { id: "type", name: "Type" },
  { id: "startDateTime", name: "Start" },
];

const SORT_DIRECTION_OPTIONS: { id: "asc" | "desc"; name: string }[] = [
  { id: "asc", name: "Ascending" },
  { id: "desc", name: "Descending" },
];

interface MilestonesToolbarProps {
  isAllProjectsView: boolean;
  onAddMilestone: () => void;
  projectFilter: FilterSelection;
  searchFilter: string;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setSortField: Dispatch<SetStateAction<MilestoneSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  sortField: MilestoneSortField;
  sortOrder: "asc" | "desc";
  typeFilter: FilterSelection;
  projects: BootstrapPayload["projects"];
}

export function MilestonesToolbar({
  isAllProjectsView,
  onAddMilestone,
  projectFilter,
  projects,
  searchFilter,
  setProjectFilter,
  setSearchFilter,
  setSortField,
  setSortOrder,
  setTypeFilter,
  sortField,
  sortOrder,
  typeFilter,
}: MilestonesToolbarProps) {
  const activeCount =
    Number(isAllProjectsView && projectFilter.length > 0) + Number(typeFilter.length > 0);
  const milestoneSortIsDefault = sortField === "startDateTime" && sortOrder === "asc";

  return (
    <div className="panel-actions filter-toolbar milestones-toolbar">
      <div data-tutorial-target="milestone-search-input">
        <SearchToolbarInput
          ariaLabel="Search milestones"
          onChange={setSearchFilter}
          placeholder="Search milestones..."
          value={searchFilter}
        />
      </div>

      <CompactFilterMenu
        activeCount={activeCount}
        ariaLabel="Milestone filters"
        buttonLabel="Filters"
        className="materials-filter-menu"
        items={[
          {
            hidden: !isAllProjectsView,
            label: "Project",
            content: (
              <FilterDropdown
                allLabel="All projects"
                ariaLabel="Filter milestones by project"
                className="task-queue-filter-menu-submenu"
                icon={<IconParts />}
                onChange={setProjectFilter}
                options={projects}
                value={projectFilter}
              />
            ),
          },
          {
            label: "Type",
            content: (
              <FilterDropdown
                allLabel="All types"
                ariaLabel="Filter milestones by type"
                className="task-queue-filter-menu-submenu"
                icon={<IconTasks />}
                onChange={setTypeFilter}
                options={EVENT_TYPE_OPTIONS}
                value={typeFilter}
              />
            ),
          },
        ]}
      />

      <CompactFilterMenu
        activeCount={milestoneSortIsDefault ? 0 : 1}
        ariaLabel="Sort milestones"
        buttonLabel="Sort"
        className="task-queue-sort-menu"
        icon={<IconSort />}
        items={[
          {
            label: "Sort by",
            content: (
              <select
                aria-label="Sort milestones by"
                className="task-queue-sort-menu-select"
                onChange={(event) => setSortField(event.target.value as MilestoneSortField)}
                value={sortField}
              >
                {MILESTONE_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: "Direction",
            content: (
              <select
                aria-label="Sort direction"
                className="task-queue-sort-menu-select"
                onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
                value={sortOrder}
              >
                {SORT_DIRECTION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />

      <button
        aria-label="Add milestone"
        className="primary-action queue-toolbar-action"
        data-tutorial-target="create-milestone-button"
        onClick={onAddMilestone}
        title="Add milestone"
        type="button"
      >
        Add
      </button>
    </div>
  );
}
