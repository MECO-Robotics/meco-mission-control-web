import type { BootstrapPayload } from "@/types/bootstrap";

export function scopeBootstrapRisks(payload: BootstrapPayload, activeProjectIds: Set<string>) {
  return payload.risks.filter((risk) => activeProjectIds.has(risk.projectId));
}
