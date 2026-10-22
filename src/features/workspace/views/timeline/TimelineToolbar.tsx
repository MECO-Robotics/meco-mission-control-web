import React from "react";
import { ArrowDownUp } from "lucide-react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { formatTimelineZoomLabel, TIMELINE_ZOOM_MAX, TIMELINE_ZOOM_MIN } from "@/features/workspace/shared/timeline/timelineZoom";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { SchedulePeriodControls } from "@/features/workspace/views/taskCalendar/SchedulePeriodControls";
import { WorkspaceTopbarZoom } from "@/features/workspace/shared/topbar";
import { TimelineCompactFilterMenu } from "./components/TimelineCompactFilterMenu";
import type { GroupBy } from "./model/productTimelineModel";

interface TimelineToolbarProps {
  activeFilterCount: number;
  groupBy: GroupBy;
  onGroupByChange: (value: GroupBy) => void;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  workTypeFilter: FilterSelection;
  workTypeFilterOptions: DropdownOption[];
  isAllProjectsView: boolean;
  onAdjustZoom: (direction: 1 | -1) => void;
  onChangePersonFilter: (value: FilterSelection) => void;
  onIntervalChange: (value: TimelineViewInterval) => void;
  onSearchChange: (value: string) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  onToday: () => void;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  responsibleGroupFilter: FilterSelection;
  searchFilter: string;
  setWorkTypeFilter: (value: FilterSelection) => void;
  setPriorityFilter: (value: FilterSelection) => void;
  setProjectFilter: (value: FilterSelection) => void;
  setResponsibleGroupFilter: (value: FilterSelection) => void;
  setStatusFilter: (value: FilterSelection) => void;
  setSubsystemFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  timelinePeriodLabel: string;
  timelineZoom: number;
  viewInterval: TimelineViewInterval;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeFilterCount,
  groupBy,
  onGroupByChange,
  activePersonFilter,
  bootstrap,
  workTypeFilter,
  workTypeFilterOptions,
  isAllProjectsView,
  onAdjustZoom,
  onChangePersonFilter,
  onIntervalChange,
  onSearchChange,
  onShiftPeriod,
  onToday,
  priorityFilter,
  projectFilter,
  responsibleGroupFilter,
  searchFilter,
  setWorkTypeFilter,
  setPriorityFilter,
  setProjectFilter,
  setResponsibleGroupFilter,
  setStatusFilter,
  setSubsystemFilter,
  statusFilter,
  subsystemFilter,
  subsystemFilterOptions,
  timelinePeriodLabel,
  timelineZoom,
  viewInterval,
}) => (
  <div className="panel-actions filter-toolbar timeline-toolbar timeline-topbar-controls">
    <TopbarResponsiveSearch
      actionCount={2}
      actions={
        <>
          <TimelineCompactFilterMenu
            activeFilterCount={activeFilterCount}
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            workTypeFilter={workTypeFilter}
            workTypeFilterOptions={workTypeFilterOptions}
            isAllProjectsView={isAllProjectsView}
            onChangePersonFilter={onChangePersonFilter}
            priorityFilter={priorityFilter}
            projectFilter={projectFilter}
            responsibleGroupFilter={responsibleGroupFilter}
            setWorkTypeFilter={setWorkTypeFilter}
            setPriorityFilter={setPriorityFilter}
            setProjectFilter={setProjectFilter}
            setResponsibleGroupFilter={setResponsibleGroupFilter}
            setStatusFilter={setStatusFilter}
            setSubsystemFilter={setSubsystemFilter}
            statusFilter={statusFilter}
            subsystemFilter={subsystemFilter}
            subsystemFilterOptions={subsystemFilterOptions}
          />
          <CompactFilterMenu
            activeCount={0}
            ariaLabel="Sort schedule"
            buttonLabel="Sort"
            className="task-queue-sort-menu"
            icon={<ArrowDownUp size={14} />}
            iconOnly
            items={[{
              label: "Group by",
              content: <FilterDropdown
                allLabel="Group schedule by"
                ariaLabel="Group schedule by"
                className="task-queue-filter-menu-submenu"
                onChange={(selection) => onGroupByChange(selection[0] === "subsystem" ? "subsystem" : "team")}
                options={[{ id: "team", name: "Team" }, { id: "subsystem", name: "Subsystem" }]}
                showAllOption={false}
                singleSelect
                value={[groupBy]}
              />,
            }]}
          />
        </>
      }
      ariaLabel="Search schedule"
      compactPlaceholder="Search"
      compactSwitchWidth={220}
      onChange={onSearchChange}
      placeholder="Search schedule..."
      value={searchFilter}
    />
    <SchedulePeriodControls
      onRangeChange={onIntervalChange}
      onShiftPeriod={onShiftPeriod}
      onToday={onToday}
      periodLabel={timelinePeriodLabel}
      presentation="timeline"
      range={viewInterval}
    />
    <WorkspaceTopbarZoom
      ariaLabel="Timeline zoom"
      canZoomIn={timelineZoom < TIMELINE_ZOOM_MAX}
      canZoomOut={timelineZoom > TIMELINE_ZOOM_MIN}
      decreaseLabel="Zoom out timeline"
      increaseLabel="Zoom in timeline"
      onZoomIn={() => onAdjustZoom(1)}
      onZoomOut={() => onAdjustZoom(-1)}
      toolbarClassName="workspace-topbar-zoom-slot-actions"
      value={formatTimelineZoomLabel(timelineZoom)}
    />

  </div>
);
