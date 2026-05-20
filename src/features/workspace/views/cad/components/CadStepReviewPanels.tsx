import { useEffect, useMemo, useState } from "react";

import type { MechanismRecord, PartDefinitionRecord, SubsystemRecord } from "@/types/records";
import type {
  CadHierarchyReview,
  CadHierarchyReviewDecision,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepImportRunRecord,
  CadStepImportSummary,
  CadStepMappingRecord,
  CadStepSnapshotRecord,
  CadStepTreeNode,
  CadStepWarningRecord,
} from "../model/cadIntegrationTypes";
import {
  PLACEHOLDER_PARSER_WARNING_TEXT,
  stepUsesPlaceholderParser,
} from "../model/cadStepParserStatus";
import { CadStepHierarchyReviewPanel, type CadHierarchyStage } from "./CadStepHierarchyReviewPanel";
import { CadStepImportSummaryCard } from "./CadStepImportSummaryCard";
import { CadStepMappingReviewTable, type CadStepMappingConfirmInput } from "./CadStepMappingReviewTable";
import { CadStepTreePanel } from "./CadStepTreePanel";

export function CadStepReviewPanels({
  diff,
  groupRepeatedInstances = true,
  hierarchyReview,
  initialHierarchyStage,
  importRun,
  isFinalizing,
  isSavingMapping,
  latestImportRunId,
  mappings,
  onConfirmHierarchyDecision = () => undefined,
  onConfirmMapping,
  onFinalize,
  onGroupRepeatedInstancesChange = () => undefined,
  partMatchProposals = [],
  snapshot,
  summary,
  targets,
  tree,
  warnings,
}: {
  diff: CadStepDiff | null;
  groupRepeatedInstances?: boolean;
  hierarchyReview?: CadHierarchyReview | null;
  initialHierarchyStage?: CadHierarchyStage;
  importRun: CadStepImportRunRecord | null;
  isFinalizing: boolean;
  isSavingMapping: boolean;
  latestImportRunId: string | null;
  mappings: CadStepMappingRecord[];
  onConfirmHierarchyDecision?: (decision: CadHierarchyReviewDecision) => void;
  onConfirmMapping: (input: CadStepMappingConfirmInput) => void;
  onFinalize: (allowUnresolved: boolean) => void;
  onGroupRepeatedInstancesChange?: (value: boolean) => void;
  partMatchProposals?: CadPartMatchProposal[];
  snapshot: CadStepSnapshotRecord | null;
  summary: CadStepImportSummary | null;
  targets: { subsystems: SubsystemRecord[]; mechanisms: MechanismRecord[]; partDefinitions: PartDefinitionRecord[] };
  tree: CadStepTreeNode[];
  warnings: CadStepWarningRecord[];
}) {
  const [allowUnresolved, setAllowUnresolved] = useState(false);
  const [showAdvancedFlatView, setShowAdvancedFlatView] = useState(false);
  const snapshotId = snapshot?.id ?? null;
  const unresolvedCount = useMemo(
    () => hierarchyReview?.unresolved.length
      ?? mappings.filter((mapping) => mapping.status === "NEEDS_REVIEW" || mapping.targetKind === "UNMAPPED").length,
    [hierarchyReview?.unresolved.length, mappings],
  );
  const usesPlaceholderParser = stepUsesPlaceholderParser({ importRun, summary, warnings });
  const isViewingOlderSnapshot = Boolean(snapshot && latestImportRunId && snapshot.importRunId !== latestImportRunId);

  useEffect(() => {
    setAllowUnresolved(false);
  }, [snapshotId]);

  return (
    <div className="cad-step-review-stack">
      {usesPlaceholderParser ? (
        <section className="cad-parser-alert cad-parser-alert-large" role="alert">
          {PLACEHOLDER_PARSER_WARNING_TEXT}
        </section>
      ) : null}

      <div className="cad-grid cad-grid-three">
        <CadStepImportSummaryCard importRun={importRun} snapshot={snapshot} summary={summary} warnings={warnings} />

        <article className="cad-card cad-status-card">
          <span className="cad-eyebrow">Carry-forward</span>
          <h3>Mapping rules</h3>
          <p>
            {usesPlaceholderParser
              ? "Placeholder output cannot be saved as future mapping rules."
              : "Existing rules propose mappings. Student edits can stay snapshot-only or create a new future rule."}
          </p>
          <dl className="cad-key-values">
            <div><dt>Existing rules</dt><dd>{mappings.filter((mapping) => mapping.rule).length}</dd></div>
            <div><dt>Needs review</dt><dd>{unresolvedCount}</dd></div>
            <div><dt>Previous snapshot</dt><dd>{snapshot?.previousSnapshotId ?? "none"}</dd></div>
          </dl>
        </article>

        <article className="cad-card cad-status-card">
          <span className="cad-eyebrow">Finalize</span>
          <h3>Review gate</h3>
          <p>
            {usesPlaceholderParser
              ? "Finalize is blocked for placeholder STEP output."
              : "Finalize is blocked while required mappings are unresolved unless you explicitly allow unresolved warnings."}
          </p>
          <label className="cad-inline-check">
            <input
              checked={allowUnresolved}
              disabled={usesPlaceholderParser}
              onChange={(event) => setAllowUnresolved(event.target.checked)}
              type="checkbox"
            />
            <span>Finalize with unresolved warnings</span>
          </label>
          <button
            className="secondary-button"
            disabled={!snapshot || isFinalizing || usesPlaceholderParser || (unresolvedCount > 0 && !allowUnresolved)}
            onClick={() => onFinalize(allowUnresolved)}
            type="button"
          >
            {isFinalizing ? "Finalizing..." : "Finalize snapshot"}
          </button>
        </article>
      </div>

      <CadStepTreePanel
        importRun={importRun}
        isViewingOlderSnapshot={isViewingOlderSnapshot}
        tree={tree}
      />

      {hierarchyReview ? (
        <CadStepHierarchyReviewPanel
          hierarchyReview={hierarchyReview}
          initialStage={initialHierarchyStage}
          onConfirmDecision={onConfirmHierarchyDecision}
          partMatchProposals={partMatchProposals}
          targets={targets}
        />
      ) : null}

      {hierarchyReview ? (
        <section className="cad-card cad-advanced-flat-card">
          <div className="cad-section-heading cad-mapping-heading">
            <div>
              <span className="cad-eyebrow">Debug</span>
              <h3>Advanced flat view</h3>
            </div>
            <button
              className="ghost-button compact-action"
              onClick={() => setShowAdvancedFlatView((current) => !current)}
              type="button"
            >
              {showAdvancedFlatView ? "Hide flat table" : "Show flat table"}
            </button>
          </div>
          <p className="cad-empty-copy">Flat mapping table is hidden during staged hierarchy review.</p>
        </section>
      ) : null}

      {!hierarchyReview || showAdvancedFlatView ? (
        <CadStepMappingReviewTable
          groupRepeatedInstances={groupRepeatedInstances}
          isSavingMapping={isSavingMapping}
          mappings={mappings}
          onConfirmMapping={onConfirmMapping}
          onGroupRepeatedInstancesChange={onGroupRepeatedInstancesChange}
          targets={targets}
          usesPlaceholderParser={usesPlaceholderParser}
        />
      ) : null}

      <div className="cad-grid cad-grid-two">
        <section className="cad-card">
          <div className="cad-section-heading">
            <span className="cad-eyebrow">Diff</span>
            <h3>Previous snapshot comparison</h3>
          </div>
          {diff?.previousSnapshotId ? (
            <div className="cad-diff-grid">
              <span>Added assemblies: {diff.addedAssemblies.length}</span>
              <span>Removed assemblies: {diff.removedAssemblies.length}</span>
              <span>Moved assemblies: {diff.movedAssemblies.length}</span>
              <span>Added parts: {diff.addedParts.length}</span>
              <span>Removed parts: {diff.removedParts.length}</span>
              <span>Moved part instances: {diff.movedPartInstances.length}</span>
              <span>Mapping changes: {diff.mappingChanges.length}</span>
              <span>Quantity changes: {diff.quantityChangedPartGroups?.length ?? 0}</span>
              {diff.quantityChangedPartGroups?.map((change) => (
                <span key={`${change.parentAssemblyName ?? "root"}-${change.partName}`}>
                  {change.partName} under {change.parentAssemblyName ?? "root"} quantity changed {change.previousQuantity} {"\u2192"} {change.currentQuantity}
                </span>
              ))}
            </div>
          ) : <p className="cad-empty-copy">Upload another STEP iteration to compare snapshots.</p>}
        </section>

        <section className="cad-card">
          <div className="cad-section-heading">
            <span className="cad-eyebrow">Warnings</span>
            <h3>Import and mapping warnings</h3>
          </div>
          <div className="cad-warning-list">
            {warnings.length ? warnings.map((warning) => (
              <article className="cad-warning-item" data-severity={warning.severity.toLowerCase()} key={warning.id}>
                <strong>{warning.title}</strong>
                <span>{warning.message}</span>
                <code>{warning.code}</code>
              </article>
            )) : <p className="cad-empty-copy">No warnings for this snapshot.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
