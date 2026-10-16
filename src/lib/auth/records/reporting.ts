import type { QaReportPayload, ReportPayload, RiskPayload, TestResultPayload, WorkLogPayload } from "@/types/payloads";
import type { QaFindingRecord, ReportRecord, RiskRecord } from "@/types/recordsReporting";
import type { WorkLogRecord } from "@/types/recordsExecution";
import type { QaRequestRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

export function createWorkLogRecord(
  payload: WorkLogPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<WorkLogRecord, WorkLogPayload>("/work-logs", "POST", payload, onUnauthorized);
}

export function createReportRecord(
  payload: ReportPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ReportRecord, ReportPayload>("/reports", "POST", payload, onUnauthorized);
}

export function createQaReportRecord(
  payload: QaReportPayload,
  onUnauthorized?: () => void,
  localActorMemberId?: string | null,
) {
  return requestItem<ReportRecord, QaReportPayload>("/qa-reports/submit", "POST", payload, onUnauthorized, localActorMemberId);
}

export function createQaRequestRecord(
  payload: Pick<QaRequestRecord, "projectId" | "targetRefs" | "subject" | "mentorId">,
  onUnauthorized?: () => void,
  localActorMemberId?: string | null,
) {
  return requestItem<QaRequestRecord, typeof payload>("/qa-requests", "POST", payload, onUnauthorized, localActorMemberId);
}

export function retestReportFindingRecord(
  findingId: string,
  payload: { operationId: string; sourceType?: "qa" | "test"; result: "pass" | "fail"; notes: string; evidenceNotes?: string; observedAt?: string },
  onUnauthorized?: () => void,
  localActorMemberId?: string | null,
) {
  return requestItem<QaFindingRecord, typeof payload>(
    `/report-findings/${findingId}/retest`,
    "POST",
    payload,
    onUnauthorized,
    localActorMemberId,
  );
}

export function createTestResultRecord(
  payload: TestResultPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export function updateRiskRecord(
  riskId: string,
  payload: Partial<RiskPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<RiskRecord, Partial<RiskPayload>>(
    `/risks/${riskId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createRiskRecord(payload: RiskPayload, onUnauthorized?: () => void) {
  return requestItem<RiskRecord, RiskPayload>("/risks", "POST", payload, onUnauthorized);
}

export function deleteRiskRecord(riskId: string, onUnauthorized?: () => void) {
  return requestItem<RiskRecord, never>(`/risks/${riskId}`, "DELETE", undefined, onUnauthorized);
}
