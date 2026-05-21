import type { PlannedAttendanceDay } from "@/types/common";
import type { MemberPayload } from "@/types/payloads";

const ATTENDANCE_DAY_OPTIONS: Array<{ id: PlannedAttendanceDay; label: string }> = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

function toggleAttendanceDay(days: PlannedAttendanceDay[], day: PlannedAttendanceDay) {
  return days.includes(day) ? days.filter((candidate) => candidate !== day) : [...days, day];
}

interface RosterAttendanceFieldsProps {
  value: Pick<
    MemberPayload,
    "plannedWeeklyAttendanceHours" | "plannedAttendanceDays" | "plannedAttendanceNotes"
  >;
  onChange: (
    patch: Pick<
      MemberPayload,
      "plannedWeeklyAttendanceHours" | "plannedAttendanceDays" | "plannedAttendanceNotes"
    >,
  ) => void;
}

export function RosterAttendanceFields({ value, onChange }: RosterAttendanceFieldsProps) {
  const plannedAttendanceDays = value.plannedAttendanceDays ?? [];

  return (
    <>
      <label className="field">
        <span>Planned weekly attendance</span>
        <input
          min={0}
          max={80}
          onChange={(event) =>
            onChange({
              ...value,
              plannedWeeklyAttendanceHours: Math.max(0, Number(event.target.value) || 0),
            })
          }
          step={0.25}
          type="number"
          value={value.plannedWeeklyAttendanceHours ?? 0}
        />
      </label>
      <div className="field modal-wide roster-attendance-days">
        <span>Planned days</span>
        <div className="roster-attendance-day-options">
          {ATTENDANCE_DAY_OPTIONS.map((day) => (
            <label className="checkbox-field roster-attendance-day-option" key={day.id}>
              <input
                checked={plannedAttendanceDays.includes(day.id)}
                onChange={() =>
                  onChange({
                    ...value,
                    plannedAttendanceDays: toggleAttendanceDay(plannedAttendanceDays, day.id),
                  })
                }
                type="checkbox"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </div>
      <label className="field modal-wide">
        <span>Attendance notes</span>
        <textarea
          onChange={(event) =>
            onChange({
              ...value,
              plannedAttendanceNotes: event.target.value,
            })
          }
          rows={2}
          value={value.plannedAttendanceNotes ?? ""}
        />
      </label>
    </>
  );
}
