import { requestApi } from "./core/request";
import { normalizeBootstrapPayload } from "./bootstrap/payload";
import type { BootstrapPayload } from "@/types/bootstrap";

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
