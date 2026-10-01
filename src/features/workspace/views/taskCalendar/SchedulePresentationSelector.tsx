export type SchedulePresentation = "agenda" | "calendar" | "timeline";

const PRESENTATIONS: Array<{ id: SchedulePresentation; label: string }> = [
  { id: "agenda", label: "Agenda" },
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Gantt" },
];

export function SchedulePresentationSelector({
  value,
  onChange,
}: {
  value: SchedulePresentation;
  onChange: (value: SchedulePresentation) => void;
}) {
  return (
    <div
      aria-label="Schedule presentations"
      className="schedule-presentation-tabs timeline-interval-toggle-rail"
      role="group"
    >
      {PRESENTATIONS.map(({ id, label }) => (
        <button
          aria-pressed={value === id}
          className={`timeline-interval-toggle-option${value === id ? " is-active" : ""}`}
          key={id}
          onClick={() => onChange(id)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
