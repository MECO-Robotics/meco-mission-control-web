import type { Dispatch, SetStateAction } from "react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Filter } from "lucide-react";

import {
  IconParts,
  IconSearchMinus,
  IconSearchPlus,
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
  clampMilestoneZoom,
  formatMilestoneZoomLabel,
  MILESTONE_ZOOM_MAX,
  MILESTONE_ZOOM_MIN,
  MILESTONE_ZOOM_STEP,
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
  setMilestoneZoom: Dispatch<SetStateAction<number>>;
  setSortField: Dispatch<SetStateAction<MilestoneSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  searchSuggestions: MilestoneSearchSuggestion[];
  milestoneZoom: number;
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
  setMilestoneZoom,
  setSortField,
  setSortOrder,
  setTypeFilter,
  milestoneZoom,
  sortField,
  sortOrder,
  typeFilter,
}: MilestonesToolbarProps) {
  const activeCount =
    Number(isAllProjectsView && projectFilter.length > 0) + Number(typeFilter.length > 0);
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

      <div aria-label="Milestones zoom" className="task-queue-zoom-controls milestones-zoom-controls" role="group">
        <button
          aria-label="Zoom out milestones"
          className="icon-button task-queue-zoom-button milestones-zoom-button"
          disabled={milestoneZoom <= MILESTONE_ZOOM_MIN}
          onClick={() => setMilestoneZoom((current) => clampMilestoneZoom(current - MILESTONE_ZOOM_STEP))}
          title="Zoom out milestones"
          type="button"
        >
          <IconSearchMinus />
        </button>
        <span className="task-queue-zoom-label">{formatMilestoneZoomLabel(milestoneZoom)}</span>
        <button
          aria-label="Zoom in milestones"
          className="icon-button task-queue-zoom-button milestones-zoom-button"
          disabled={milestoneZoom >= MILESTONE_ZOOM_MAX}
          onClick={() => setMilestoneZoom((current) => clampMilestoneZoom(current + MILESTONE_ZOOM_STEP))}
          title="Zoom in milestones"
          type="button"
        >
          <IconSearchPlus />
        </button>
      </div>

    </div>
  );
}
