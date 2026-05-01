import React from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPerson,
  IconTasks,
} from "@/components/shared";
import type { BootstrapPayload } from "@/types";
import {
  CompactFilterMenu,
  FilterDropdown,
  type FilterSelection,
} from "@/features/workspace/shared";
import {
  formatTimelineZoomLabel,
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
} from "@/features/workspace/shared/timelineZoom";
import type { TimelineViewInterval } from "@/features/workspace/shared/timelineDateUtils";

const TIMELINE_INTERVAL_OPTIONS = [
  { id: "week", name: "Week" },
  { id: "month", name: "Month" },
];

interface TimelineToolbarProps {
  activePersonFilter: FilterSelection;
  bootstrapMembers: BootstrapPayload["members"];
  onAdjustZoom: (direction: 1 | -1) => void;
  onChangePersonFilter: (value: FilterSelection) => void;
  onCreateTask: () => void;
  onIntervalChange: (value: TimelineViewInterval) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  timelinePeriodLabel: string;
  timelineZoom: number;
  viewInterval: TimelineViewInterval;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activePersonFilter,
  bootstrapMembers,
  onAdjustZoom,
  onChangePersonFilter,
  onCreateTask,
  onIntervalChange,
  onShiftPeriod,
  timelinePeriodLabel,
  timelineZoom,
  viewInterval,
}) => {
  const timelineIntervalValue: FilterSelection = viewInterval === "all" ? [] : [viewInterval];

  return (
    <div className="panel-actions filter-toolbar timeline-toolbar">
      <div className="timeline-toolbar-filters">
        <CompactFilterMenu
          activeCount={activePersonFilter.length}
          ariaLabel="Timeline filters"
          buttonLabel="Filters"
          className="materials-filter-menu"
          items={[
            {
              label: "Roster",
              content: (
                <FilterDropdown
                  allLabel="All roster"
                  ariaLabel="Filter person"
                  className="task-queue-filter-menu-submenu"
                  icon={<IconPerson />}
                  onChange={onChangePersonFilter}
                  options={bootstrapMembers}
                  value={activePersonFilter}
                />
              ),
            },
          ]}
        />
        <FilterDropdown
          allLabel="All (recent window)"
          ariaLabel="Timeline interval"
          buttonDataTutorialTarget="timeline-interval-select"
          className="timeline-interval-filter"
          icon={<IconTasks />}
          onChange={(selection) => {
            const nextInterval = selection.length === 0 ? "all" : (selection[selection.length - 1] as TimelineViewInterval);
            onIntervalChange(nextInterval);
          }}
          options={TIMELINE_INTERVAL_OPTIONS}
          value={timelineIntervalValue}
        />
        {viewInterval !== "all" ? (
          <div aria-label="Timeline period controls" className="timeline-period-controls">
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
          </div>
        ) : null}
        <div aria-label="Timeline zoom" className="timeline-zoom-controls" role="group">
          <button
            aria-label="Zoom out timeline"
            className="icon-button timeline-zoom-button"
            disabled={timelineZoom <= TIMELINE_ZOOM_MIN}
            onClick={() => onAdjustZoom(-1)}
            title="Zoom out timeline"
            type="button"
          >
            -
          </button>
          <span className="timeline-zoom-label">{formatTimelineZoomLabel(timelineZoom)}</span>
          <button
            aria-label="Zoom in timeline"
            className="icon-button timeline-zoom-button"
            disabled={timelineZoom >= TIMELINE_ZOOM_MAX}
            onClick={() => onAdjustZoom(1)}
            title="Zoom in timeline"
            type="button"
          >
            +
          </button>
        </div>
      </div>
      <button
        className="primary-action queue-toolbar-action"
        data-tutorial-target="timeline-create-task-button"
        onClick={onCreateTask}
        title="Add to timeline"
        type="button"
      >
        Add
      </button>
    </div>
  );
};
