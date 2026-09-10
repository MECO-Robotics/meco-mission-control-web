import type { MilestoneRecord } from "@/types/recordsExecution";
import { getMilestoneTypeStyle } from "@/features/workspace/shared/events/eventStyles";
import { formatMilestoneDateTime, formatMilestoneEndDateTime } from "./milestonesViewUtils";

const readinessLabels = { "not ready": "Not ready", blocked: "Blocked", qa: "QA", ready: "Ready" };

export function MilestonesAgendaList({ milestones, onOpenMilestone, projectLabelByMilestoneId }: {
  milestones: MilestoneRecord[];
  onOpenMilestone: (milestone: MilestoneRecord) => void;
  projectLabelByMilestoneId: Record<string, string>;
}) {
  if (milestones.length === 0) return <p className="empty-state">No milestones match these filters.</p>;
  return (
    <ul aria-label="Milestone agenda" style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto" }}>
      {milestones.map((milestone) => (
        <li key={milestone.id} style={{ borderBottom: "1px solid var(--border-base)", padding: "0.75rem 0" }}>
          <button type="button" className="ghost-button" style={{ padding: 0, border: 0, background: "transparent", fontWeight: 700, textAlign: "left", color: "var(--text-title)" }} onClick={() => onOpenMilestone(milestone)}>{milestone.title}</button>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.25rem" }}>
            <time dateTime={milestone.startDateTime}>{formatMilestoneDateTime(milestone.startDateTime)}{milestone.endDateTime ? ` – ${formatMilestoneEndDateTime(milestone.startDateTime, milestone.endDateTime)}` : ""}</time>
            <span className="pill status-pill">{readinessLabels[milestone.status ?? "not ready"]}</span>
            <span>{getMilestoneTypeStyle(milestone.type).label}</span>
            <span>{projectLabelByMilestoneId[milestone.id]}</span>
          </div>
          {milestone.description ? <p className="muted-copy" style={{ margin: "0.25rem 0 0" }}>{milestone.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
