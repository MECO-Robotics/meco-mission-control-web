import { ModalDialog } from "@/components/ModalDialog";
import { canOpenTaskCalendarEvent, type TaskCalendarEvent, type TaskCalendarEventType } from "./taskCalendarEvents";

interface TaskCalendarDayDetailsProps {
  dateKey: string;
  events: TaskCalendarEvent[];
  onClose: () => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
}

const EVENT_TYPE_LABELS: Record<TaskCalendarEventType, string> = {
  meeting: "Meeting",
  event: "Event (read-only)",
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

export function TaskCalendarDayDetails({
  dateKey,
  events,
  onClose,
  onOpenEvent,
}: TaskCalendarDayDetailsProps) {
  const dayLabel = formatDayLabel(dateKey);

  return (
    <ModalDialog className="modal-scrim workspace-detail-dialog" label={`Details for ${dayLabel}`} onClose={onClose} dismissOnBackdrop>
      <section className="modal-card workspace-detail-card task-calendar-day-details">
        <header className="task-calendar-day-details-header task-details-header">
          <div>
            <h2>{dayLabel}</h2>
            <p>{formatItemCount(events.length)}</p>
          </div>
          <button aria-label="Close day details" className="icon-button task-details-close-button" onClick={onClose} type="button">
            {"\u00D7"}
          </button>
        </header>

        {events.length === 0 ? (
          <div className="empty-state task-calendar-day-details-empty">
            <strong>No things due.</strong>
            <p className="section-copy">
              This date has no tasks, milestones, meetings, or events in the current scope.
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
                  {canOpenTaskCalendarEvent(event) ? (
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
      </section>
    </ModalDialog>
  );
}
