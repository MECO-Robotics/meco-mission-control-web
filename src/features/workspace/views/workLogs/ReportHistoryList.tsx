import type { BootstrapPayload } from "@/types/bootstrap";
import type { ReportRecord } from "@/types/recordsReporting";

export function ReportHistoryList({ reports, bootstrap, onOpenTask, onOpenMilestone }: { reports: ReportRecord[]; bootstrap: BootstrapPayload; onOpenTask?: (taskId: string) => void; onOpenMilestone?: (milestoneId: string) => void }) {
  if (reports.length === 0) return <p className="muted-copy">No results recorded yet.</p>;
  return (
    <ul className="workspace-report-history" style={{ paddingLeft: "1.25rem" }}>
      {[...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((report) => (
        <li key={report.id} style={{ marginBottom: "0.75rem" }}>
          <details>
            <summary>
              <strong>{report.title || (report.reportType === "QA" ? "QA review" : "Milestone result")}</strong>
              {" · "}{report.result || report.status}{" · "}{report.reviewedAt || report.createdAt}
              {report.reportType === "QA" ? (report.mentorApproved ? " · Mentor approved" : " · Not mentor approved") : ""}
            </summary>
            {report.taskId && onOpenTask ? <button className="secondary-action" type="button" onClick={() => onOpenTask(report.taskId!)}>Open task</button> : null}
            {report.milestoneId && onOpenMilestone ? <button className="secondary-action" type="button" onClick={() => onOpenMilestone(report.milestoneId!)}>Open milestone</button> : null}
            {report.summary ? <p>{report.summary}</p> : null}
            {report.notes ? <p>{report.notes}</p> : null}
            {report.evidenceNotes ? <p>Evidence: {report.evidenceNotes}</p> : null}
            {report.participantIds?.length ? <p>Participants: {report.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</p> : null}
            {report.findings?.length ? <ul>{report.findings.map((finding, index) => <li key={index}>{finding}</li>)}</ul> : null}
            {bootstrap.reportFindings.filter((finding) => finding.reportId === report.id).map((finding) => <p key={finding.id}>{finding.title || finding.issueType}: {finding.detail || finding.notes}{finding.spawnedTaskId ? ` · Follow-up: ${bootstrap.tasks.find((task) => task.id === finding.spawnedTaskId)?.title ?? "Task"}` : ""}</p>)}
            {report.proposedRiskStatus || report.proposedRiskSeverity ? <p>Risk reassessment: {[report.proposedRiskSeverity, report.proposedRiskStatus].filter(Boolean).join(" · ")}</p> : null}
            {report.photoUrl ? <a href={report.photoUrl} target="_blank" rel="noreferrer">View attached evidence</a> : null}
          </details>
        </li>
      ))}
    </ul>
  );
}
