import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

export interface SelectOption { id: string; name: string }

export function formatRiskSeverity(severity: RiskPayload["severity"]) {
  return severity === "critical" ? "Critical" : severity === "high" ? "High" : severity === "medium" ? "Medium" : "Low";
}

export function getRiskSeverityPillClassName(severity: RiskPayload["severity"]) {
  return severity === "critical" || severity === "high" ? "status-pill status-pill-danger" : severity === "medium" ? "status-pill status-pill-warning" : "status-pill status-pill-neutral";
}

export function toRiskPayload(risk: RiskRecord): RiskPayload {
  return {
    projectId: risk.projectId, title: risk.title, detail: risk.detail,
    category: risk.category, severity: risk.severity, status: risk.status,
    blocksWork: risk.blocksWork, source: risk.source,
    relatedTargets: risk.relatedTargets, mitigationTaskId: risk.mitigationTaskId,
    ownerGroupId: risk.ownerGroupId,
    ownerMemberId: risk.ownerMemberId,
    mitigationDueDate: risk.mitigationDueDate,
  };
}

export function sanitizeRiskPayload(payload: RiskPayload): RiskPayload {
  return sanitizeRiskPatch(payload) as RiskPayload;
}

export function sanitizeRiskPatch(payload: Partial<RiskPayload>): Partial<RiskPayload> {
  const patch = { ...payload };
  if (patch.title !== undefined) patch.title = patch.title.trim();
  if (patch.detail !== undefined) patch.detail = patch.detail.trim();
  for (const key of ["mitigationTaskId", "ownerGroupId", "ownerMemberId", "mitigationDueDate"] as const) {
    if (key in patch) patch[key] = patch[key]?.trim() || null;
  }
  if (patch.relatedTargets !== undefined) patch.relatedTargets = patch.relatedTargets.filter((target) => target.id.trim()).map((target) => ({ ...target, id: target.id.trim() }));
  return patch;
}
