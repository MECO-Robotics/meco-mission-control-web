const RECENT_FAILURE_WINDOW_DAYS = 14;
const CALENDAR_MS_PER_DAY = 24 * 60 * 60 * 1000;

export const ATTENTION_DUE_SOON_DAYS = 7;

export function formatContextLabel({
  projectName,
  subsystemName,
  workstreamName,
}: {
  projectName?: string;
  subsystemName?: string;
  workstreamName?: string;
}) {
  return [projectName, workstreamName, subsystemName].filter(Boolean).join(" | ") || "Scope unknown";
}

export function formatOwnerLabel(name: string | null | undefined) {
  return name && name.trim().length > 0 ? name : "Unassigned";
}

export function normalizeDateOnly(value: string) {
  return value.includes("T") ? value.slice(0, 10) : value;
}

export function parseAttentionDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value.includes("T") ? value : normalizeDateOnly(value)).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function daysSinceDate(value: string | null | undefined, today = new Date()) {
  const timestamp = parseAttentionDate(value);
  if (timestamp === null) {
    return null;
  }

  const diff = today.getTime() - timestamp;
  return diff >= 0 ? Math.floor(diff / CALENDAR_MS_PER_DAY) : 0;
}

export function daysUntilDate(value: string | null | undefined, today = new Date()) {
  const timestamp = parseAttentionDate(value);
  if (timestamp === null) {
    return null;
  }

  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.floor((timestamp - normalizedToday) / CALENDAR_MS_PER_DAY);
}

export function mergeLatestTimestamp(
  current: string | null | undefined,
  candidate: string | null | undefined,
) {
  const currentTimestamp = parseAttentionDate(current);
  const candidateTimestamp = parseAttentionDate(candidate);

  if (candidateTimestamp === null) {
    return current ?? undefined;
  }

  if (currentTimestamp === null || candidateTimestamp > currentTimestamp) {
    return candidate ?? undefined;
  }

  return current ?? undefined;
}

export function formatAgeLabel(value: string | null | undefined, today = new Date()) {
  const days = daysSinceDate(value, today);
  if (days === null) {
    return null;
  }

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

export function isDateOverdue(value: string, today = new Date()) {
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueDate = new Date(normalizeDateOnly(value)).getTime();
  return dueDate < todayDate;
}

export function isWithinRecentWindow(
  value: string,
  today = new Date(),
  windowDays = RECENT_FAILURE_WINDOW_DAYS,
) {
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) {
    return false;
  }

  const now = today.getTime();
  const daysAgo = (now - target) / CALENDAR_MS_PER_DAY;
  return daysAgo >= 0 && daysAgo <= windowDays;
}
