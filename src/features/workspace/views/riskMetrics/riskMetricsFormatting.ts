export function formatPercent(ratio: number) {
  return `${Math.round(Math.max(0, ratio) * 100)}%`;
}

export function formatAgeDays(ageDays: number | null, fallback = "unavailable") {
  if (ageDays === null) {
    return fallback;
  }

  if (ageDays <= 0) {
    return "today";
  }

  return `${ageDays}d`;
}

export function formatHours(hours: number) {
  return `${hours.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}h`;
}
