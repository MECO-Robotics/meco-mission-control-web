import { useEffect, useMemo, useState } from "react";

import { fetchRosterInsights } from "@/lib/auth";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterInsightsResponse } from "@/types/rosterInsights";

import { buildRosterInsightsFromBootstrap } from "./rosterInsightsFallback";

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
  const [remoteInsights, setRemoteInsights] = useState<RosterInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    setIsLoading(true);
    setErrorMessage(null);
    setRemoteInsights(null);

    fetchRosterInsights({ projectId, seasonId })
      .then((response) => {
        if (!disposed) {
          setRemoteInsights(response);
        }
      })
      .catch((error) => {
        if (!disposed) {
          const message =
            error instanceof Error && error.message.trim().length > 0
              ? error.message
              : "Roster insights are unavailable right now.";
          setErrorMessage(message);
          setRemoteInsights(null);
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [projectId, seasonId]);

  return {
    errorMessage,
    insights: remoteInsights ?? fallbackInsights,
    isLoading,
    isRemote: remoteInsights !== null,
  };
}
