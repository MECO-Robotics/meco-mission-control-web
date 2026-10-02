import type { PlannedAttendanceDay } from "@/types/common";
import { formatLocalDate } from "@/lib/dateUtils";

const WEEK_DAYS: Array<{ key: PlannedAttendanceDay; label: string }> = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

export interface AttendanceWeekDay {
  date: string;
  label: string;
  state: "attended" | "missed" | "upcoming" | "not-scheduled";
}

export function buildAttendanceWeek(
  member: { plannedAttendanceDays?: PlannedAttendanceDay[] | null },
  records: ReadonlyArray<{ date: string; totalHours: number }>,
  today = new Date(),
) {
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const scheduledDays = new Set(member.plannedAttendanceDays ?? []);
  const attendedDates = new Set(records.filter((record) => record.totalHours > 0).map((record) => record.date.slice(0, 10)));
  const todayKey = formatLocalDate(today);
  let completedMeetings = 0;
  let attendedMeetings = 0;

  const days = WEEK_DAYS.map((day, index): AttendanceWeekDay => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateKey = formatLocalDate(date);
    if (!scheduledDays.has(day.key)) return { date: dateKey, label: day.label, state: "not-scheduled" };
    const attended = attendedDates.has(dateKey);
    if (dateKey > todayKey || (dateKey === todayKey && !attended)) {
      return { date: dateKey, label: day.label, state: "upcoming" };
    }
    completedMeetings += 1;
    if (attended) {
      attendedMeetings += 1;
      return { date: dateKey, label: day.label, state: "attended" };
    }
    return { date: dateKey, label: day.label, state: "missed" };
  });

  return {
    days,
    attendedMeetings,
    completedMeetings,
    percentage: completedMeetings === 0 ? null : Math.round((attendedMeetings / completedMeetings) * 100),
  };
}
