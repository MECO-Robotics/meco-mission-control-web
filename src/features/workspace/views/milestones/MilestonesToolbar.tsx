import type { Dispatch, SetStateAction } from "react";
import { Filter } from "lucide-react";

import {
  IconParts,
  IconSort,
  IconTasks,
} from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneType } from "@/types/common";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
import { READINESS_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { MilestonesSearchControl } from "./MilestonesSearchControl";
import {
  type MilestoneSearchSuggestion,
  type MilestoneSortField,
} from "./milestonesViewUtils";

const MILESTONE_TYPE_OPTIONS: { id: MilestoneType; name: string }[] = (
  Object.entries(MILESTONE_TYPE_STYLES) as [MilestoneType, (typeof MILESTONE_TYPE_STYLES)[MilestoneType]][]
).map(([id, style]) => ({
  id,
  name: style.label,
}));

const MILESTONE_SORT_OPTIONS: { id: MilestoneSortField; name: string }[] = [
  { id: "title", name: "Milestone" },
  { id: "type", name: "Type" },
  { id: "startAt", name: "Start" },
];

interface MilestonesToolbarProps {
  isAllProjectsView: boolean;
  projectFilter: FilterSelection;
  searchFilter: string;
  setProjectFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  setReadinessFilter: Dispatch<SetStateAction<FilterSelection>>;
  setSortField: Dispatch<SetStateAction<MilestoneSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  searchSuggestions: MilestoneSearchSuggestion[];
  readinessFilter: FilterSelection;
  sortField: MilestoneSortField;
  sortOrder: "asc" | "desc";
  typeFilter: FilterSelection;
  projects: BootstrapPayload["projects"];
}

export function MilestonesToolbar({
  isAllProjectsView,
  projectFilter,
  projects,
  searchFilter,
  searchSuggestions,
  setProjectFilter,
  setSearchFilter,
  setReadinessFilter,
  setSortField,
  setSortOrder,
  setTypeFilter,
  readinessFilter,
  sortField,
  sortOrder,
  typeFilter,
}: MilestonesToolbarProps) {
  const activeCount =
    Number(isAllProjectsView && projectFilter.length > 0) + Number(typeFilter.length > 0) + Number(readinessFilter.length > 0);
  const milestoneSortIsDefault = sortField === "startAt" && sortOrder === "asc";
  return (
    <div className="panel-actions filter-toolbar milestones-toolbar">
      <div className="milestones-search-slot" data-tutorial-target="milestone-search-input">
        <MilestonesSearchControl
          filterControl={
            <>
              <CompactFilterMenu
                activeCount={activeCount}
                ariaLabel="Milestone filters"
                buttonLabel="Filters"
                className="materials-filter-menu milestones-search-filter-menu"
                icon={<Filter size={14} strokeWidth={2} />}
                iconOnly
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
                    label: "Readiness",
                    content: <FilterDropdown allLabel="All readiness" ariaLabel="Filter milestones by readiness" className="task-queue-filter-menu-submenu" icon={<IconTasks />} onChange={setReadinessFilter} options={READINESS_STATUS_OPTIONS} value={readinessFilter} />,
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
                        options={MILESTONE_TYPE_OPTIONS}
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
                className="task-queue-sort-menu milestones-search-sort-menu"
                icon={<IconSort />}
                iconOnly
                items={[
                  {
                    label: "Sort by",
                    labelControl: (
                      <SortDirectionToggle direction={sortOrder} label="milestones" onChange={setSortOrder} />
                    ),
                    content: (
                      <select
                        aria-label="Sort milestones by"
                        className="task-queue-sort-menu-select"
                        onChange={(milestone) => setSortField(milestone.target.value as MilestoneSortField)}
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
                ]}
              />
            </>
          }
          searchFilter={searchFilter}
          searchSuggestions={searchSuggestions}
          setSearchFilter={setSearchFilter}
        />
      </div>

    </div>
  );
}
