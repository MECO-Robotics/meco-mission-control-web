import type { QaReportPayload, RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

export type QaRiskReassessmentPatch = Partial<Pick<RiskPayload, "severity" | "status">>;

export function buildMentorApprovedQaRiskReassessmentPatch(
  report: Pick<QaReportPayload, "mentorApproved" | "proposedRiskSeverity" | "proposedRiskStatus">,
  risk: RiskRecord,
): QaRiskReassessmentPatch {
  if (!report.mentorApproved) {
    return {};
  }

  return {
    ...(report.proposedRiskSeverity && report.proposedRiskSeverity !== risk.severity
      ? { severity: report.proposedRiskSeverity }
      : {}),
    ...(report.proposedRiskStatus && report.proposedRiskStatus !== risk.status
      ? { status: report.proposedRiskStatus }
      : {}),
  };
}
