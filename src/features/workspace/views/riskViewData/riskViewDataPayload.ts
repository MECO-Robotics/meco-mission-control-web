import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

export type RiskSeverityFilter = "all" | RiskPayload["severity"];
export type RiskSourceFilter = "all" | RiskPayload["sourceType"];

export interface SelectOption {
  id: string;
  name: string;
}

export const SEVERITY_RANK: Record<RiskPayload["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const ATTACHMENT_TYPE_LABELS: Record<RiskPayload["attachmentType"], string> = {
  project: "Project",
  workstream: "Workflow",
  mechanism: "Mechanism",
  "part-instance": "Part instance",
};

export const RISK_SEVERITY_ORDER = ["high", "medium", "low"] as const;

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

export function buildDefaultRiskPayload(
  bootstrap: BootstrapPayload,
  qaSourceOptions: SelectOption[],
  testSourceOptions: SelectOption[],
  projectAttachmentOptions: SelectOption[],
): RiskPayload {
  const hasQaSources = qaSourceOptions.length > 0;
  const sourceType: RiskPayload["sourceType"] = hasQaSources ? "qa-report" : "test-result";
  const sourceId = hasQaSources ? qaSourceOptions[0]?.id ?? "" : testSourceOptions[0]?.id ?? "";

  return {
    title: "",
    detail: "",
    severity: "medium",
    sourceType,
    sourceId,
    attachmentType: "project",
    attachmentId: projectAttachmentOptions[0]?.id ?? bootstrap.projects[0]?.id ?? "",
    mitigationTaskId: null,
  };
}
