import {
  formatDateKey,
  WEEKDAY_LABELS,
} from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";

interface TaskCalendarMonthGridProps {
  eventsByDateKey: Map<string, TaskCalendarEvent[]>;
  monthCells: Date[];
  monthCursor: Date;
  onOpenDay: (dateKey: string) => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
  selectedDateKey: string | null;
  todayDateKey: string;
}

function eventTypeClassName(event: TaskCalendarEvent) {
  return `task-calendar-day-event-${event.extendedProps.type}`;
}

function canOpenEventDirectly(event: TaskCalendarEvent) {
  return event.extendedProps.type === "milestone" ||
    event.extendedProps.type === "task-due" ||
    event.extendedProps.type === "qa-due";
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
  monthCursor,
  onOpenDay,
  onOpenEvent,
  selectedDateKey,
  todayDateKey,
}: TaskCalendarMonthGridProps) {
  return (
    <>
      <div className="task-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="task-calendar-grid">
        {monthCells.map((cellDate) => {
          const cellDateKey = formatDateKey(cellDate);
          const cellEvents = eventsByDateKey.get(cellDateKey) ?? [];
          const visibleEvents = cellEvents.slice(0, 4);
          const hiddenEventCount = Math.max(0, cellEvents.length - visibleEvents.length);
          const isCurrentMonth = cellDate.getMonth() === monthCursor.getMonth();
          const isSelected = cellDateKey === selectedDateKey;
          const isToday = cellDateKey === todayDateKey;
          const dayClassName = [
            "task-calendar-day",
            isCurrentMonth ? "" : "is-outside-month",
            isSelected ? "is-selected" : "",
            isToday ? "is-today" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const dayButtonLabel = formatDayButtonLabel(cellDateKey, cellEvents.length);

          return (
            <article
              className={dayClassName}
              key={cellDateKey}
              onClick={() => onOpenDay(cellDateKey)}
            >
              <header className="task-calendar-day-header">
                <button
                  aria-label={dayButtonLabel}
                  className="task-calendar-day-open"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDay(cellDateKey);
                  }}
                  type="button"
                >
                  <span>{cellDate.getDate()}</span>
                  {cellEvents.length > 0 ? (
                    <small>{cellEvents.length}</small>
                  ) : null}
                </button>
              </header>

              <div className="task-calendar-day-events">
                {visibleEvents.map((event) => (
                  <button
                    className={`task-calendar-day-event ${eventTypeClassName(event)}`}
                    key={event.id}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      if (canOpenEventDirectly(event)) {
                        onOpenEvent(event);
                        return;
                      }
                      onOpenDay(cellDateKey);
                    }}
                    title={event.title}
                    type="button"
                  >
                    {event.title}
                  </button>
                ))}
                {hiddenEventCount > 0 ? (
                  <small className="task-calendar-more">+{hiddenEventCount} more</small>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
