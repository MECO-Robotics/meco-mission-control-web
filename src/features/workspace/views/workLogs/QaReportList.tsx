import type { CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ReportRecord } from "@/types/recordsReporting";
import { TableCell } from "@/features/workspace/shared/table/workspaceTableChrome";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import "./QaReportList.css";

const QA_REPORT_GRID = "minmax(220px, 2fr) minmax(120px, 1fr) minmax(90px, 0.7fr) minmax(120px, 0.9fr)";

interface QaReportListProps {
  bootstrap: BootstrapPayload;
  reports: ReportRecord[];
  onOpenTask?: (taskId: string) => void;
  onOpenMilestone?: (milestoneId: string) => void;
}

export function QaReportList({ bootstrap, reports, onOpenTask, onOpenMilestone }: QaReportListProps) {
  const gridStyle = { "--workspace-grid-template": QA_REPORT_GRID } as CSSProperties;
  if (reports.length === 0) return <WorkspaceEmptyState title="No QA reports yet" reason="QA reviews recorded for this workspace will appear here." />;

  return (
    <div className="table-shell qa-report-list">
      <div className="ops-table ops-table-header materials-table qa-report-row" style={gridStyle}>
        {(["Report", "Target", "Outcome", "Reviewed"] as const).map((label) => <span className="table-column-title" key={label}>{label}</span>)}
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
              <TableCell label="Outcome" valueClassName="table-cell-pill">{report.result || report.status}</TableCell>
              <TableCell label="Reviewed">{report.reviewedAt || report.createdAt}</TableCell>
            </summary>
            <div className="qa-report-details">
              {taskTargets.map((target) => onOpenTask ? <button className="secondary-action" key={target.id} onClick={() => onOpenTask(target.id)} type="button">Open task</button> : null)}
              {milestoneTargets.map((target) => onOpenMilestone ? <button className="secondary-action" key={target.id} onClick={() => onOpenMilestone(target.id)} type="button">Open milestone</button> : null)}
              {report.evidenceNotes ? <p>Evidence: {report.evidenceNotes}</p> : null}
              {report.participantIds.length ? <p>Participants: {report.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</p> : null}
              {bootstrap.qaFindings.filter((finding) => finding.reportId === report.id).map((finding) => <p key={finding.id}>{finding.title}: {finding.detail}</p>)}
              {report.photoUrl ? <a href={report.photoUrl} rel="noreferrer" target="_blank">View attached evidence</a> : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}
