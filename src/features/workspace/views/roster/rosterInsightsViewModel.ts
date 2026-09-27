import type { RosterAvailabilityStatus } from "@/types/rosterInsights";

export function formatHours(hours: number | null | undefined) {
  const safeHours = typeof hours === "number" && Number.isFinite(hours) ? hours : 0;
  return `${safeHours.toFixed(1)}h`;
}

export function formatAvailabilityLabel(status: RosterAvailabilityStatus) {
  if (status === "at-risk") {
    return "At Risk";
  }

  return status[0].toUpperCase() + status.slice(1);
}
