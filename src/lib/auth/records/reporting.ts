import type { QaReportPayload, ReportFindingPayload, ReportPayload, RiskPayload, TestResultPayload, WorkLogPayload } from "@/types/payloads";
import type { ReportFindingRecord, ReportRecord, RiskRecord } from "@/types/recordsReporting";
import type { WorkLogRecord } from "@/types/recordsExecution";
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

export function createReportFindingRecord(
  payload: ReportFindingPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ReportFindingRecord, ReportFindingPayload>(
    "/report-findings",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function createQaReportRecord(
  payload: QaReportPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export function createTestResultRecord(
  payload: TestResultPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export function createRiskRecord(payload: RiskPayload, onUnauthorized?: () => void) {
  return requestItem<RiskRecord, RiskPayload>("/risks", "POST", payload, onUnauthorized);
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

export function deleteRiskRecord(riskId: string, onUnauthorized?: () => void) {
  return requestItem<RiskRecord, never>(`/risks/${riskId}`, "DELETE", undefined, onUnauthorized);
}
