import { Check, CircleSlash, RotateCcw } from "lucide-react";

import type { PartMappingChange, PartMappingDecision } from "./partMappingSyncTypes";

const KIND_LABELS: Record<PartMappingChange["kind"], string> = {
  "new-part": "New part",
  "new-iteration": "New iteration",
  "new-instance": "New placement",
  "deleted-instance": "Removed placement",
  "archived-part": "Archived part",
};

function getChangeTone(kind: PartMappingChange["kind"]) {
  if (kind === "deleted-instance" || kind === "archived-part") {
    return "danger";
  }

  if (kind === "new-iteration") {
    return "warning";
  }

  return "success";
}

export function PartMappingChangeList({
  changes,
  onDecisionChange,
  onResetDecisions,
}: {
  changes: PartMappingChange[];
  onDecisionChange: (changeId: string, decision: PartMappingDecision) => void;
  onResetDecisions: () => void;
}) {
  if (changes.length === 0) {
    return (
      <section className="part-sync-review-panel">
        <p className="empty-state">No mapping changes found in the latest sync.</p>
      </section>
    );
  }

  return (
    <section className="part-sync-review-panel">
      <div className="part-sync-review-header">
        <div>
          <span className="part-sync-eyebrow">Approval queue</span>
          <h3>Mapping changes</h3>
        </div>
        <button className="secondary-button part-sync-icon-button" onClick={onResetDecisions} type="button">
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <div className="part-sync-change-list">
        {changes.map((change) => (
          <article className="part-sync-change-card" data-tone={getChangeTone(change.kind)} key={change.id}>
            <div className="part-sync-change-main">
              <span className="part-sync-change-kind">{KIND_LABELS[change.kind]}</span>
              <strong>{change.title}</strong>
              <small>{change.detail}</small>
              <span>{change.subsystemName} / {change.mechanismName}</span>
            </div>

            <div className="part-sync-decision-group" role="group" aria-label={`${change.title} decision`}>
              <button
                aria-pressed={change.decision === "approved"}
                className="part-sync-decision-button"
                onClick={() => onDecisionChange(change.id, "approved")}
                type="button"
              >
                <Check size={16} />
                Approve
              </button>
              <button
                aria-pressed={change.decision === "denied"}
                className="part-sync-decision-button"
                onClick={() => onDecisionChange(change.id, "denied")}
                type="button"
              >
                <CircleSlash size={16} />
                Deny
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
