import React from "react";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { formatTimelineZoomLabel, TIMELINE_ZOOM_MAX } from "@/features/workspace/shared/timeline/timelineZoom";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { WorkspaceTopbarZoom } from "@/features/workspace/shared/topbar";
import { TimelineCompactFilterMenu } from "./components/TimelineCompactFilterMenu";
import { TimelineCalendarSortMenu } from "./components/TimelineCalendarSortMenu";

const TIMELINE_INTERVAL_OPTIONS: Array<{ id: TimelineViewInterval; label: string; shortLabel: string }> = [
  { id: "all", label: "All", shortLabel: "A" },
  { id: "month", label: "Month", shortLabel: "M" },
  { id: "week", label: "Week", shortLabel: "W" },
];

interface TimelineToolbarProps {
  activeFilterCount: number;
  calendarEventFilter: "all" | TaskCalendarEventType;
  calendarSortMode: TaskCalendarSortMode;
  showCalendarFilters: boolean;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplineFilterOptions: DropdownOption[];
  isAllProjectsView: boolean;
  onAdjustZoom: (direction: 1 | -1) => void;
  onChangePersonFilter: (value: FilterSelection) => void;
  onCalendarEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  onCalendarSortModeChange: (value: TaskCalendarSortMode) => void;
  onIntervalChange: (value: TimelineViewInterval) => void;
  onSearchChange: (value: string) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  searchFilter: string;
  setDisciplineFilter: (value: FilterSelection) => void;
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
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activeFilterCount,
  calendarEventFilter,
  calendarSortMode,
  showCalendarFilters,
  activePersonFilter,
  bootstrap,
  disciplineFilter,
  disciplineFilterOptions,
  isAllProjectsView,
  onAdjustZoom,
  onChangePersonFilter,
  onCalendarEventFilterChange,
  onCalendarSortModeChange,
  onIntervalChange,
  onSearchChange,
  onShiftPeriod,
  priorityFilter,
  projectFilter,
  searchFilter,
  setDisciplineFilter,
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
}) => {
  const [isIntervalSwitchExpanded, setIsIntervalSwitchExpanded] = React.useState(false);
  const intervalSwitchRef = React.useRef<HTMLDivElement>(null);
  const shouldFocusIntervalOptionRef = React.useRef(false);
  const suppressBlurCloseRef = React.useRef(false);
  const activeIntervalOption = TIMELINE_INTERVAL_OPTIONS.find((option) => option.id === viewInterval) ?? TIMELINE_INTERVAL_OPTIONS[0];
  const closeIntervalSwitch = () => {
    suppressBlurCloseRef.current = false;
    shouldFocusIntervalOptionRef.current = false;
    setIsIntervalSwitchExpanded(false);
  };
  const openIntervalSwitch = ({ focusOptions = false }: { focusOptions?: boolean } = {}) => {
    if (focusOptions) {
      shouldFocusIntervalOptionRef.current = true;
      suppressBlurCloseRef.current = true;
    }

    setIsIntervalSwitchExpanded(true);
  };
  React.useEffect(() => {
    if (!isIntervalSwitchExpanded || !shouldFocusIntervalOptionRef.current) {
      return;
    }

    shouldFocusIntervalOptionRef.current = false;
    suppressBlurCloseRef.current = false;
    const root = intervalSwitchRef.current;
    if (!root) {
      return;
    }

    const nextFocusTarget =
      root.querySelector<HTMLButtonElement>(".timeline-interval-toggle-option.is-active") ??
      root.querySelector<HTMLButtonElement>(".timeline-interval-toggle-option");
    nextFocusTarget?.focus();
  }, [isIntervalSwitchExpanded, viewInterval]);

  const handleIntervalSwitchBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (suppressBlurCloseRef.current) {
      return;
    }

    const nextFocusedElement = event.relatedTarget;
    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    closeIntervalSwitch();
  };
  const handleIntervalSwitchPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      openIntervalSwitch();
    }
  };
  const handleIntervalSwitchFocusCapture = () => {
    if (!isIntervalSwitchExpanded) {
      openIntervalSwitch({ focusOptions: true });
    }
  };
  const handleIntervalPillKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      openIntervalSwitch({ focusOptions: true });
    }
  };

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
              disciplineFilter={disciplineFilter}
              disciplineFilterOptions={disciplineFilterOptions}
              isAllProjectsView={isAllProjectsView}
              onChangePersonFilter={onChangePersonFilter}
              onCalendarEventFilterChange={onCalendarEventFilterChange}
              priorityFilter={priorityFilter}
              projectFilter={projectFilter}
              setDisciplineFilter={setDisciplineFilter}
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
        <div
          aria-label="Timeline interval"
          className={`timeline-interval-switch${isIntervalSwitchExpanded ? " is-expanded" : ""}`}
          ref={intervalSwitchRef}
          onBlurCapture={handleIntervalSwitchBlur}
          onMouseEnter={() => openIntervalSwitch()}
          onMouseLeave={closeIntervalSwitch}
          onFocusCapture={handleIntervalSwitchFocusCapture}
          onPointerDownCapture={handleIntervalSwitchPointerDown}
          role="group"
        >
          {isIntervalSwitchExpanded ? (
            <div
              aria-label="Timeline interval options"
              className="timeline-interval-toggle-rail"
              data-tutorial-target="timeline-interval-select"
            >
              {TIMELINE_INTERVAL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  aria-label={`Set timeline interval to ${option.label}`}
                  aria-pressed={viewInterval === option.id}
                  className={`timeline-interval-toggle-option${viewInterval === option.id ? " is-active" : ""}`}
                  onClick={() => {
                    onIntervalChange(option.id);
                    closeIntervalSwitch();
                  }}
                  title={option.label}
                  type="button"
                >
                  {option.shortLabel}
                </button>
              ))}
            </div>
          ) : (
            <button
              aria-label={`Timeline interval: ${activeIntervalOption.label}`}
              className="timeline-interval-pill"
              data-tutorial-target="timeline-interval-select"
              onClick={() => openIntervalSwitch({ focusOptions: true })}
              onKeyDown={handleIntervalPillKeyDown}
              title={`Timeline interval: ${activeIntervalOption.label}`}
              type="button"
            >
              <span className="timeline-interval-pill-icon">
                <IconCalendar />
              </span>
              <span className="timeline-interval-pill-label">{activeIntervalOption.label}</span>
            </button>
          )}
        </div>
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
