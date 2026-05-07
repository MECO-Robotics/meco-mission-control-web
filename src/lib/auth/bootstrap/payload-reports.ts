import type { QaFindingRecord, QaReportRecord, ReportFindingRecord, ReportRecord, TestFindingRecord, TestResultRecord } from "@/types/recordsReporting";
import { localTodayDate } from "@/lib/dateUtils";
import type { NormalizedPlanningRecords } from "./planning";
import { resolveProjectAlias, type LegacyBootstrapPayload } from "./shared";

export interface NormalizedBootstrapReports {
  reports: ReportRecord[];
  reportFindings: ReportFindingRecord[];
  qaReports: QaReportRecord[];
  testResults: TestResultRecord[];
  qaFindings: QaFindingRecord[];
  testFindings: TestFindingRecord[];
}

export function normalizeBootstrapReports(
  source: LegacyBootstrapPayload,
  planning: NormalizedPlanningRecords,
): NormalizedBootstrapReports {
  const defaultProjectId = planning.projects[0]?.id ?? "project-default";
  const projectIds = new Set(planning.projects.map((project) => project.id));

  const reports: ReportRecord[] = (
    Array.isArray(source.reports) && source.reports.length > 0
      ? source.reports
      : [
          ...(source.qaReports ?? []).map<ReportRecord>((report) => ({
            ...report,
            reportType: "QA",
            projectId:
              resolveProjectAlias(report.projectId, projectIds, planning.projectIdAliases) ??
              defaultProjectId,
            taskId: report.taskId ?? null,
            milestoneId: null,
            workstreamId: report.workstreamId ?? null,
            createdByMemberId: report.createdByMemberId ?? null,
            result: report.result ?? "pass",
            summary: report.summary ?? report.notes ?? "",
            notes: report.notes ?? "",
            createdAt: report.createdAt ?? report.reviewedAt ?? localTodayDate(),
          })),
          ...(source.testResults ?? []).map<ReportRecord>((result) => ({
            ...result,
            reportType: "MilestoneTest",
            projectId:
              resolveProjectAlias(result.projectId, projectIds, planning.projectIdAliases) ??
              defaultProjectId,
            taskId: result.taskId ?? null,
            milestoneId: result.milestoneId ?? null,
            workstreamId: result.workstreamId ?? null,
            createdByMemberId: result.createdByMemberId ?? null,
            result: result.result ?? result.status ?? "pass",
            summary: result.summary ?? result.title ?? "",
            notes: result.notes ?? result.findings?.join("\n") ?? "",
            createdAt: result.createdAt ?? localTodayDate(),
            title: result.title ?? "",
            status: result.status ?? "pass",
            findings: result.findings ?? [],
          })),
        ]
  ).map((report) => ({
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

  const reportsById = new Map(reports.map((report) => [report.id, report] as const));
  const reportFindings: ReportFindingRecord[] = (
    Array.isArray(source.reportFindings) && source.reportFindings.length > 0
      ? source.reportFindings
      : [
          ...(source.qaFindings ?? []).map<ReportFindingRecord>((finding) => ({
            ...finding,
            reportId: finding.qaReportId ?? "",
            mechanismId: null,
            partInstanceId: null,
            artifactInstanceId: null,
            issueType: finding.title ?? "",
            severity: finding.severity ?? "low",
            notes: finding.detail ?? "",
            spawnedTaskId: finding.taskId ?? null,
            spawnedIterationId: null,
            spawnedRiskId: null,
          })),
          ...(source.testFindings ?? []).map<ReportFindingRecord>((finding) => ({
            ...finding,
            reportId: finding.testResultId ?? "",
            mechanismId: null,
            partInstanceId: null,
            artifactInstanceId: null,
            issueType: finding.title ?? "",
            severity: finding.severity ?? "low",
            notes: finding.detail ?? "",
            spawnedTaskId: finding.taskId ?? null,
            spawnedIterationId: null,
            spawnedRiskId: null,
          })),
        ]
  ).map((finding) => ({
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

  const qaReports = reports.filter((report) => report.reportType === "QA");
  const testResults = reports.filter((report) => report.reportType !== "QA");
  const qaFindings = reportFindings
    .filter((finding) => {
      const report = reportsById.get(finding.reportId);
      return report?.reportType === "QA";
    })
    .map((finding) => {
      const report = reportsById.get(finding.reportId);
      return {
        id: finding.id,
        qaReportId: finding.reportId || null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? defaultProjectId,
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });
  const testFindings = reportFindings
    .filter((finding) => {
      const report = reportsById.get(finding.reportId);
      return report?.reportType !== "QA";
    })
    .map((finding) => {
      const report = reportsById.get(finding.reportId);
      return {
        id: finding.id,
        testResultId: finding.reportId || null,
        milestoneId: finding.milestoneId ?? report?.milestoneId ?? null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? defaultProjectId,
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });

  return {
    reports,
    reportFindings,
    qaReports,
    testResults,
    qaFindings,
    testFindings,
  };
}
