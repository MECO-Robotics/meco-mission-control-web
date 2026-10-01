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
    <nav aria-label="Schedule presentations" className="schedule-presentation-tabs">
      {PRESENTATIONS.map(({ id, label }) => (
        <button
          aria-pressed={value === id}
          className={value === id ? "is-active" : ""}
          key={id}
          onClick={() => onChange(id)}
          type="button"
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
