export function ScheduleDateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="schedule-date-selector">
      <span>Date</span>
      <input
        aria-label="Go to date"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}
