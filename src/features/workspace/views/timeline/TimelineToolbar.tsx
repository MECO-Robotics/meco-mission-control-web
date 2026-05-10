import React from "react";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconPerson, IconSearchMinus, IconSearchPlus } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { formatTimelineZoomLabel, TIMELINE_ZOOM_MAX } from "@/features/workspace/shared/timeline/timelineZoom";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";

const TIMELINE_INTERVAL_OPTIONS: Array<{ id: TimelineViewInterval; label: string; shortLabel: string }> = [
  { id: "all", label: "All", shortLabel: "A" },
  { id: "month", label: "Month", shortLabel: "M" },
  { id: "week", label: "Week", shortLabel: "W" },
];

interface TimelineToolbarProps {
  activePersonFilter: FilterSelection;
  bootstrapMembers: BootstrapPayload["members"];
  onAdjustZoom: (direction: 1 | -1) => void;
  onChangePersonFilter: (value: FilterSelection) => void;
  onIntervalChange: (value: TimelineViewInterval) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  timelinePeriodLabel: string;
  timelineZoom: number;
  timelineZoomMin: number;
  viewInterval: TimelineViewInterval;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  activePersonFilter,
  bootstrapMembers,
  onAdjustZoom,
  onChangePersonFilter,
  onIntervalChange,
  onShiftPeriod,
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
      <CompactFilterMenu
        activeCount={activePersonFilter.length}
        ariaLabel="Timeline filters"
        buttonLabel="Filters"
        className="materials-filter-menu timeline-roster-filter"
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
        <div
          aria-label="Timeline period controls"
          className={`timeline-period-controls${viewInterval === "week" ? " is-week" : ""}`}
        >
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
          disabled={timelineZoom <= timelineZoomMin}
          onClick={() => onAdjustZoom(-1)}
          title="Zoom out timeline"
          type="button"
        >
          <IconSearchMinus />
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
          <IconSearchPlus />
        </button>
      </div>
    </div>
  );
};
