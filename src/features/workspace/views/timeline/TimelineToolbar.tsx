import React from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { formatTimelineZoomLabel, TIMELINE_ZOOM_MAX } from "@/features/workspace/shared/timeline/timelineZoom";
import { localTodayDate, type TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { SchedulePeriodControls } from "@/features/workspace/views/taskCalendar/SchedulePeriodControls";
import { WorkspaceTopbarZoom } from "@/features/workspace/shared/topbar";
import { TimelineCompactFilterMenu } from "./components/TimelineCompactFilterMenu";
import { TimelineCalendarSortMenu } from "./components/TimelineCalendarSortMenu";

interface TimelineToolbarProps {
  activeFilterCount: number;
  calendarEventFilter: "all" | TaskCalendarEventType;
  calendarSortMode: TaskCalendarSortMode;
  calendarSortDirection: "asc" | "desc";
  showCalendarFilters: boolean;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  workTypeFilter: FilterSelection;
  workTypeFilterOptions: DropdownOption[];
  isAllProjectsView: boolean;
  onAdjustZoom: (direction: 1 | -1) => void;
  onChangePersonFilter: (value: FilterSelection) => void;
  onCalendarEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  onCalendarSortModeChange: (value: TaskCalendarSortMode) => void;
  onCalendarSortDirectionChange: (value: "asc" | "desc") => void;
  onIntervalChange: (value: TimelineViewInterval) => void;
  onSearchChange: (value: string) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  searchFilter: string;
  setWorkTypeFilter: (value: FilterSelection) => void;
  setPriorityFilter: (value: FilterSelection) => void;
  setProjectFilter: (value: FilterSelection) => void;
  setStatusFilter: (value: FilterSelection) => void;
  setSubsystemFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  timelinePeriodLabel: string;
  timelineZoom: number;
  timelineZoomMin: number;
  viewInterval: TimelineViewInterval;
  onViewAnchorDateChange: (value: string) => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeFilterCount,
  calendarEventFilter,
  calendarSortMode,
  calendarSortDirection,
  showCalendarFilters,
  activePersonFilter,
  bootstrap,
  workTypeFilter,
  workTypeFilterOptions,
  isAllProjectsView,
  onAdjustZoom,
  onChangePersonFilter,
  onCalendarEventFilterChange,
  onCalendarSortModeChange,
  onCalendarSortDirectionChange,
  onIntervalChange,
  onSearchChange,
  onShiftPeriod,
  priorityFilter,
  projectFilter,
  searchFilter,
  setWorkTypeFilter,
  setPriorityFilter,
  setProjectFilter,
  setStatusFilter,
  setSubsystemFilter,
  statusFilter,
  subsystemFilter,
  subsystemFilterOptions,
  timelinePeriodLabel,
  timelineZoom,
  timelineZoomMin,
  viewInterval,
  onViewAnchorDateChange,
}) => {
  return (
    <div className="panel-actions filter-toolbar timeline-toolbar timeline-topbar-controls">
      <TopbarResponsiveSearch
        actionCount={showCalendarFilters ? 2 : 1}
        actions={
          <>
            <TimelineCompactFilterMenu
              activeFilterCount={activeFilterCount}
              calendarEventFilter={calendarEventFilter}
              showCalendarFilters={showCalendarFilters}
              activePersonFilter={activePersonFilter}
              bootstrap={bootstrap}
              workTypeFilter={workTypeFilter}
              workTypeFilterOptions={workTypeFilterOptions}
              isAllProjectsView={isAllProjectsView}
              onChangePersonFilter={onChangePersonFilter}
              onCalendarEventFilterChange={onCalendarEventFilterChange}
              priorityFilter={priorityFilter}
              projectFilter={projectFilter}
              setWorkTypeFilter={setWorkTypeFilter}
              setPriorityFilter={setPriorityFilter}
              setProjectFilter={setProjectFilter}
              setStatusFilter={setStatusFilter}
              setSubsystemFilter={setSubsystemFilter}
              statusFilter={statusFilter}
              subsystemFilter={subsystemFilter}
              subsystemFilterOptions={subsystemFilterOptions}
            />
            {showCalendarFilters ? (
              <TimelineCalendarSortMenu
                onChange={onCalendarSortModeChange}
                direction={calendarSortDirection}
                onDirectionChange={onCalendarSortDirectionChange}
                sortMode={calendarSortMode}
              />
            ) : null}
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
        onToday={() => onViewAnchorDateChange(localTodayDate())}
        periodLabel={timelinePeriodLabel}
        presentation="timeline"
        range={viewInterval}
      />
      <WorkspaceTopbarZoom
        ariaLabel="Timeline zoom"
        canZoomIn={timelineZoom < TIMELINE_ZOOM_MAX}
        canZoomOut={timelineZoom > timelineZoomMin}
        decreaseLabel="Zoom out timeline"
        increaseLabel="Zoom in timeline"
        onZoomIn={() => onAdjustZoom(1)}
        onZoomOut={() => onAdjustZoom(-1)}
        value={formatTimelineZoomLabel(timelineZoom)}
      />
    </div>
  );
};
