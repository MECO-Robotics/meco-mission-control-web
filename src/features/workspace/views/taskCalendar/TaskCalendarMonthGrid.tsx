import { WEEKDAY_LABELS } from "./taskCalendarLayout";
import { formatLocalDate } from "@/lib/dateUtils";
import type { TaskCalendarEvent } from "./taskCalendarEvents";
import { TaskCalendarDayDetails } from "./TaskCalendarDayDetails";

interface TaskCalendarMonthGridProps {
  eventsByDateKey: Map<string, TaskCalendarEvent[]>;
  monthCells: Date[];
  onOpenDay: (dateKey: string) => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
  selectedDateKey: string | null;
  todayDateKey: string;
  dayRef?: (dateKey: string, element: HTMLElement | null) => void;
  onCloseSelectedDay: () => void;
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
  selectedDateKey,
  todayDateKey,
  dayRef,
  onCloseSelectedDay,
}: TaskCalendarMonthGridProps) {
  return (
    <>
      <div aria-hidden="true" className="task-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="task-calendar-grid">
        {Array.from({ length: Math.ceil(monthCells.length / 7) }, (_, weekIndex) => {
          const weekDates = monthCells.slice(weekIndex * 7, weekIndex * 7 + 7);
          const hasSelectedDate = weekDates.some((date) => formatLocalDate(date) === selectedDateKey);
          return (
            <div className="task-calendar-week" key={formatLocalDate(weekDates[0])}>
              {weekDates.map((cellDate) => {
                const cellDateKey = formatLocalDate(cellDate);
                const cellEvents = eventsByDateKey.get(cellDateKey) ?? [];
                const visibleEvents = cellEvents.slice(0, 4);
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
                ]
                  .filter(Boolean)
                  .join(" ");
                const dayButtonLabel = formatDayButtonLabel(cellDateKey, cellEvents.length);

                return (
                  <article
                    className={dayClassName}
                    data-date={cellDateKey}
                    key={cellDateKey}
                    ref={(element) => dayRef?.(cellDateKey, element)}
                    onClick={() => onOpenDay(cellDateKey)}
                  >
                    <header className="task-calendar-day-header">
                      {startsMonth ? (
                        <strong className="task-calendar-month-label">
                          {cellDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                        </strong>
                      ) : null}
                      <button
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
                      </button>
                    </header>

                    <div className="task-calendar-day-events">
                      {visibleEvents.map((event) => (
                        <div
                          className={`task-calendar-day-event ${eventTypeClassName(event)}`}
                          key={event.id}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {hiddenEventCount > 0 ? (
                        <small className="task-calendar-more">+{hiddenEventCount} more</small>
                      ) : null}
                    </div>
                  </article>
                );
              })}
              {hasSelectedDate && selectedDateKey ? (
                <TaskCalendarDayDetails
                  dateKey={selectedDateKey}
                  events={eventsByDateKey.get(selectedDateKey) ?? []}
                  onClose={onCloseSelectedDay}
                  onOpenEvent={onOpenEvent}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
