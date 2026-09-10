export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function localTodayDate(date = new Date()) {
  return formatLocalDate(date);
}

function parseDateParts(day: string) {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return { year, month, date };
}

export function parseLocalDate(day: string) {
  const { year, month, date } = parseDateParts(day.slice(0, 10));
  const candidate = new Date(year, month - 1, date);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== date
  ) {
    return null;
  }

  return candidate;
}

export function addDaysToLocalDate(day: string, dayCount: number) {
  const { year, month, date } = parseDateParts(day);
  const candidate = new Date(year, month - 1, date, 12);
  candidate.setDate(candidate.getDate() + dayCount);
  return formatLocalDate(candidate);
}

export function addMonthsToLocalDate(day: string, monthCount: number) {
  const { year, month, date } = parseDateParts(day);
  const targetMonthStart = new Date(year, month - 1 + monthCount, 1, 12);
  const targetMonthEnd = new Date(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth() + 1,
    0,
    12,
  );
  targetMonthStart.setDate(Math.min(date, targetMonthEnd.getDate()));
  return formatLocalDate(targetMonthStart);
}
