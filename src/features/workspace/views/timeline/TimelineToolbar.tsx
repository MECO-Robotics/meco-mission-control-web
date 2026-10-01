import React from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { formatTimelineZoomLabel, TIMELINE_ZOOM_MAX } from "@/features/workspace/shared/timeline/timelineZoom";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { SchedulePresentationSelector, type SchedulePresentation } from "@/features/workspace/views/taskCalendar/SchedulePresentationSelector";
import { ScheduleDateSelector } from "@/features/workspace/views/taskCalendar/ScheduleDateSelector";
import { SegmentedSelector, WorkspaceTopbarZoom } from "@/features/workspace/shared/topbar";
import { TimelineCompactFilterMenu } from "./components/TimelineCompactFilterMenu";
import { TimelineCalendarSortMenu } from "./components/TimelineCalendarSortMenu";

const TIMELINE_INTERVAL_OPTIONS: Array<{ id: TimelineViewInterval; label: string }> = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
];

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
  viewAnchorDate: string;
  onViewAnchorDateChange: (value: string) => void;
  onSchedulePresentationChange?: (value: SchedulePresentation) => void;
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
  viewAnchorDate,
  onViewAnchorDateChange,
  onSchedulePresentationChange,
}) => {
  return (
    <div className="panel-actions filter-toolbar timeline-toolbar timeline-topbar-controls">
      {onSchedulePresentationChange ? <SchedulePresentationSelector value="timeline" onChange={onSchedulePresentationChange} /> : null}
      <ScheduleDateSelector value={viewAnchorDate} onChange={onViewAnchorDateChange} />
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
      <div
        aria-label={viewInterval === "all" ? "Timeline view controls" : "Timeline period controls"}
        className={`timeline-period-controls${viewInterval === "week" ? " is-week" : ""}${viewInterval === "all" ? " is-all" : ""}`}
      >
        <SegmentedSelector
          ariaLabel="Timeline interval"
          dataTutorialTarget="timeline-interval-select"
          onChange={onIntervalChange}
          options={TIMELINE_INTERVAL_OPTIONS}
          value={viewInterval}
        />
        {viewInterval !== "all" ? (
          <>
            <span aria-hidden="true" className="timeline-period-divider" />
            <button
              aria-label={`Previous ${viewInterval}`}
              className="icon-button timeline-period-button"
              data-tutorial-target="timeline-period-prev-button"
              onClick={() => onShiftPeriod(-1)}
              title={`Previous ${viewInterval}`}
              type="button"
            >
              <IconChevronLeft />
            </button>
            <span className="timeline-period-label">{timelinePeriodLabel}</span>
            <button
              aria-label={`Next ${viewInterval}`}
              className="icon-button timeline-period-button"
              data-tutorial-target="timeline-period-next-button"
              onClick={() => onShiftPeriod(1)}
              title={`Next ${viewInterval}`}
              type="button"
            >
              <IconChevronRight />
            </button>
          </>
        ) : null}
      </div>
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
