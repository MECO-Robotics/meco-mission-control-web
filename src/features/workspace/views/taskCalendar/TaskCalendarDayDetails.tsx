import type { TaskCalendarEvent, TaskCalendarEventType } from "./taskCalendarEvents";

interface TaskCalendarDayDetailsProps {
  dateKey: string;
  events: TaskCalendarEvent[];
  onClose: () => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
}

const EVENT_TYPE_LABELS: Record<TaskCalendarEventType, string> = {
  event: "Meeting / event",
  "manufacturing-due": "Manufacturing due",
  milestone: "Milestone",
  "qa-due": "Waiting QA",
  "task-due": "Task due",
};

function formatDayLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(start: string) {
  if (!start.includes("T")) {
    return "All day";
  }

  return new Date(start).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatItemCount(count: number) {
  return `${count} thing${count === 1 ? "" : "s"} due`;
}

function canOpenEvent(event: TaskCalendarEvent) {
  return event.extendedProps.type === "milestone" ||
    event.extendedProps.type === "task-due" ||
    event.extendedProps.type === "qa-due";
}

export function TaskCalendarDayDetails({
  dateKey,
  events,
  onClose,
  onOpenEvent,
}: TaskCalendarDayDetailsProps) {
  const dayLabel = formatDayLabel(dateKey);

  return (
    <aside aria-label={`Details for ${dayLabel}`} className="task-calendar-day-details">
      <header className="task-calendar-day-details-header">
        <div>
          <span className="task-calendar-day-details-eyebrow">Selected day</span>
          <h3>{dayLabel}</h3>
          <p>{formatItemCount(events.length)}</p>
        </div>
        <button className="secondary-action" onClick={onClose} type="button">
          Close
        </button>
      </header>

      {events.length === 0 ? (
        <div className="empty-state task-calendar-day-details-empty">
          <strong>No things due.</strong>
          <p className="section-copy">
            This date has no due tasks, milestones, meetings, or manufacturing items in the current scope.
          </p>
        </div>
      ) : (
        <ul className="task-calendar-day-details-list">
          {events.map((event) => (
            <li className="task-calendar-day-details-item" key={event.id}>
              <div className="task-calendar-day-details-main">
                <span className={`task-calendar-day-details-type ${event.extendedProps.type}`}>
                  {EVENT_TYPE_LABELS[event.extendedProps.type]}
                </span>
                {canOpenEvent(event) ? (
                  <button
                    aria-label={`Open ${event.title}`}
                    className="task-calendar-day-details-title"
                    onClick={() => onOpenEvent(event)}
                    type="button"
                  >
                    {event.title}
                  </button>
                ) : (
                  <span className="task-calendar-day-details-title">
                    {event.title}
                  </span>
                )}
              </div>
              <div className="task-calendar-day-details-meta">
                <span>{formatEventTime(event.start)}</span>
                {event.extendedProps.priority ? <span>{event.extendedProps.priority}</span> : null}
                {event.extendedProps.status ? <span>{event.extendedProps.status}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
