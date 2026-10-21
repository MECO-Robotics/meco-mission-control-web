import React from "react";
import { Settings2 } from "lucide-react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { formatTimelineZoomLabel, TIMELINE_ZOOM_MAX, TIMELINE_ZOOM_MIN } from "@/features/workspace/shared/timeline/timelineZoom";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { SchedulePeriodControls } from "@/features/workspace/views/taskCalendar/SchedulePeriodControls";
import { WorkspaceTopbarZoomControls } from "@/features/workspace/shared/ui/WorkspaceTopbarZoomControls";
import { TimelineCompactFilterMenu } from "./components/TimelineCompactFilterMenu";

interface TimelineToolbarProps {
  activeFilterCount: number;
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
  onFit: () => void;
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
  showAgenda: boolean;
  onShowAgendaChange: (value: boolean) => void;
  isPhone: boolean;
  onOpenAgenda: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeFilterCount,
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
  onFit,
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
  showAgenda,
  onShowAgendaChange,
  isPhone,
  onOpenAgenda,
}) => (
  <div className="panel-actions filter-toolbar timeline-toolbar timeline-topbar-controls">
    <TopbarResponsiveSearch
      actionCount={1}
      actions={
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
    <button className="schedule-today-button" onClick={onFit} title="Fit period to timeline width" type="button">
      Fit
    </button>
    <CompactFilterMenu
      className="schedule-view-menu"
      ariaLabel="Schedule view options"
      buttonLabel="View"
      icon={<Settings2 size={14} />}
      items={[
        {
          label: "Agenda",
          content: isPhone ? <button className="secondary-action" onClick={onOpenAgenda} type="button">Open agenda</button> : (
            <label className="schedule-desktop-view-option">
              <input checked={showAgenda} onChange={(event) => onShowAgendaChange(event.target.checked)} type="checkbox" />
              Show beside timeline
            </label>
          ),
        },
        {
          label: "Timeline zoom",
          content: (
            <WorkspaceTopbarZoomControls
              ariaLabel="Timeline zoom"
              canZoomIn={timelineZoom < TIMELINE_ZOOM_MAX}
              canZoomOut={timelineZoom > TIMELINE_ZOOM_MIN}
              decreaseLabel="Zoom out timeline"
              increaseLabel="Zoom in timeline"
              onZoomIn={() => onAdjustZoom(1)}
              onZoomOut={() => onAdjustZoom(-1)}
              value={formatTimelineZoomLabel(timelineZoom)}
            />
          ),
        },
      ]}
    />
  </div>
);
