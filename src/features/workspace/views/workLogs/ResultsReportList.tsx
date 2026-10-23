import { type CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ReportRecord } from "@/types/recordsReporting";
import { TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import { FindingRetestAction } from "./FindingRetestAction";
import "./ResultsReportList.css";

const QA_REPORT_GRID = "minmax(220px, 2fr) minmax(120px, 1fr) minmax(90px, 0.7fr) minmax(120px, 0.9fr)";

interface ResultsReportListProps {
  bootstrap: BootstrapPayload;
  entries: ResultsListEntry[];
  canReviewFindings?: boolean;
  localActorMemberId?: string | null;
  operationScope?: string;
  viewScope?: string;
  handleUnauthorized?: () => void;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
  readFinding: (findingId: string, sourceType: "qa" | "test") => Promise<import("@/types/recordsReporting").QaFindingRecord | null>;
  onOpenTask?: (taskId: string) => void;
  onOpenMilestone?: (milestoneId: string) => void;
}

export type ResultsListEntry =
  | { kind: "report"; report: ReportRecord }
  | { kind: "test-finding"; finding: BootstrapPayload["testFindings"][number]; testResult: BootstrapPayload["testResults"][number] | null };

export function ResultsReportList({ bootstrap, entries, canReviewFindings = false, localActorMemberId, operationScope = "local-anonymous", viewScope = "", handleUnauthorized, loadWorkspace, setDataMessage, readFinding, onOpenTask, onOpenMilestone }: ResultsReportListProps) {
  const gridStyle = { "--workspace-grid-template": QA_REPORT_GRID } as CSSProperties;
  if (entries.length === 0) return <WorkspaceEmptyState title="No results yet" reason="QA reports, milestone reports, and test findings recorded for this workspace will appear here." />;

  return (
    <div className="table-shell results-report-list">
      <div className="ops-table ops-table-header materials-table results-report-row" style={gridStyle}>
        {(["Report", "Target", "Outcome", "Date"] as const).map((label) => <span className="table-column-title" key={label}>{label}</span>)}
      </div>
      {entries.map((entry) => {
        const report = entry.kind === "report" ? entry.report : null;
        const finding = entry.kind === "test-finding" ? entry.finding : null;
        const testResult = entry.kind === "test-finding" ? entry.testResult : null;
        const targetRefs = report?.targetRefs ?? (finding?.targetRefs.length ? finding.targetRefs : testResult?.targetRefs ?? []);
        const taskTargets = targetRefs.filter((target) => target.kind === "task");
        const milestoneTargets = targetRefs.filter((target) => target.kind === "milestone");
        const targetNames = targetRefs.map((target) => target.kind === "task"
          ? bootstrap.tasks.find((task) => task.id === target.id)?.title ?? "Task"
          : target.kind === "milestone"
            ? bootstrap.milestones.find((milestone) => milestone.id === target.id)?.title ?? "Milestone"
            : target.id);
        const isQaReport = report?.reportType === "qa";
        const reportTypeLabel = isQaReport
          ? "QA report"
          : report ? milestoneTargets.length > 0 ? "Milestone report" : `${report.reportType} report` : "Test finding";
        const effectiveDate = isQaReport && report?.status === "reviewed"
          ? report.reviewedAt ?? report.createdAt
          : report?.createdAt ?? finding?.createdAt ?? "";
        const outcome = finding
          ? testResult ? `${finding.status} · test ${testResult.status}` : finding.status
          : isQaReport && report
            ? report.status === "reviewed" ? report.result || "Reviewed" : report.status === "submitted" ? "Submitted · waiting for review" : "Draft · not approved"
            : report?.result || report?.status || "Unknown";

        return (
          <details className="results-report-disclosure" key={report ? `report:${report.id}` : finding?.id}>
            <summary className="ops-table ops-row materials-table results-report-row" style={gridStyle}>
              <ResourceRecordCell label="Report" name={report?.summary || finding?.title || reportTypeLabel} subtitle={report ? `${reportTypeLabel}${report.notes ? ` · ${report.notes}` : ""}` : `${reportTypeLabel} · ${testResult?.title ?? "Test result unavailable"}`} />
              <TableCell label="Target">{targetNames.join(", ") || (finding && !testResult ? "Target unavailable" : "Workspace")}</TableCell>
              <TableCell label="Outcome" valueClassName="table-cell-pill">{outcome}</TableCell>
              <TableCell label="Date">{effectiveDate || "Date unavailable"}{isQaReport && report?.status === "reviewed" ? <small className="qa-review-order-note">{typeof report.reviewOrder === "number" ? `Review ${report.reviewOrder}` : "Review order unavailable"}</small> : null}</TableCell>
            </summary>
            <div className="results-report-details">
              {taskTargets.map((target) => onOpenTask ? <button className="secondary-action" key={target.id} onClick={() => onOpenTask(target.id)} type="button">Open task</button> : null)}
              {milestoneTargets.map((target) => onOpenMilestone ? <button className="secondary-action" key={target.id} onClick={() => onOpenMilestone(target.id)} type="button">Open milestone</button> : null)}
              {report ? <>
                <p>Observed: {report.createdAt}</p>
                {report.evidenceNotes ? <p>Evidence: {report.evidenceNotes}</p> : null}
                {isQaReport && report.status === "reviewed" ? <p>Reviewed by: {bootstrap.members.find((member) => member.id === report.reviewedById)?.name ?? "Reviewer unavailable"}</p> : null}
                {isQaReport && report.status === "reviewed" && typeof report.reviewOrder === "number" ? <p>Review {report.reviewOrder}</p> : null}
                {report.participantIds.length ? <p>Participants: {report.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</p> : null}
              </> : null}
              {report && isQaReport ? bootstrap.qaFindings.filter((finding) => finding.reportId === report.id).map((finding) => {
                const inspectedIds = report.inspectedPartInstanceIds;
                const currentPartIds = bootstrap.tasks.filter((task) => taskTargets.some((target) => target.id === task.id)).flatMap((task) => task.partInstanceIds);
                const missingParts = inspectedIds ? currentPartIds.filter((id) => !inspectedIds.includes(id)) : [];
                const verificationUnknown = report.needsReverification === true || !inspectedIds || report.reviewOrder === undefined || (taskTargets.length > 0 && currentPartIds.length === 0);
                const coverageMessage = verificationUnknown
                  ? "This review needs another check before it can be relied on."
                  : missingParts.length
                    ? "Some current parts were added after this review. Check them before closing the finding."
                    : "This review includes the current inspected parts.";
                const needsVerification = finding.status !== "resolved" || verificationUnknown || missingParts.length > 0;
                const correctiveTask = finding.correctiveTaskId ? bootstrap.tasks.find((task) => task.id === finding.correctiveTaskId) : null;
                const linkedRisk = finding.riskId ? bootstrap.risks.find((risk) => risk.id === finding.riskId) : null;
                return <div className="results-finding-details" key={finding.id}>
                  <p><strong>{finding.title}</strong>: {finding.detail} <span className="table-cell-pill">{finding.status}</span></p>
                  <p>{coverageMessage}</p>
                  {typeof report.reviewOrder === "number" ? <p>Review {report.reviewOrder}</p> : null}
                  {correctiveTask ? <p>Follow-up: {onOpenTask ? <button className="secondary-action" type="button" onClick={() => onOpenTask(correctiveTask.id)}>Open {correctiveTask.title}</button> : correctiveTask.title}</p> : null}
                  {linkedRisk ? <p>Linked risk: {linkedRisk.title}</p> : null}
                  {needsVerification || finding.retests?.length ? <FindingRetestAction key={`${viewScope}:qa:${finding.id}`} finding={finding} sourceType="qa" scope={operationScope} viewScope={viewScope} canReview={canReviewFindings} handleUnauthorized={handleUnauthorized} localActorMemberId={localActorMemberId} members={bootstrap.members} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} /> : null}
                </div>;
              }) : null}
              {report?.photoUrl ? <a href={report.photoUrl} rel="noreferrer" target="_blank">View attached evidence</a> : null}
              {finding ? <div className="results-finding-details">
                <p>{finding.detail} <span className="table-cell-pill">{finding.status}</span></p>
                <p>{testResult ? `Test result: ${testResult.title} · ${testResult.status}` : "Test result unavailable"}</p>
                <FindingRetestAction key={`${viewScope}:test:${finding.id}`} finding={finding} sourceType="test" scope={operationScope} viewScope={viewScope} canReview={canReviewFindings} handleUnauthorized={handleUnauthorized} localActorMemberId={localActorMemberId} members={bootstrap.members} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} />
              </div> : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}
