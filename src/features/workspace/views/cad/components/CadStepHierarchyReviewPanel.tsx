import { useEffect, useMemo, useState } from "react";

import type {
  CadHierarchyReview,
  CadHierarchyReviewDecision,
  CadHierarchyTargetKind,
  CadPartMatchProposal,
} from "../model/cadIntegrationTypes";
import { CadStepHierarchyNodeCard } from "./CadStepHierarchyNodeCard";
import {
  cadHierarchyStages,
  compactHierarchyLabel,
  flattenHierarchyNodes,
  hierarchyIssueTitle,
  hierarchySummaryLine,
  type CadHierarchyStage,
  type CadHierarchyTargets,
} from "./CadStepHierarchyReviewUtils";

export type { CadHierarchyStage };

function PartProposalList({ proposals }: { proposals: CadPartMatchProposal[] }) {
  const ambiguous = proposals.filter((proposal) => proposal.status === "AMBIGUOUS" || proposal.status === "SUGGESTED");
  const matched = proposals.filter((proposal) => proposal.status === "EXACT");
  const proposedNew = proposals.filter((proposal) => proposal.status === "NO_MATCH");
  const renderProposal = (proposal: CadPartMatchProposal) => (
    <article key={proposal.id}>
      <strong>{proposal.sourcePartName ?? proposal.cadPartName}</strong>
      <span>{proposal.parentHierarchyName ?? `${proposal.instanceQuantity ?? 0} instances`}</span>
      {proposal.candidates.length ? (
        <ul>
          {proposal.candidates.map((candidate) => (
            <li key={`${proposal.id}-${candidate.partDefinitionId}`}>
              {candidate.label} <small>{compactHierarchyLabel(candidate.confidence)} {candidate.reason ?? candidate.strategy ?? ""}</small>
            </li>
          ))}
        </ul>
      ) : <small>Propose new part definition</small>}
    </article>
  );

  return (
    <div className="cad-hierarchy-proposal-stack">
      <details className="cad-hierarchy-ambiguous" open>
        <summary>High-confidence matches ({matched.length})</summary>
        {matched.length ? matched.map(renderProposal) : <p className="cad-empty-copy">No high-confidence matches.</p>}
      </details>
      <details className="cad-hierarchy-ambiguous" open>
        <summary>Ambiguous matches ({ambiguous.length})</summary>
        {ambiguous.length ? ambiguous.map(renderProposal) : <p className="cad-empty-copy">No ambiguous part matches.</p>}
      </details>
      <details className="cad-hierarchy-ambiguous">
        <summary>Proposed new parts ({proposedNew.length})</summary>
        {proposedNew.length ? proposedNew.map(renderProposal) : <p className="cad-empty-copy">No new part definitions proposed.</p>}
      </details>
    </div>
  );
}

export function CadStepHierarchyReviewPanel({
  hierarchyReview,
  initialStage = "subsystems",
  onConfirmDecision,
  partMatchProposals = [],
  targets,
}: {
  hierarchyReview: CadHierarchyReview;
  initialStage?: CadHierarchyStage;
  onConfirmDecision: (decision: CadHierarchyReviewDecision) => void;
  partMatchProposals?: CadPartMatchProposal[];
  targets: CadHierarchyTargets;
}) {
  const [stage, setStage] = useState<CadHierarchyStage>(initialStage);
  useEffect(() => {
    setStage(initialStage);
  }, [hierarchyReview.snapshotId, initialStage]);

  const allNodes = useMemo(() => flattenHierarchyNodes(hierarchyReview.root), [hierarchyReview.root]);
  const subsystemNodes = hierarchyReview.root?.children ?? [];
  const mechanismNodes = allNodes.filter(
    (node) => node.sourceKind === "ASSEMBLY_NODE" && node.id !== hierarchyReview.root?.id && !subsystemNodes.some((child) => child.id === node.id),
  );
  const partSummaryNodes = allNodes.filter(
    (node) => node.sourceKind === "PART_INSTANCE" && (node.partSummary?.rawInstanceCount ?? 0) > 0,
  );
  const proposals = partMatchProposals.length ? partMatchProposals : hierarchyReview.partMatchProposals;
  const mechanismTargetKind = (classification: string | null): CadHierarchyTargetKind => {
    if (classification === "SUBSYSTEM") {
      return "SUBSYSTEM";
    }
    return classification?.includes("COMPONENT") ? "COMPONENT_ASSEMBLY" : "MECHANISM";
  };

  return (
    <section className="cad-card cad-hierarchy-review">
      <div className="cad-section-heading">
        <span className="cad-eyebrow">Hierarchy mapping</span>
        <h3>Staged STEP review</h3>
      </div>
      <div className="cad-hierarchy-tabs" role="tablist" aria-label="CAD hierarchy review stages">
        {cadHierarchyStages.map((item) => (
          <button
            aria-selected={stage === item.id}
            className="cad-hierarchy-tab"
            key={item.id}
            onClick={() => setStage(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {stage === "subsystems" ? (
        <div className="cad-hierarchy-stage">
          <h4>First layer under root</h4>
          <div className="cad-hierarchy-list">
            {subsystemNodes.map((node) => (
              <CadStepHierarchyNodeCard key={node.id} node={node} onConfirm={onConfirmDecision} targets={targets} targetKind="SUBSYSTEM" />
            ))}
          </div>
        </div>
      ) : null}
      {stage === "mechanisms" ? (
        <div className="cad-hierarchy-stage">
          <h4>Child assemblies</h4>
          <div className="cad-hierarchy-list">
            {mechanismNodes.map((node) => (
              <CadStepHierarchyNodeCard
                key={node.id}
                node={node}
                onConfirm={onConfirmDecision}
                targets={targets}
                targetKind={mechanismTargetKind(node.proposedClassification)}
              />
            ))}
          </div>
        </div>
      ) : null}
      {stage === "parts" ? (
        <div className="cad-hierarchy-stage">
          <h4>Grouped part summaries</h4>
          <p className="cad-hierarchy-summary">{hierarchyReview.root ? hierarchySummaryLine(hierarchyReview.root) : "No parts detected."}</p>
          <div className="cad-hierarchy-list">
            {partSummaryNodes.map((node) => (
              <CadStepHierarchyNodeCard key={node.id} node={node} onConfirm={onConfirmDecision} targets={targets} targetKind="PART_DEFINITION" />
            ))}
          </div>
          <PartProposalList proposals={proposals} />
        </div>
      ) : null}
      {stage === "final" ? (
        <div className="cad-hierarchy-stage">
          <h4>Unresolved issues</h4>
          <div className="cad-hierarchy-warning-list">
            {hierarchyReview.warnings.map((warning, index) => (
              <article data-severity={warning.severity.toLowerCase()} key={`${warning.code}-${warning.sourceId ?? index}`}>
                <strong>{warning.title ?? hierarchyIssueTitle(warning.code)}</strong>
                <span>{warning.message}</span>
                <code>{warning.code}</code>
              </article>
            ))}
            {hierarchyReview.unresolved.length ? hierarchyReview.unresolved.map((issue, index) => (
              <article data-severity={issue.severity.toLowerCase()} key={`unresolved-${issue.code}-${issue.sourceId ?? index}`}>
                <strong>{issue.title ?? hierarchyIssueTitle(issue.code)}</strong>
                <span>{issue.message}</span>
                <code>{issue.code}</code>
              </article>
            )) : <p className="cad-empty-copy">No unresolved hierarchy issues.</p>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
