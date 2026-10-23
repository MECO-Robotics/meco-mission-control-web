import type { BootstrapPayload } from "@/types/bootstrap";

export function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  return {
    ...payload,
    actions: payload.actions ?? [],
    materialTransactions: payload.materialTransactions ?? [],
    artifacts: payload.artifacts.map((artifact) => {
      return { ...artifact, uri: artifact.uri ?? "" };
    }),
    meetings: payload.meetings,
    events: payload.events,
    milestones: payload.milestones,
  };
}
