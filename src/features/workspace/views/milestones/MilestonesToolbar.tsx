import type { Dispatch, SetStateAction } from "react";

import { IconParts, IconSort, IconTasks } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneType } from "@/types/common";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
import {
  clampMilestoneZoom,
  formatMilestoneZoomLabel,
  MILESTONE_ZOOM_MAX,
  MILESTONE_ZOOM_MIN,
  MILESTONE_ZOOM_STEP,
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
  setMilestoneZoom: Dispatch<SetStateAction<number>>;
  setSortField: Dispatch<SetStateAction<MilestoneSortField>>;
  setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  setTypeFilter: Dispatch<SetStateAction<FilterSelection>>;
  milestoneZoom: number;
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
        className="task-queue-sort-menu"
        icon={<IconSort />}
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
              <select
                aria-label="Sort direction"
                className="task-queue-sort-menu-select"
                onChange={(milestone) => setSortOrder(milestone.target.value as "asc" | "desc")}
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

      <div aria-label="Milestones zoom" className="task-queue-zoom-controls" role="group">
        <button
          aria-label="Zoom out milestones"
          className="icon-button task-queue-zoom-button"
          disabled={milestoneZoom <= MILESTONE_ZOOM_MIN}
          onClick={() => setMilestoneZoom((current) => clampMilestoneZoom(current - MILESTONE_ZOOM_STEP))}
          title="Zoom out milestones"
          type="button"
        >
          -
        </button>
        <span className="task-queue-zoom-label">{formatMilestoneZoomLabel(milestoneZoom)}</span>
        <button
          aria-label="Zoom in milestones"
          className="icon-button task-queue-zoom-button"
          disabled={milestoneZoom >= MILESTONE_ZOOM_MAX}
          onClick={() => setMilestoneZoom((current) => clampMilestoneZoom(current + MILESTONE_ZOOM_STEP))}
          title="Zoom in milestones"
          type="button"
        >
          +
        </button>
      </div>

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
