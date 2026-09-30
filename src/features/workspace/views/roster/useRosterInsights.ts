import { useEffect, useMemo, useState } from "react";

import { fetchRosterInsights } from "@/lib/auth";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterInsightsResponse } from "@/types/rosterInsights";

import { buildRosterInsightsFromBootstrap } from "./rosterInsightsFallback";
import {
  areRosterInsightsRowsInScope,
  getScopedRosterMemberIds,
} from "./rosterInsightsScope";

export function useRosterInsights({
  bootstrap,
  projectId,
  seasonId,
}: {
  bootstrap: BootstrapPayload;
  projectId: string | null;
  seasonId: string | null;
}) {
  const fallbackInsights = useMemo(
    () => buildRosterInsightsFromBootstrap(bootstrap, { projectId, seasonId }),
    [bootstrap, projectId, seasonId],
  );
  const scopedMemberIds = useMemo(
    () => getScopedRosterMemberIds(bootstrap, { projectId, seasonId }),
    [bootstrap, projectId, seasonId],
  );
  const [remoteInsights, setRemoteInsights] = useState<RosterInsightsResponse | null>(null);

  useEffect(() => {
    let disposed = false;

    setRemoteInsights(null);

    fetchRosterInsights({ projectId, seasonId })
      .then((response) => {
        if (!disposed) {
          if (
            (projectId || seasonId) &&
            !areRosterInsightsRowsInScope(response, scopedMemberIds)
          ) {
            setRemoteInsights(null);
            return;
          }
          setRemoteInsights(response);
        }
      })
      .catch(() => {
        if (!disposed) {
          setRemoteInsights(null);
        }
      });

    return () => {
      disposed = true;
    };
  }, [bootstrap, projectId, scopedMemberIds, seasonId]);

  return {
    insights: remoteInsights ?? fallbackInsights,
  };
}
