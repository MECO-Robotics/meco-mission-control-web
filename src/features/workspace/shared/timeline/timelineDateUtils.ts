import {
  addDaysToLocalDate,
  addMonthsToLocalDate,
  formatLocalDate,
  localTodayDate,
} from "@/lib/dateUtils";

export type TimelineViewInterval = "all" | "week" | "month";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long" });

function formatMonthShortYearFromDay(day: string) {
  const monthLabel = monthLabelFromDay(day);
  const yearShort = day.slice(2, 4);
  return `${monthLabel} '${yearShort}`;
}

function formatMonthDayShortYearFromDay(day: string) {
  const [year, month, monthDay] = day.split("-");
  if (!year || !month || !monthDay) {
    return day;
  }

  return `${Number.parseInt(month, 10)}/${Number.parseInt(monthDay, 10)}/${year.slice(2, 4)}`;
}

function formatMonthDayFromDay(day: string) {
  const [, month, monthDay] = day.split("-");
  if (!month || !monthDay) {
    return day;
  }

  return `${Number.parseInt(month, 10)}/${Number.parseInt(monthDay, 10)}`;
}

export function datePortion(dateTime: string) {
  return dateTime.slice(0, 10);
}

export function timePortion(dateTime: string) {
  return dateTime.length >= 16 ? dateTime.slice(11, 16) : "12:00";
}

export function buildDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

export function compareDateTimes(a: string, b: string) {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return aMs - bMs;
}

export function withColumnOverlayTint(color: string) {
  const rgbaMatch = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i,
  );
  if (!rgbaMatch) {
    return color;
  }

  const alpha = Number.parseFloat(rgbaMatch[4] ?? "0.1");
  const overlayAlpha = Math.min(0.62, alpha + 0.36);
  return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${overlayAlpha})`;
}

export { localTodayDate };

export function addDaysToDay(day: string, dayCount: number) {
  return addDaysToLocalDate(day, dayCount);
}

export function addMonthsToDay(day: string, monthCount: number) {
  return addMonthsToLocalDate(day, monthCount);
}

export function startOfTimelineWeek(day: string) {
  const weekStart = new Date(`${day}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return formatLocalDate(weekStart);
}

export function endOfTimelineWeek(day: string) {
  return addDaysToDay(startOfTimelineWeek(day), 6);
}

export function midpointOfTimelineWeek(day: string) {
  return addDaysToDay(startOfTimelineWeek(day), 3);
}

export function midpointOfTimelineDays(days: string[]) {
  if (days.length === 0) {
    return null;
  }

  return days[Math.floor(days.length / 2)] ?? null;
}

export function monthStartFromDay(day: string) {
  return `${day.slice(0, 7)}-01`;
}

export function monthEndFromDay(day: string) {
  const [yearText, monthText] = day.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const dayCount = new Date(year, month, 0).getDate();
  return `${yearText}-${monthText}-${String(dayCount).padStart(2, "0")}`;
}

export function monthLabelFromDay(day: string) {
  return MONTH_LABEL_FORMATTER.format(new Date(`${day.slice(0, 7)}-01T00:00:00`));
}

export function formatTimelinePeriodLabel(viewInterval: TimelineViewInterval, days: string[]) {
  const startDay = days[0];
  const endDay = days[days.length - 1];
  if (!startDay || !endDay) {
    return viewInterval === "week" ? "No week" : "No month";
  }

  if (viewInterval === "month") {
    return formatMonthShortYearFromDay(startDay);
  }

  if (viewInterval === "week") {
    return `${formatMonthDayFromDay(startDay)} - ${formatMonthDayShortYearFromDay(endDay)}`;
  }

  return "Recent window";
}
