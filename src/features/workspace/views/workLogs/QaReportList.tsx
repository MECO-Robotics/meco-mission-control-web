import { type CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ReportRecord } from "@/types/recordsReporting";
import { TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import { FindingRetestAction } from "./FindingRetestAction";
import "./QaReportList.css";

const QA_REPORT_GRID = "minmax(220px, 2fr) minmax(120px, 1fr) minmax(90px, 0.7fr) minmax(120px, 0.9fr)";

interface QaReportListProps {
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

export function QaReportList({ bootstrap, reports, canReviewFindings = false, localActorMemberId, operationScope = "local-anonymous", viewScope = "", handleUnauthorized, loadWorkspace, setDataMessage, readFinding, onOpenTask, onOpenMilestone }: QaReportListProps) {
  const gridStyle = { "--workspace-grid-template": QA_REPORT_GRID } as CSSProperties;
  if (reports.length === 0) return <WorkspaceEmptyState title="No QA reports yet" reason="QA reviews recorded for this workspace will appear here." />;

  return (
    <div className="table-shell qa-report-list">
      <div className="ops-table ops-table-header materials-table qa-report-row" style={gridStyle}>
        {(["Report", "Target", "Outcome", "Review"] as const).map((label) => <span className="table-column-title" key={label}>{label}</span>)}
      </div>
      {reports.map((report) => {
        const taskTargets = report.targetRefs.filter((target) => target.kind === "task");
        const milestoneTargets = report.targetRefs.filter((target) => target.kind === "milestone");
        const targetNames = report.targetRefs.map((target) => target.kind === "task"
          ? bootstrap.tasks.find((task) => task.id === target.id)?.title ?? "Task"
          : target.kind === "milestone"
            ? bootstrap.milestones.find((milestone) => milestone.id === target.id)?.title ?? "Milestone"
            : target.id);

        return (
          <details className="qa-report-disclosure" key={report.id}>
            <summary className="ops-table ops-row materials-table qa-report-row" style={gridStyle}>
              <ResourceRecordCell label="Report" name={report.summary || "QA review"} subtitle={report.notes || "No notes"} />
              <TableCell label="Target">{targetNames.join(", ") || "Workspace"}</TableCell>
              <TableCell label="Outcome" valueClassName="table-cell-pill">{report.status === "reviewed" ? report.result || "Reviewed" : report.status === "submitted" ? "Submitted · waiting for review" : "Draft · not approved"}</TableCell>
              <TableCell label="Review date">{report.status === "reviewed" ? <>{report.reviewedAt || "Date unavailable"}{typeof report.reviewOrder !== "number" ? <small className="qa-review-order-note">Order unavailable · sorted by review date</small> : null}</> : "Not reviewed"}</TableCell>
            </summary>
            <div className="qa-report-details">
              {taskTargets.map((target) => onOpenTask ? <button className="secondary-action" key={target.id} onClick={() => onOpenTask(target.id)} type="button">Open task</button> : null)}
              {milestoneTargets.map((target) => onOpenMilestone ? <button className="secondary-action" key={target.id} onClick={() => onOpenMilestone(target.id)} type="button">Open milestone</button> : null)}
              <p>Observed: {report.createdAt}</p>
              {report.evidenceNotes ? <p>Evidence: {report.evidenceNotes}</p> : null}
              {report.status === "reviewed" ? <p>Reviewed by: {bootstrap.members.find((member) => member.id === report.reviewedById)?.name ?? "Reviewer unavailable"}</p> : null}
              {report.participantIds.length ? <p>Participants: {report.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</p> : null}
              {bootstrap.qaFindings.filter((finding) => finding.reportId === report.id).map((finding) => {
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
              })}
              {report.photoUrl ? <a href={report.photoUrl} rel="noreferrer" target="_blank">View attached evidence</a> : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}
