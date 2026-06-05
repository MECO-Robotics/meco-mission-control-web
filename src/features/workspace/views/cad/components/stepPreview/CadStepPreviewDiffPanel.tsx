import { useMemo } from "react";

import type {
  CadHierarchyReview,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepMappingRecord,
  CadStepWarningRecord,
} from "../../model/cadIntegrationTypes";
import {
  buildCadStepPreviewDiffViewModel,
  type CadStepPreviewDiffGroup,
} from "../../model/cadStepPreviewDiffViewModel";

function CadStepPreviewDiffGroupView({ group }: { group: CadStepPreviewDiffGroup }) {
  return (
    <section className="cad-step-preview-group">
      <h4>{group.title}</h4>
      {group.items.length ? (
        <ul className="cad-step-preview-list">
          {group.items.map((item) => (
            <li className="cad-step-preview-item" data-tone={item.tone} key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cad-empty-copy">{group.empty}</p>
      )}
    </section>
  );
}

export function CadStepPreviewDiffPanel({
  diff,
  hierarchyReview,
  mappings,
  onReviewMappings,
  partMatchProposals,
  warnings,
}: {
  diff: CadStepDiff | null;
  hierarchyReview: CadHierarchyReview | null;
  mappings: CadStepMappingRecord[];
  onReviewMappings: () => void;
  partMatchProposals: CadPartMatchProposal[];
  warnings: CadStepWarningRecord[];
}) {
  const groups = useMemo(() => buildCadStepPreviewDiffViewModel({
    diff,
    hierarchyReview,
    mappings,
    partMatchProposals,
    warnings,
  }), [diff, hierarchyReview, mappings, partMatchProposals, warnings]);
  const hasPreviousSnapshot = Boolean(diff?.previousSnapshotId);

  return (
    <section className="cad-card cad-step-preview-card" aria-labelledby="cad-step-preview-title">
      <div className="cad-section-heading cad-step-preview-heading">
        <div>
          <span className="cad-eyebrow">STEP preview diff</span>
          <h3 id="cad-step-preview-title">Review import impact</h3>
        </div>
        <button className="secondary-button compact-action" onClick={onReviewMappings} type="button">
          Review mapping decisions
        </button>
      </div>
      <p className="cad-diff-context">
        {hasPreviousSnapshot
          ? "Preview these STEP-derived changes before finalizing the snapshot."
          : "This first STEP snapshot is compared against an empty baseline before finalizing."}
      </p>
      <div className="cad-step-preview-counts" aria-label="STEP preview diff counts">
        {groups.map((group) => (
          <span className="cad-diff-count" data-status={group.id === "removed" ? "removed" : group.id === "warnings" ? "changed" : "new"} key={group.id}>
            <strong>{group.items.length}</strong>
            {group.title}
          </span>
        ))}
      </div>
      <div className="cad-step-preview-groups">
        {groups.map((group) => <CadStepPreviewDiffGroupView group={group} key={group.id} />)}
      </div>
    </section>
  );
}
