import { IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { ScheduleRangeSelector, type SchedulePresentation } from "./ScheduleRangeSelector";

export function SchedulePeriodControls({
  onRangeChange,
  onShiftPeriod,
  onToday,
  periodLabel,
  presentation,
  range,
}: {
  onRangeChange?: (value: TimelineViewInterval) => void;
  onShiftPeriod: (direction: -1 | 1) => void;
  onToday: () => void;
  periodLabel: string;
  presentation: SchedulePresentation;
  range: TimelineViewInterval;
}) {
  const isTimeline = presentation === "timeline";
  const showsPeriodNavigation = !isTimeline || range !== "all";
  const periodUnit = isTimeline && range === "week" ? "week" : "month";

  return (
    <div
      aria-label={presentation === "timeline" ? "Timeline period controls" : `${presentation} period controls`}
      className={`timeline-period-controls${isTimeline && range === "week" ? " is-week" : ""}${isTimeline && range === "all" ? " is-all" : ""}`}
    >
      <ScheduleRangeSelector
        onChange={onRangeChange}
        presentation={presentation}
        value={range}
      />
      {showsPeriodNavigation ? (
        <>
          <span aria-hidden="true" className="timeline-period-divider" />
          <button
            aria-label={`Previous ${periodUnit}`}
            className="icon-button timeline-period-button"
            data-tutorial-target={isTimeline ? "timeline-period-prev-button" : undefined}
            onClick={() => onShiftPeriod(-1)}
            title={`Previous ${periodUnit}`}
            type="button"
          >
            <IconChevronLeft />
          </button>
          <span className="timeline-period-label">{periodLabel}</span>
          <button
            aria-label={`Next ${periodUnit}`}
            className="icon-button timeline-period-button"
            data-tutorial-target={isTimeline ? "timeline-period-next-button" : undefined}
            onClick={() => onShiftPeriod(1)}
            title={`Next ${periodUnit}`}
            type="button"
          >
            <IconChevronRight />
          </button>
        </>
      ) : null}
      <button
        aria-label="Go to today"
        className="schedule-today-button"
        onClick={onToday}
        title="Today"
        type="button"
      >
        Today
      </button>
    </div>
  );
}
