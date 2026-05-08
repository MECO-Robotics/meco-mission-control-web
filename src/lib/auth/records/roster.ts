import type { RosterInsightsResponse } from "@/types/rosterInsights";

import { requestApi } from "../core/request";

export function fetchRosterInsights(
  args: {
    projectId?: string | null;
    seasonId?: string | null;
  } = {},
  onUnauthorized?: () => void,
) {
  const params = new URLSearchParams();
  if (args.seasonId) {
    params.set("seasonId", args.seasonId);
  }
  if (args.projectId) {
    params.set("projectId", args.projectId);
  }
  const query = params.toString();

  return requestApi<RosterInsightsResponse>(
    `/roster/insights${query ? `?${query}` : ""}`,
    {},
    onUnauthorized,
  );
}
