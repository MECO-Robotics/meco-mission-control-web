import type { BootstrapPayload } from "@/types/bootstrap";

export function scopeBootstrapRisks(
  payload: BootstrapPayload,
  activeProjectIds: Set<string>,
  scopedWorkstreamIds: Set<string>,
  scopedTaskIds: Set<string>,
  scopedQaReportIds: Set<string>,
  scopedTestResultIds: Set<string>,
) {
  return payload.risks.filter((risk) => {
    if (risk.attachmentType === "project" && !activeProjectIds.has(risk.attachmentId)) {
      return false;
    }

    if (risk.attachmentType === "workstream" && !scopedWorkstreamIds.has(risk.attachmentId)) {
      return false;
    }

    if (risk.mitigationTaskId && !scopedTaskIds.has(risk.mitigationTaskId)) {
      return false;
    }

    if (risk.sourceType === "qa-report" && !scopedQaReportIds.has(risk.sourceId)) {
      return false;
    }

    if (risk.sourceType === "test-result" && !scopedTestResultIds.has(risk.sourceId)) {
      return false;
    }

    return true;
  });
}
