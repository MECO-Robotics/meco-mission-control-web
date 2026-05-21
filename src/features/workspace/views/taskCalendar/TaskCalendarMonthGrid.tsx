import {
  formatDateKey,
  WEEKDAY_LABELS,
} from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";

interface TaskCalendarMonthGridProps {
  eventsByDateKey: Map<string, TaskCalendarEvent[]>;
  monthCells: Date[];
  monthCursor: Date;
  onOpenEvent: (event: TaskCalendarEvent) => void;
  todayDateKey: string;
}

function eventTypeClassName(event: TaskCalendarEvent) {
  return `task-calendar-day-event-${event.extendedProps.type}`;
}

export function TaskCalendarMonthGrid({
  eventsByDateKey,
  monthCells,
  monthCursor,
  onOpenEvent,
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
          const isToday = cellDateKey === todayDateKey;

          return (
            <article
              className={`task-calendar-day${isCurrentMonth ? "" : " is-outside-month"}${isToday ? " is-today" : ""}`}
              key={cellDateKey}
            >
              <header className="task-calendar-day-header">
                <span>{cellDate.getDate()}</span>
              </header>

              <div className="task-calendar-day-events">
                {visibleEvents.map((event) => (
                  <button
                    className={`task-calendar-day-event ${eventTypeClassName(event)}`}
                    key={event.id}
                    onClick={() => onOpenEvent(event)}
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
