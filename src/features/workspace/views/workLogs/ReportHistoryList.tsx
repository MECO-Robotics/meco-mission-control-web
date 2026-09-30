import type { BootstrapPayload } from "@/types/bootstrap";
import type { ReportRecord } from "@/types/recordsReporting";

export function ReportHistoryList({ reports, bootstrap, onOpenTask, onOpenMilestone }: { reports: ReportRecord[]; bootstrap: BootstrapPayload; onOpenTask?: (taskId: string) => void; onOpenMilestone?: (milestoneId: string) => void }) {
  if (reports.length === 0) return <p className="muted-copy">No results recorded yet.</p>;
  return (
    <ul className="workspace-report-history" style={{ paddingLeft: "1.25rem" }}>
      {reports.map((report) => (
        <li key={report.id} style={{ marginBottom: "0.75rem" }}>
          <details>
            <summary>
                <strong>{report.summary || (report.reportType === "qa" ? "QA review" : "Schedule report")}</strong>
              {" · "}{report.result || report.status}{" · "}{report.reviewedAt || report.createdAt}
            </summary>
            {report.targetRefs.filter((ref) => ref.kind === "task").map((ref) => onOpenTask ? <button className="secondary-action" key={`${ref.kind}:${ref.id}`} type="button" onClick={() => onOpenTask(ref.id)}>Open task</button> : null)}
            {report.targetRefs.filter((ref) => ref.kind === "milestone").map((ref) => onOpenMilestone ? <button className="secondary-action" key={`${ref.kind}:${ref.id}`} type="button" onClick={() => onOpenMilestone(ref.id)}>Open milestone</button> : null)}
            {report.summary ? <p>{report.summary}</p> : null}
            {report.notes ? <p>{report.notes}</p> : null}
            {report.evidenceNotes ? <p>Evidence: {report.evidenceNotes}</p> : null}
            {report.participantIds?.length ? <p>Participants: {report.participantIds.map((id) => bootstrap.members.find((member) => member.id === id)?.name ?? "Unknown member").join(", ")}</p> : null}
            {bootstrap.qaFindings.filter((finding) => finding.reportId === report.id).map((finding) => <p key={finding.id}>{finding.title}: {finding.detail}</p>)}
            {report.photoUrl ? <a href={report.photoUrl} target="_blank" rel="noreferrer">View attached evidence</a> : null}
          </details>
        </li>
      ))}
    </ul>
  );
}
