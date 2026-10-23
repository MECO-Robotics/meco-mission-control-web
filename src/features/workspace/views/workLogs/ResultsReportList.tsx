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
  reports: ReportRecord[];
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

export function ResultsReportList({ bootstrap, reports, canReviewFindings = false, localActorMemberId, operationScope = "local-anonymous", viewScope = "", handleUnauthorized, loadWorkspace, setDataMessage, readFinding, onOpenTask, onOpenMilestone }: ResultsReportListProps) {
  const gridStyle = { "--workspace-grid-template": QA_REPORT_GRID } as CSSProperties;
  if (reports.length === 0) return <WorkspaceEmptyState title="No results yet" reason="QA and milestone reports recorded for this workspace will appear here." />;

  return (
    <div className="table-shell results-report-list">
      <div className="ops-table ops-table-header materials-table results-report-row" style={gridStyle}>
        {(["Report", "Target", "Outcome", "Date"] as const).map((label) => <span className="table-column-title" key={label}>{label}</span>)}
      </div>
      {reports.map((report) => {
        const taskTargets = report.targetRefs.filter((target) => target.kind === "task");
        const milestoneTargets = report.targetRefs.filter((target) => target.kind === "milestone");
        const targetNames = report.targetRefs.map((target) => target.kind === "task"
          ? bootstrap.tasks.find((task) => task.id === target.id)?.title ?? "Task"
          : target.kind === "milestone"
            ? bootstrap.milestones.find((milestone) => milestone.id === target.id)?.title ?? "Milestone"
            : target.id);
        const isQaReport = report.reportType === "qa";
        const reportTypeLabel = isQaReport
          ? "QA report"
          : milestoneTargets.length > 0 ? "Milestone report" : `${report.reportType} report`;
        const effectiveDate = isQaReport && report.status === "reviewed"
          ? report.reviewedAt ?? report.createdAt
          : report.createdAt;
        const outcome = isQaReport
          ? report.status === "reviewed" ? report.result || "Reviewed" : report.status === "submitted" ? "Submitted · waiting for review" : "Draft · not approved"
          : report.result || report.status;

        return (
          <details className="results-report-disclosure" key={report.id}>
            <summary className="ops-table ops-row materials-table results-report-row" style={gridStyle}>
              <ResourceRecordCell label="Report" name={report.summary || reportTypeLabel} subtitle={`${reportTypeLabel}${report.notes ? ` · ${report.notes}` : ""}`} />
              <TableCell label="Target">{targetNames.join(", ") || "Workspace"}</TableCell>
              <TableCell label="Outcome" valueClassName="table-cell-pill">{outcome}</TableCell>
              <TableCell label="Date">{effectiveDate || "Date unavailable"}{isQaReport && report.status === "reviewed" ? <small className="qa-review-order-note">{typeof report.reviewOrder === "number" ? `Review ${report.reviewOrder}` : "Review order unavailable"}</small> : null}</TableCell>
            </summary>
            <div className="qa-report-details">
              {taskTargets.map((target) => onOpenTask ? <button className="secondary-action" key={target.id} onClick={() => onOpenTask(target.id)} type="button">Open task</button> : null)}
              {milestoneTargets.map((target) => onOpenMilestone ? <button className="secondary-action" key={target.id} onClick={() => onOpenMilestone(target.id)} type="button">Open milestone</button> : null)}
              <p>Observed: {report.createdAt}</p>
              {report.evidenceNotes ? <p>Evidence: {report.evidenceNotes}</p> : null}
              {isQaReport && report.status === "reviewed" ? <p>Reviewed by: {bootstrap.members.find((member) => member.id === report.reviewedById)?.name ?? "Reviewer unavailable"}</p> : null}
              {isQaReport && report.status === "reviewed" && typeof report.reviewOrder === "number" ? <p>Review {report.reviewOrder}</p> : null}
              {report.participantIds.length ? <p>Participants: {report.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</p> : null}
              {isQaReport ? bootstrap.qaFindings.filter((finding) => finding.reportId === report.id).map((finding) => {
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
                return <div className="qa-finding-details" key={finding.id}>
                  <p><strong>{finding.title}</strong>: {finding.detail} <span className="table-cell-pill">{finding.status}</span></p>
                  <p>{coverageMessage}</p>
                  {typeof report.reviewOrder === "number" ? <p>Review {report.reviewOrder}</p> : null}
                  {correctiveTask ? <p>Follow-up: {onOpenTask ? <button className="secondary-action" type="button" onClick={() => onOpenTask(correctiveTask.id)}>Open {correctiveTask.title}</button> : correctiveTask.title}</p> : null}
                  {linkedRisk ? <p>Linked risk: {linkedRisk.title}</p> : null}
                  {needsVerification || finding.retests?.length ? <FindingRetestAction key={`${viewScope}:qa:${finding.id}`} finding={finding} sourceType="qa" scope={operationScope} viewScope={viewScope} canReview={canReviewFindings} handleUnauthorized={handleUnauthorized} localActorMemberId={localActorMemberId} members={bootstrap.members} loadWorkspace={loadWorkspace} setDataMessage={setDataMessage} readFinding={readFinding} /> : null}
                </div>;
              }) : null}
              {report.photoUrl ? <a href={report.photoUrl} rel="noreferrer" target="_blank">View attached evidence</a> : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}
