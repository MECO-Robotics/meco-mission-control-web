import { parseLocalDate } from "@/lib/dateUtils";

export function parseAttentionDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  let timestamp: number;
  if (value.includes("T")) {
    timestamp = new Date(value).getTime();
  } else {
    const normalized = value;
    const parts = normalized.split("-").map(Number);
    const localDateTimestamp = parts.length === 3 && parts.every(Number.isInteger)
      ? parseLocalDate(parts.join("-"))?.getTime() ?? null
      : null;
    timestamp = localDateTimestamp ?? new Date(normalized).getTime();
  }

  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isDateOverdue(value: string, today = new Date()) {
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueDate = parseAttentionDate(value);
  if (dueDate === null) {
    return false;
  }

  return dueDate < todayDate;
}
