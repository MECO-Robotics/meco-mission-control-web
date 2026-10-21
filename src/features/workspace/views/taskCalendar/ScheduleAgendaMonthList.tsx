import { canOpenTaskCalendarEvent, type TaskCalendarEvent } from "./taskCalendarEvents";
import { toEventDateKey, type groupTaskCalendarEventsByMonth } from "./taskCalendarLayout";

export function ScheduleAgendaMonthList({
  groups,
  onOpenEvent,
}: {
  groups: ReturnType<typeof groupTaskCalendarEventsByMonth>;
  onOpenEvent: (event: TaskCalendarEvent) => void;
}) {
  return (
    <div aria-label="Schedule agenda by month" className="schedule-agenda-months" role="region">
      {groups.map(({ monthKey, events }) => {
        const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });

        const days = new Map<string, TaskCalendarEvent[]>();
        for (const event of events) {
          const day = toEventDateKey(event.start);
          const entries = days.get(day);
          if (entries) entries.push(event);
          else days.set(day, [event]);
        }

        return (
          <section aria-label={monthLabel} className="schedule-agenda-month" key={monthKey}>
            <h2>{monthLabel}</h2>
            {Array.from(days, ([day, dayEvents]) => (
              <div className="schedule-agenda-day" key={day}>
                <h3><time dateTime={day}>{new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</time></h3>
                <ol className="schedule-agenda-list">
                  {dayEvents.map((event) => {
                    const canOpen = canOpenTaskCalendarEvent(event);
                    const date = new Date(event.start.slice(0, 19));
                    const zone = event.start.match(/(Z|[+-]\d{2}:?\d{2})$/)?.[1];
                    const zoneLabel = zone === "Z" ? " UTC" : zone ? ` UTC${zone}` : "";
                    const timeLabel = event.start.includes("T") && !Number.isNaN(date.getTime())
                      ? `${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}${zoneLabel}`
                      : null;
                    return (
                      <li key={event.id}>
                        {canOpen ? (
                          <button className="task-calendar-day-details-title" onClick={() => onOpenEvent(event)} type="button">
                            {event.title}
                          </button>
                        ) : <span className="task-calendar-day-details-title">{event.title}</span>}
                        <small>
                          {timeLabel && <><time dateTime={event.start}>{timeLabel}</time>{" · "}</>}
                          {event.extendedProps.type.replaceAll("-", " ")}{event.extendedProps.status ? ` · ${event.extendedProps.status.replaceAll("-", " ")}` : ""}
                        </small>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
