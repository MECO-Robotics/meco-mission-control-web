import type { TaskCalendarEvent } from "./taskCalendarEvents";
import type { groupTaskCalendarEventsByMonth } from "./taskCalendarLayout";

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

        return (
          <section aria-label={monthLabel} className="schedule-agenda-month" key={monthKey}>
            <h2>{monthLabel}</h2>
            <ol className="schedule-agenda-list">
              {events.map((event) => {
                const canOpen = ["milestone", "task-due", "qa-due"].includes(event.extendedProps.type);
                const date = new Date(event.start);
                const dateLabel = date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeLabel = date.toString() !== "Invalid Date" && event.start.includes("T")
                  ? ` · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                  : "";

                return (
                  <li key={event.id}>
                    <time dateTime={event.start}>{dateLabel}{timeLabel}</time>
                    {canOpen ? (
                      <button className="task-calendar-day-details-title" onClick={() => onOpenEvent(event)} type="button">
                        {event.title}
                      </button>
                    ) : <span>{event.title}</span>}
                    <small>{event.extendedProps.type.replaceAll("-", " ")}{event.extendedProps.status ? ` · ${event.extendedProps.status}` : ""}</small>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
