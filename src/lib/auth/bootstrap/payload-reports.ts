import type { ReportFindingRecord, ReportRecord } from "@/types/recordsReporting";
import { localTodayDate } from "@/lib/dateUtils";
import type { LegacyBootstrapPayload } from "./shared";

export function normalizeBootstrapReports(source: LegacyBootstrapPayload) {
  const reports: ReportRecord[] = (source.reports ?? []).map((report) => ({
    ...report,
    reportType:
      report.reportType === "QA" ||
      report.reportType === "MilestoneTest" ||
      report.reportType === "Practice" ||
      report.reportType === "Competition" ||
      report.reportType === "Review"
        ? report.reportType
        : "QA",
    taskId: report.taskId ?? null,
    milestoneId: report.milestoneId ?? null,
    workstreamId: report.workstreamId ?? null,
    createdByMemberId: report.createdByMemberId ?? null,
    result: report.result ?? "pass",
    summary: report.summary ?? "",
    notes: report.notes ?? "",
    createdAt: report.createdAt ?? localTodayDate(),
  }));

  const reportFindings: ReportFindingRecord[] = (source.reportFindings ?? []).map((finding) => ({
    ...finding,
    mechanismId: finding.mechanismId ?? null,
    partInstanceId: finding.partInstanceId ?? null,
    artifactInstanceId: finding.artifactInstanceId ?? null,
    issueType: finding.issueType ?? finding.title ?? "",
    severity: finding.severity ?? "low",
    notes: finding.notes ?? finding.detail ?? "",
    spawnedTaskId: finding.spawnedTaskId ?? null,
    spawnedIterationId: finding.spawnedIterationId ?? null,
    spawnedRiskId: finding.spawnedRiskId ?? null,
  }));

  return { reports, reportFindings };
}
