import { requestApi } from "./core/request";
import { normalizeBootstrapPayload } from "./bootstrap/payload";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { QaFindingRecord } from "@/types/recordsReporting";

export function fetchBootstrap(
  personId?: string | null,
  seasonId?: string | null,
  projectId?: string | null,
  onUnauthorized?: () => void,
) {
  const searchParams = new URLSearchParams();
  if (personId) {
    searchParams.set("personId", personId);
  }
  if (seasonId) {
    searchParams.set("seasonId", seasonId);
  }
  if (projectId) {
    searchParams.set("projectId", projectId);
  }
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return requestApi<BootstrapPayload>(`/bootstrap${query}`, {}, onUnauthorized).then(
    normalizeBootstrapPayload,
  );
}

export async function fetchFindingForRetest(
  findingId: string,
  sourceType: "qa" | "test",
  seasonId: string | null,
  projectId: string | null,
  onUnauthorized?: () => void,
): Promise<QaFindingRecord | null> {
  const bootstrap = await fetchBootstrap(null, seasonId, projectId, onUnauthorized);
  const findings = sourceType === "qa" ? bootstrap.qaFindings : bootstrap.testFindings;
  const finding = findings.find((candidate) => candidate.id === findingId) ?? null;
  return finding && (!projectId || finding.projectId === projectId) ? finding : null;
}

export function startInteractiveTutorialSession(onUnauthorized?: () => void) {
  return requestApi<{ ok: boolean }>(
    "/tutorial/session/start",
    {
      method: "POST",
    },
    onUnauthorized,
  ).then((response) => response.ok);
}

export function resetInteractiveTutorialSession(
  onUnauthorized?: () => void,
  mode: "session" | "baseline" = "session",
) {
  return requestApi<{ ok: boolean }>(
    "/tutorial/session/reset",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode }),
    },
    onUnauthorized,
  ).then((response) => response.ok);
}
