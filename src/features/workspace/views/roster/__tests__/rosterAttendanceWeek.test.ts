/// <reference types="jest" />

import { buildAttendanceWeek } from "../rosterAttendanceWeek";

describe("buildAttendanceWeek", () => {
  it("shows attended, missed, upcoming, and non-meeting days with attendance to date", () => {
    const result = buildAttendanceWeek(
      { plannedAttendanceDays: ["monday", "wednesday", "thursday", "friday"] },
      [
        { date: "2026-10-05", totalHours: 2 },
        { date: "2026-10-06", totalHours: 1 },
      ],
      new Date(2026, 9, 8),
    );

    expect(result.days.map((day) => day.state)).toEqual([
      "attended", "not-scheduled", "missed", "upcoming", "upcoming", "not-scheduled", "not-scheduled",
    ]);
    expect(result.attendedMeetings).toBe(1);
    expect(result.completedMeetings).toBe(2);
    expect(result.percentage).toBe(50);
  });

  it("does not report a percentage until a planned meeting day has passed", () => {
    const result = buildAttendanceWeek(
      { plannedAttendanceDays: ["friday"] },
      [],
      new Date(2026, 9, 8),
    );

    expect(result.days[4].state).toBe("upcoming");
    expect(result.percentage).toBeNull();
  });
});
