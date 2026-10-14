import { WEEKDAY_LABELS } from "./taskCalendarLayout";
import { formatLocalDate } from "@/lib/dateUtils";
import { canOpenTaskCalendarEvent, type TaskCalendarEvent } from "./taskCalendarEvents";

interface TaskCalendarMonthGridProps {
  eventsByDateKey: Map<string, TaskCalendarEvent[]>;
  monthCells: Date[];
  onOpenDay: (dateKey: string) => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
  onMoveFocus: (dateKey: string, days: -7 | -1 | 1 | 7) => void;
  eventCapacity: number;
  activeDateKey: string;
  selectedDateKey: string | null;
  todayDateKey: string;
  dayRef?: (dateKey: string, element: HTMLElement | null) => void;
}

function eventTypeClassName(event: TaskCalendarEvent) {
  return `task-calendar-day-event-${event.extendedProps.type}`;
}

function formatDayButtonLabel(dateKey: string, eventCount: number) {
  const dayLabel = new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const itemLabel = eventCount === 1 ? "item" : "items";
  return `View details for ${dayLabel} with ${eventCount} ${itemLabel}`;
}

export function TaskCalendarMonthGrid({
  eventsByDateKey,
  monthCells,
  onOpenDay,
  onOpenEvent,
  onMoveFocus,
  eventCapacity,
  activeDateKey,
  selectedDateKey,
  todayDateKey,
  dayRef,
}: TaskCalendarMonthGridProps) {
  return (
    <>
      <div aria-label="Calendar dates" className="task-calendar-grid" role="grid">
        <div className="task-calendar-weekdays" role="rowgroup">
          <div role="row">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} role="columnheader">{label}</span>
            ))}
          </div>
        </div>
        {Array.from({ length: Math.ceil(monthCells.length / 7) }, (_, weekIndex) => {
          const weekDates = monthCells.slice(weekIndex * 7, weekIndex * 7 + 7);
          return (
            <div className="task-calendar-week" key={formatLocalDate(weekDates[0])} role="row">
              {weekDates.map((cellDate) => {
                const cellDateKey = formatLocalDate(cellDate);
                const cellEvents = eventsByDateKey.get(cellDateKey) ?? [];
                const hasOverflow = cellEvents.length > eventCapacity;
                const visibleEvents = cellEvents.slice(0, hasOverflow ? Math.max(0, eventCapacity - 1) : eventCapacity);
                const hiddenEventCount = Math.max(0, cellEvents.length - visibleEvents.length);
                const isSelected = cellDateKey === selectedDateKey;
                const isToday = cellDateKey === todayDateKey;
                const startsMonth = cellDate.getDate() === 1;
                const isEvenMonth = cellDate.getMonth() % 2 === 1;
                const dayClassName = [
                  "task-calendar-day",
                  isEvenMonth ? "is-even-month" : "",
                  isSelected ? "is-selected" : "",
                  isToday ? "is-today" : "",
                  hasOverflow ? "has-overflow" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const dayButtonLabel = formatDayButtonLabel(cellDateKey, cellEvents.length);

                return (
                  <article
                    className={dayClassName}
                    data-date={cellDateKey}
                    key={cellDateKey}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${new Date(`${cellDateKey}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${cellEvents.length ? `, ${cellEvents.length} schedule items` : ""}`}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      const days = event.key === "ArrowLeft" ? -1
                        : event.key === "ArrowRight" ? 1
                          : event.key === "ArrowUp" ? -7
                            : event.key === "ArrowDown" ? 7
                              : null;
                      if (days === null) return;
                      event.preventDefault();
                      onMoveFocus(cellDateKey, days);
                    }}
                    ref={(element) => dayRef?.(cellDateKey, element)}
                    role="gridcell"
                    tabIndex={cellDateKey === activeDateKey ? 0 : -1}
                    onClick={hasOverflow ? () => onOpenDay(cellDateKey) : undefined}
                  >
                    <header className="task-calendar-day-header">
                      {startsMonth ? (
                        <strong className="task-calendar-month-label">
                          {cellDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                        </strong>
                      ) : null}
                      {hasOverflow ? <button
                        aria-describedby={`${cellDateKey}-details`}
                        className="task-calendar-day-open"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenDay(cellDateKey);
                        }}
                        type="button"
                      >
                        <span>{cellDate.getDate()}</span>
                        {cellEvents.length > 0 ? <small>{cellEvents.length}</small> : null}
                        <span className="visually-hidden" id={`${cellDateKey}-details`}>{dayButtonLabel}</span>
                      </button> : <span className="task-calendar-day-number">{cellDate.getDate()}</span>}
                    </header>

                    <div className="task-calendar-day-events">
                      {visibleEvents.map((event) => {
                        const className = `task-calendar-day-event ${eventTypeClassName(event)}`;
                        return canOpenTaskCalendarEvent(event) ? (
                          <button
                            aria-label={`Open ${event.title}`}
                            className={className}
                            key={event.id}
                            onClick={(click) => {
                              click.stopPropagation();
                              onOpenEvent(event);
                            }}
                            title={event.title}
                            type="button"
                          >{event.title}</button>
                        ) : (
                          <div className={className} key={event.id} title={event.title}>{event.title}</div>
                        );
                      })}
                      {hiddenEventCount > 0 ? (
                        <button
                          aria-label={dayButtonLabel}
                          className="task-calendar-more"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenDay(cellDateKey);
                          }}
                          type="button"
                        >+{hiddenEventCount} more</button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
