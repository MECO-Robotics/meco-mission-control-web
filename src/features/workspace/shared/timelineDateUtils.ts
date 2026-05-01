import {
  addDaysToLocalDate,
  addMonthsToLocalDate,
  localTodayDate,
} from "@/lib/dateUtils";

export type TimelineViewInterval = "all" | "week" | "month";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long" });
const MONTH_YEAR_LABEL_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});
const PERIOD_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const PERIOD_DATE_WITH_YEAR_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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
    return MONTH_YEAR_LABEL_FORMATTER.format(new Date(`${startDay.slice(0, 7)}-01T00:00:00`));
  }

  if (viewInterval === "week") {
    const startDate = new Date(`${startDay}T00:00:00`);
    const endDate = new Date(`${endDay}T00:00:00`);
    return `${PERIOD_DATE_FORMATTER.format(startDate)} - ${PERIOD_DATE_WITH_YEAR_FORMATTER.format(endDate)}`;
  }

  return "Recent window";
}
