import type { Dispatch, SetStateAction } from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Filter } from "lucide-react";

import {
  IconParts,
  IconTasks,
} from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneType } from "@/types/common";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
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
  { id: "startDateTime", name: "Start" },
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
  const milestoneSortIsDefault = sortField === "startDateTime" && sortOrder === "asc";
  const renderSortDirectionIcon = () =>
    sortOrder === "asc" ? (
      <ArrowUpWideNarrow size={14} strokeWidth={2} />
    ) : (
      <ArrowDownWideNarrow size={14} strokeWidth={2} />
    );
  const toggleSortOrder = () => setSortOrder((current) => (current === "asc" ? "desc" : "asc"));

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
                    content: <FilterDropdown allLabel="All readiness" ariaLabel="Filter milestones by readiness" className="task-queue-filter-menu-submenu" icon={<IconTasks />} onChange={setReadinessFilter} options={[{ id: "not ready", name: "Not ready" }, { id: "blocked", name: "Blocked" }, { id: "qa", name: "QA" }, { id: "ready", name: "Ready" }]} value={readinessFilter} />,
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
                buttonLabel={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
                className="task-queue-sort-menu milestones-search-sort-menu"
                icon={renderSortDirectionIcon()}
                iconOnly
                items={[
                  {
                    label: "Sort by",
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
                  {
                    label: "Direction",
                    content: (
                      <button
                        aria-label="Toggle milestone sort direction"
                        className="icon-button milestone-sort-direction-button"
                        onClick={toggleSortOrder}
                        title={sortOrder === "asc" ? "Sort ascending" : "Sort descending"}
                        type="button"
                      >
                        {renderSortDirectionIcon()}
                      </button>
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
