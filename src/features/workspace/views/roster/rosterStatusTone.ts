import type { RosterAvailabilityStatus } from "@/types/rosterInsights";

export function fetchAvailabilityStatusTone(status: RosterAvailabilityStatus) {
  if (status === "available") {
    return "is-available";
  }
  if (status === "at-risk") {
    return "is-at-risk";
  }
  if (status === "overloaded") {
    return "is-overloaded";
  }
  return "is-unavailable";
}
