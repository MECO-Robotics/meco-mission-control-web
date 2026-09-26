import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

export interface SelectOption {
  id: string;
  name: string;
}

export const ATTACHMENT_TYPE_LABELS: Record<RiskPayload["attachmentType"], string> = {
  project: "Project",
  workstream: "Workflow",
  mechanism: "Mechanism",
  "part-instance": "Part instance",
};

export function formatRiskSeverity(severity: RiskPayload["severity"]) {
  switch (severity) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return severity;
  }
}

export function getRiskSeverityPillClassName(severity: RiskPayload["severity"]) {
  switch (severity) {
    case "high":
      return "status-pill status-pill-danger";
    case "medium":
      return "status-pill status-pill-warning";
    case "low":
      return "status-pill status-pill-neutral";
    default:
      return "status-pill status-pill-neutral";
  }
}

export function toRiskPayload(risk: RiskRecord): RiskPayload {
  return {
    title: risk.title,
    detail: risk.detail,
    severity: risk.severity,
    sourceType: risk.sourceType,
    sourceId: risk.sourceId,
    attachmentType: risk.attachmentType,
    attachmentId: risk.attachmentId,
    mitigationTaskId: risk.mitigationTaskId,
  };
}

export function sanitizeRiskPayload(payload: RiskPayload): RiskPayload {
  const mitigationTaskId =
    typeof payload.mitigationTaskId === "string" && payload.mitigationTaskId.trim().length > 0
      ? payload.mitigationTaskId.trim()
      : null;

  return {
    ...payload,
    title: payload.title.trim(),
    detail: payload.detail.trim(),
    sourceId: payload.sourceId.trim(),
    attachmentId: payload.attachmentId.trim(),
    mitigationTaskId,
  };
}
