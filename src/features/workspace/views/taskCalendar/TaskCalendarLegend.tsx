import type { TaskCalendarEventType } from "./taskCalendarEvents";

interface TaskCalendarLegendItem {
  label: string;
  type: TaskCalendarEventType;
}

const TASK_CALENDAR_LEGEND_ITEMS: TaskCalendarLegendItem[] = [
  { label: "Milestones", type: "milestone" },
  { label: "Task due", type: "task-due" },
  { label: "Waiting QA", type: "qa-due" },
  { label: "Manufacturing due", type: "manufacturing-due" },
  { label: "Meetings / events", type: "event" },
];

export function TaskCalendarLegend() {
  return (
    <div aria-label="Calendar legend" className="task-calendar-legend">
      {TASK_CALENDAR_LEGEND_ITEMS.map((item) => (
        <span className="task-calendar-legend-item" key={item.type}>
          <span
            aria-hidden="true"
            className={`task-calendar-legend-dot task-calendar-legend-dot-${item.type}`}
          />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
