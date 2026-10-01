import { SegmentedSelector } from "@/features/workspace/shared/topbar";

export type SchedulePresentation = "agenda" | "calendar" | "timeline";

const PRESENTATIONS = [
  { id: "agenda", label: "Agenda" },
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Gantt" },
] satisfies Array<{ id: SchedulePresentation; label: string }>;

export function SchedulePresentationSelector({
  value,
  onChange,
}: {
  value: SchedulePresentation;
  onChange: (value: SchedulePresentation) => void;
}) {
  return (
    <SegmentedSelector
      ariaLabel="Schedule presentations"
      collapsible
      onChange={onChange}
      options={PRESENTATIONS}
      value={value}
    />
  );
}
