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
